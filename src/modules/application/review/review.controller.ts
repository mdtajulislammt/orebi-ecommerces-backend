import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewService } from './review.service';

@ApiTags('Product Reviews')
@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Add a review to a product' })
  async create(@Req() req: any, @Body() dto: CreateReviewDto) {
    const userId = req.user.userId;
    return this.reviewService.createReview(userId, dto);
  }

  @Get('product/:productId')
  @ApiOperation({ summary: 'Get all reviews for a specific product' })
  async findByProduct(@Param('productId') productId: string) {
    return this.reviewService.getProductReviews(productId);
  }
}
