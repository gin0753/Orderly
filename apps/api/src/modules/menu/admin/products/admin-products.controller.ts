import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';

import { RequireAdmin } from '../../../auth/decorators/require-admin.decorator';

import { AdminProductsService } from './admin-products.service';
import { AdminProductsQueryDto } from './dto/admin-products-query.dto';
import { CreateProductDto } from './dto/create-product.dto';

@RequireAdmin()
@Controller('admin/menu/products')
export class AdminProductsController {
  constructor(private readonly adminProductsService: AdminProductsService) {}

  @Get()
  findAll(@Query() query: AdminProductsQueryDto) {
    return this.adminProductsService.findAll(query);
  }

  @Get(':productId')
  findOne(
    @Param('productId', ParseUUIDPipe)
    productId: string,
  ) {
    return this.adminProductsService.findOne(productId);
  }

  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.adminProductsService.create(dto);
  }
}
