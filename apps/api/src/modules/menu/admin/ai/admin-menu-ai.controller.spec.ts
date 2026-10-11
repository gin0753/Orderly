import { GUARDS_METADATA } from '@nestjs/common/constants';

import { AdminJwtAuthGuard } from '../../../auth/guards/admin-jwt-auth.guard';
import { AdminRolesGuard } from '../../../auth/guards/admin-roles.guard';
import { AdminMenuAiController } from './admin-menu-ai.controller';
import { AdminMenuAiService } from './admin-menu-ai.service';

describe('AdminMenuAiController capability', () => {
  it('keeps capability discovery behind the existing admin guards', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, AdminMenuAiController)).toEqual(
      [AdminJwtAuthGuard, AdminRolesGuard],
    );
  });

  it('returns only the service capability response', () => {
    const service = { getCapability: jest.fn(() => ({ available: false })) };
    const controller = new AdminMenuAiController(
      service as unknown as AdminMenuAiService,
    );
    expect(controller.getCapability()).toEqual({ available: false });
    expect(service.getCapability).toHaveBeenCalledTimes(1);
  });
});
