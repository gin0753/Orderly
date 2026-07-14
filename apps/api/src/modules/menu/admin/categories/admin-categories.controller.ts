import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';

import { RequireAdmin } from '../../../auth/decorators/require-admin.decorator';

import { AdminCategoriesService } from './admin-categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { ReorderCategoriesDto } from './dto/reorder-categories.dto';
import { UpdateCategoryAvailabilityDto } from './dto/update-category-availability.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@RequireAdmin()
@Controller('admin/menu/categories')
export class AdminCategoriesController {
  constructor(
    private readonly adminCategoriesService: AdminCategoriesService,
  ) {}

  @Get()
  findAll() {
    return this.adminCategoriesService.findAll();
  }

  @Post()
  create(@Body() dto: CreateCategoryDto) {
    return this.adminCategoriesService.create(dto);
  }

  @Patch('reorder')
  reorder(@Body() dto: ReorderCategoriesDto) {
    return this.adminCategoriesService.reorder(dto);
  }

  @Patch(':categoryId/availability')
  updateAvailability(
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
    @Body() dto: UpdateCategoryAvailabilityDto,
  ) {
    return this.adminCategoriesService.updateAvailability(categoryId, dto);
  }

  @Patch(':categoryId/archive')
  archive(@Param('categoryId', ParseUUIDPipe) categoryId: string) {
    return this.adminCategoriesService.archive(categoryId);
  }

  @Patch(':categoryId')
  update(
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.adminCategoriesService.update(categoryId, dto);
  }
}
