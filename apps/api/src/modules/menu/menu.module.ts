import { Module } from '@nestjs/common';
import { MenuController } from './menu.controller';
import { MenuService } from './menu.service';
import { AdminCategoriesController } from './admin/categories/admin-categories.controller';
import { AdminCategoriesService } from './admin/categories/admin-categories.service';
import { AdminProductsController } from './admin/products/admin-products.controller';
import { AdminProductsService } from './admin/products/admin-products.service';

@Module({
  controllers: [
    MenuController,
    AdminCategoriesController,
    AdminProductsController,
  ],
  providers: [MenuService, AdminCategoriesService, AdminProductsService],
})
export class MenuModule {}
