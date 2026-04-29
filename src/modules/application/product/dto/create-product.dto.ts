import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'Premium Wireless Headphones' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'High-quality sound with noise cancellation.' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 89.99 })
  @Type(() => Number) // String-ke Number-e convert korbe
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ example: 44.0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  discount_price?: number;

  @ApiProperty({ example: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock: number;

  @ApiProperty({ example: 'category_id_here' })
  @IsString()
  @IsNotEmpty()
  category_id: string;

  @ApiProperty({ example: 'brand_id_here' })
  @IsString()
  @IsNotEmpty()
  brand_id: string;

  // Swager visualization for file upload
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Thumbnail image file',
  })
  @IsOptional() // File interceptor handle korbe, tai body validator-e optional rakha bhalo
  thumbnail: any;

  @ApiProperty({
    type: 'array',
    items: { type: 'string', format: 'binary' },
    description: 'Gallery image files',
  })
  @IsOptional()
  images: any;

  @ApiPropertyOptional({ type: [String], example: ['Black', 'Silver'] })
  @IsOptional()
  @Transform(({ value }) =>
    Array.isArray(value) ? value : value ? [value] : [],
  ) // String asle array korbe
  colors?: string[];

  @ApiPropertyOptional({ type: [String], example: ['XL', 'M'] })
  @IsOptional()
  @Transform(({ value }) =>
    Array.isArray(value) ? value : value ? [value] : [],
  )
  sizes?: string[];
}
