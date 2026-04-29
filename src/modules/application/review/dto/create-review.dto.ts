import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({ example: 5, description: 'Rating between 1 to 5' })
  @IsInt()
  @Min(1)
  @Max(5)
  @IsNotEmpty()
  rating: number;

  @ApiPropertyOptional({ example: 'Absolutely love these headphones! The sound quality is incredible.' })
  @IsString()
  @IsOptional()
  comment?: string;

  @ApiProperty({ example: 'product_cuid_here' })
  @IsString()
  @IsNotEmpty()
  product_id: string;
}