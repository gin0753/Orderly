import { Module } from '@nestjs/common';
import { MenuController } from './menu.controller';
import { MenuService } from './menu.service';
import { AdminCategoriesController } from './admin/categories/admin-categories.controller';
import { AdminCategoriesService } from './admin/categories/admin-categories.service';
import { AdminProductsController } from './admin/products/admin-products.controller';
import { AdminProductsService } from './admin/products/admin-products.service';
import { AdminMenuAiController } from './admin/ai/admin-menu-ai.controller';
import { AdminMenuAiService } from './admin/ai/admin-menu-ai.service';

@Module({
  controllers: [
    MenuController,
    AdminCategoriesController,
    AdminProductsController,
    AdminMenuAiController,
  ],
  providers: [
    MenuService,
    AdminCategoriesService,
    AdminProductsService,
    AdminMenuAiService,
  ],
})
export class MenuModule {}
