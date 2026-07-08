import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, type TestingModule } from '@nestjs/testing';
import { AdminRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from './auth.service';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

type PrismaMock = {
  adminUser: {
    findUnique: jest.Mock;
  };
  adminSession: {
    create: jest.Mock;
    update: jest.Mock;
    findUnique: jest.Mock;
    updateMany: jest.Mock;
    deleteMany: jest.Mock;
  };
};

type JwtServiceMock = {
  signAsync: jest.Mock;
  verifyAsync: jest.Mock;
};

type ConfigServiceMock = {
  get: jest.Mock;
  getOrThrow: jest.Mock;
};

type AdminFixture = {
  id: string;
  email: string;
  passwordHash: string;
  role: AdminRole;
  isActive: boolean;
};

const NOW = new Date('2026-07-06T00:00:00.000Z');

const bcryptCompareMock = bcrypt.compare as unknown as jest.Mock<
  Promise<boolean>,
  [plainText: string, hash: string]
>;

const bcryptHashMock = bcrypt.hash as unknown as jest.Mock<
  Promise<string>,
  [plainText: string, saltRounds: number]
>;

function createAdmin(overrides: Partial<AdminFixture> = {}): AdminFixture {
  return {
    id: 'admin-1',
    email: 'admin@orderly.local',
    passwordHash: 'stored-password-hash',
    role: AdminRole.ADMIN,
    isActive: true,
    ...overrides,
  };
}

function createRefreshPayload(
  overrides: Partial<{
    sub: string;
    sid: string;
    email: string;
    role: AdminRole;
    version: number;
  }> = {},
) {
  return {
    sub: 'admin-1',
    sid: 'session-1',
    email: 'admin@orderly.local',
    role: AdminRole.ADMIN,
    version: 0,
    ...overrides,
  };
}

function createRefreshSession(
  overrides: Partial<{
    id: string;
    adminUserId: string;
    refreshTokenHash: string;
    refreshTokenVersion: number;
    expiresAt: Date;
    adminUser: {
      id: string;
      email: string;
      role: AdminRole;
      isActive: boolean;
    };
  }> = {},
) {
  const admin = createAdmin();

  return {
    id: 'session-1',
    adminUserId: admin.id,
    refreshTokenHash: 'stored-refresh-token-hash',
    refreshTokenVersion: 0,
    expiresAt: new Date('2026-07-13T00:00:00.000Z'),
    adminUser: {
      id: admin.id,
      email: admin.email,
      role: admin.role,
      isActive: admin.isActive,
    },
    ...overrides,
  };
}

describe('AuthService', () => {
  let moduleRef: TestingModule;
  let service: AuthService;

  let prisma: PrismaMock;
  let jwtService: JwtServiceMock;
  let configService: ConfigServiceMock;

  beforeEach(async () => {
    jest.resetAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(NOW);

    prisma = {
      adminUser: {
        findUnique: jest.fn(),
      },
      adminSession: {
        create: jest.fn(),
        update: jest.fn(),
        findUnique: jest.fn(),
        updateMany: jest.fn(),
        deleteMany: jest.fn(),
      },
    };

    jwtService = {
      signAsync: jest.fn(),
      verifyAsync: jest.fn(),
    };

    configService = {
      get: jest.fn((key: string) => {
        if (key === 'NODE_ENV') {
          return 'test';
        }

        return undefined;
      }),
      getOrThrow: jest.fn((key: string) => {
        const values: Record<string, string> = {
          JWT_ACCESS_SECRET: 'test-access-secret',
          JWT_REFRESH_SECRET: 'test-refresh-secret',
          JWT_ACCESS_TTL: '15m',
          JWT_REFRESH_TTL: '7d',
          JWT_REFRESH_TTL_DAYS: '7',
        };

        const value = values[key];

        if (!value) {
          throw new Error(`Missing config value: ${key}`);
        }

        return value;
      }),
    };

    moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
        {
          provide: ConfigService,
          useValue: configService,
        },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
  });

  afterEach(async () => {
    await moduleRef.close();
    jest.useRealTimers();
  });

  describe('login', () => {
    it('creates a session and returns a token pair for valid credentials', async () => {
      const admin = createAdmin();

      prisma.adminUser.findUnique.mockResolvedValue(admin);
      prisma.adminSession.create.mockResolvedValue({
        id: 'session-1',
        refreshTokenVersion: 0,
      });
      prisma.adminSession.update.mockResolvedValue({});

      bcryptCompareMock.mockResolvedValue(true);
      bcryptHashMock.mockResolvedValue('new-refresh-token-hash');

      jwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      const result = await service.login({
        email: '  ADMIN@ORDERLY.LOCAL ',
        password: 'correct-password',
      });

      expect(result).toEqual({
        user: {
          id: admin.id,
          email: admin.email,
          role: AdminRole.ADMIN,
        },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });

      expect(prisma.adminUser.findUnique).toHaveBeenCalledWith({
        where: {
          email: 'admin@orderly.local',
        },
        select: {
          id: true,
          email: true,
          passwordHash: true,
          role: true,
          isActive: true,
        },
      });

      expect(prisma.adminSession.create).toHaveBeenCalledWith({
        data: {
          adminUserId: admin.id,
          refreshTokenHash: '',
          expiresAt: new Date('2026-07-13T00:00:00.000Z'),
        },
      });

      expect(jwtService.signAsync).toHaveBeenNthCalledWith(
        1,
        {
          sub: admin.id,
          sid: 'session-1',
          email: admin.email,
          role: AdminRole.ADMIN,
        },
        {
          secret: 'test-access-secret',
          expiresIn: 15 * 60,
        },
      );

      expect(jwtService.signAsync).toHaveBeenNthCalledWith(
        2,
        {
          sub: admin.id,
          sid: 'session-1',
          email: admin.email,
          role: AdminRole.ADMIN,
          version: 0,
        },
        {
          secret: 'test-refresh-secret',
          expiresIn: 7 * 24 * 60 * 60,
        },
      );

      expect(prisma.adminSession.update).toHaveBeenCalledWith({
        where: {
          id: 'session-1',
        },
        data: {
          refreshTokenHash: 'new-refresh-token-hash',
        },
      });
    });

    it('returns a generic error when the admin email does not exist', async () => {
      prisma.adminUser.findUnique.mockResolvedValue(null);

      await expect(
        service.login({
          email: 'unknown@orderly.local',
          password: 'some-password',
        }),
      ).rejects.toThrow('Invalid email or password.');

      expect(bcryptCompareMock).not.toHaveBeenCalled();
    });

    it('returns the same generic error when the password is incorrect', async () => {
      prisma.adminUser.findUnique.mockResolvedValue(createAdmin());
      bcryptCompareMock.mockResolvedValue(false);

      await expect(
        service.login({
          email: 'admin@orderly.local',
          password: 'wrong-password',
        }),
      ).rejects.toThrow('Invalid email or password.');

      expect(prisma.adminSession.create).not.toHaveBeenCalled();
    });

    it('does not allow inactive admins to log in', async () => {
      prisma.adminUser.findUnique.mockResolvedValue(
        createAdmin({
          isActive: false,
        }),
      );

      await expect(
        service.login({
          email: 'admin@orderly.local',
          password: 'correct-password',
        }),
      ).rejects.toThrow('Invalid email or password.');

      expect(bcryptCompareMock).not.toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('rotates the refresh token and increments its version', async () => {
      const session = createRefreshSession();

      jwtService.verifyAsync.mockResolvedValue(createRefreshPayload());

      prisma.adminSession.findUnique.mockResolvedValue(session);
      prisma.adminSession.updateMany.mockResolvedValue({
        count: 1,
      });

      bcryptCompareMock.mockResolvedValue(true);
      bcryptHashMock.mockResolvedValue('rotated-refresh-token-hash');

      jwtService.signAsync
        .mockResolvedValueOnce('next-access-token')
        .mockResolvedValueOnce('next-refresh-token');

      const result = await service.refresh('current-refresh-token');

      expect(result).toEqual({
        user: {
          id: 'admin-1',
          email: 'admin@orderly.local',
          role: AdminRole.ADMIN,
        },
        accessToken: 'next-access-token',
        refreshToken: 'next-refresh-token',
      });

      expect(jwtService.verifyAsync).toHaveBeenCalledWith(
        'current-refresh-token',
        {
          secret: 'test-refresh-secret',
        },
      );

      expect(prisma.adminSession.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'session-1',
          refreshTokenVersion: 0,
        },
        data: {
          refreshTokenHash: 'rotated-refresh-token-hash',
          refreshTokenVersion: {
            increment: 1,
          },
          expiresAt: new Date('2026-07-13T00:00:00.000Z'),
        },
      });
    });

    it('deletes the session when an old refresh token is replayed', async () => {
      jwtService.verifyAsync.mockResolvedValue(
        createRefreshPayload({
          version: 0,
        }),
      );

      prisma.adminSession.findUnique.mockResolvedValue(
        createRefreshSession({
          refreshTokenVersion: 1,
        }),
      );

      await expect(service.refresh('replayed-refresh-token')).rejects.toThrow(
        'Refresh token is no longer valid.',
      );

      expect(bcryptCompareMock).not.toHaveBeenCalled();

      expect(prisma.adminSession.deleteMany).toHaveBeenCalledWith({
        where: {
          id: 'session-1',
        },
      });
    });

    it('deletes the session when the refresh token hash does not match', async () => {
      jwtService.verifyAsync.mockResolvedValue(createRefreshPayload());

      prisma.adminSession.findUnique.mockResolvedValue(createRefreshSession());

      bcryptCompareMock.mockResolvedValue(false);

      await expect(service.refresh('tampered-refresh-token')).rejects.toThrow(
        'Refresh token is no longer valid.',
      );

      expect(prisma.adminSession.deleteMany).toHaveBeenCalledWith({
        where: {
          id: 'session-1',
        },
      });

      expect(prisma.adminSession.updateMany).not.toHaveBeenCalled();
    });

    it('deletes the session when it has expired in the database', async () => {
      jwtService.verifyAsync.mockResolvedValue(createRefreshPayload());

      prisma.adminSession.findUnique.mockResolvedValue(
        createRefreshSession({
          expiresAt: new Date('2026-07-05T23:59:59.000Z'),
        }),
      );

      await expect(service.refresh('expired-refresh-token')).rejects.toThrow(
        'Session has expired.',
      );

      expect(prisma.adminSession.deleteMany).toHaveBeenCalledWith({
        where: {
          id: 'session-1',
        },
      });
    });

    it('fails safely when refresh rotation loses a concurrent update race', async () => {
      jwtService.verifyAsync.mockResolvedValue(createRefreshPayload());

      prisma.adminSession.findUnique.mockResolvedValue(createRefreshSession());

      bcryptCompareMock.mockResolvedValue(true);
      bcryptHashMock.mockResolvedValue('rotated-refresh-token-hash');

      jwtService.signAsync
        .mockResolvedValueOnce('next-access-token')
        .mockResolvedValueOnce('next-refresh-token');

      prisma.adminSession.updateMany.mockResolvedValue({
        count: 0,
      });

      await expect(service.refresh('current-refresh-token')).rejects.toThrow(
        'Session refresh failed.',
      );
    });
  });

  describe('logout', () => {
    it('deletes the current refresh session', async () => {
      jwtService.verifyAsync.mockResolvedValue(createRefreshPayload());

      await expect(
        service.logout('current-refresh-token'),
      ).resolves.toBeUndefined();

      expect(prisma.adminSession.deleteMany).toHaveBeenCalledWith({
        where: {
          id: 'session-1',
        },
      });
    });

    it('remains successful when the refresh token is invalid', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

      await expect(
        service.logout('invalid-refresh-token'),
      ).resolves.toBeUndefined();

      expect(prisma.adminSession.deleteMany).not.toHaveBeenCalled();
    });
  });
});
