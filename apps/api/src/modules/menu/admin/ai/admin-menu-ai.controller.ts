import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { RequireAdmin } from '../../../auth/decorators/require-admin.decorator';

import { AdminMenuAiService } from './admin-menu-ai.service';
import { ContentSuggestionDto } from './dto/content-suggestion.dto';

@RequireAdmin()
@Controller('admin/menu/ai')
export class AdminMenuAiController {
  constructor(private readonly adminMenuAiService: AdminMenuAiService) {}

  @Post('content-suggestion')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  createContentSuggestion(@Body() dto: ContentSuggestionDto) {
    return this.adminMenuAiService.createContentSuggestion(dto);
  }
}
