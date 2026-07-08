import { ConfigService } from '@nestjs/config';
import { AdminRole } from '@prisma/client';

import { PrismaService } from '../../../prisma/prisma.service';
import { AdminJwtStrategy } from './admin-jwt.strategy';

type PrismaMock = {
  adminSession: {
    findFirst: jest.Mock;
  };
};

describe('AdminJwtStrategy', () => {
  let strategy: AdminJwtStrategy;
  let prisma: PrismaMock;

  beforeEach(() => {
    prisma = {
      adminSession: {
        findFirst: jest.fn(),
      },
    };

    const configService = {
      getOrThrow: jest.fn(() => 'test-access-secret'),
    };

    strategy = new AdminJwtStrategy(
      configService as unknown as ConfigService,
      prisma as unknown as PrismaService,
    );
  });

  it('returns the admin when the server-side session remains valid', async () => {
    const payload = {
      sub: 'admin-1',
      sid: 'session-1',
      email: 'admin@orderly.local',
      role: AdminRole.ADMIN,
    };

    prisma.adminSession.findFirst.mockResolvedValue({
      adminUser: {
        id: 'admin-1',
        email: 'admin@orderly.local',
        role: AdminRole.ADMIN,
      },
    });

    await expect(strategy.validate(payload)).resolves.toEqual({
      id: 'admin-1',
      email: 'admin@orderly.local',
      role: AdminRole.ADMIN,
    });

    expect(prisma.adminSession.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'session-1',
        adminUserId: 'admin-1',
        expiresAt: {
          gt: expect.any(Date),
        },
        adminUser: {
          is: {
            isActive: true,
          },
        },
      },
      select: {
        adminUser: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });
  });

  it('rejects a valid-looking JWT when its server-side session was revoked', async () => {
    prisma.adminSession.findFirst.mockResolvedValue(null);

    await expect(
      strategy.validate({
        sub: 'admin-1',
        sid: 'revoked-session',
        email: 'admin@orderly.local',
        role: AdminRole.ADMIN,
      }),
    ).rejects.toThrow('Authentication required.');
  });

  it('rejects a token when the server-side role no longer matches', async () => {
    prisma.adminSession.findFirst.mockResolvedValue({
      adminUser: {
        id: 'admin-1',
        email: 'admin@orderly.local',
        role: 'REVOKED_ROLE',
      },
    });

    await expect(
      strategy.validate({
        sub: 'admin-1',
        sid: 'session-1',
        email: 'admin@orderly.local',
        role: AdminRole.ADMIN,
      }),
    ).rejects.toThrow('Authentication required.');
  });
});
