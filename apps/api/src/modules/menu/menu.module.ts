import { Module } from '@nestjs/common';
import { MenuController } from './menu.controller';
import { MenuService } from './menu.service';
import { AdminCategoriesController } from './admin/categories/admin-categories.controller';
import { AdminCategoriesService } from './admin/categories/admin-categories.service';

@Module({
  controllers: [MenuController, AdminCategoriesController],
  providers: [MenuService, AdminCategoriesService],
})
export class MenuModule {}
