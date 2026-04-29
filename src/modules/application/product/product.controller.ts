import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RolesGuard } from 'src/common/guard/role/roles.guard';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductService } from './product.service';

@ApiTags('Products')
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create new product (Admin Only)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'thumbnail', maxCount: 1 },
      { name: 'images', maxCount: 10 },
    ]),
  )
  create(
    @Body() dto: CreateProductDto,
    @Req() req: any,
    @UploadedFiles()
    files: {
      thumbnail?: Express.Multer.File[];
      images?: Express.Multer.File[];
    },
  ) {
    const admin_id = req.user.userId;
    console.log(req.user);

    return this.productService.createProduct(admin_id, dto, files);
  }

  @Get('all')
  @ApiOperation({
    summary: 'Get all products with advanced filtering, search, and pagination',
  })
  // Swagger Documentation for Query Parameters
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by product name or description',
  })
  @ApiQuery({
    name: 'category_id',
    required: false,
    type: String,
    description: 'Filter by category ID',
  })
  @ApiQuery({
    name: 'brand_id',
    required: false,
    type: String,
    description: 'Filter by brand ID',
  })
  @ApiQuery({
    name: 'color',
    required: false,
    type: String,
    description: 'Filter by specific color',
  })
  @ApiQuery({
    name: 'min_price',
    required: false,
    type: Number,
    description: 'Minimum price filter',
  })
  @ApiQuery({
    name: 'max_price',
    required: false,
    type: Number,
    description: 'Maximum price filter',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 12 })
  @ApiResponse({ status: 200, description: 'Returns paginated products list' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async findAll(@Query() query: any) {
    return await this.productService.getAllProducts(query);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get a single product by slug' })
  async findOne(@Param('slug') slug: string) {
    return await this.productService.getSingleProduct(slug);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Delete product (Admin Only)' })
  remove(@Param('id') id: string) {
    return this.productService.deleteProduct(id);
  }
}
