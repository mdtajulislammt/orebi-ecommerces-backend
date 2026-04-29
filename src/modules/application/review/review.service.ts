import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewService {
  constructor(private readonly prisma: PrismaService) {}

  async createReview(userId: string, dto: CreateReviewDto) {

    const product = await this.prisma.product.findUnique({
      where: { id: dto.product_id },
    });
    if (!product) throw new NotFoundException('Product not found');

    const existingReview = await this.prisma.review.findFirst({
      where: {
        user_id: userId,
        product_id: dto.product_id,
      },
    });
    if (existingReview) {
      throw new BadRequestException('You have already reviewed this product');
    }
    const review = await this.prisma.review.create({
      data: {
        rating: dto.rating,
        comment: dto.comment,
        user_id: userId,
        product_id: dto.product_id,
      },
      include: {
        user: {
          select: { name: true, avatar: true },
        },
      },
    });

    return {
      success: true,
      message: 'Review created successfully',
      data: review,
    };
  }

  async getProductReviews(productId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { product_id: productId },
      include: {
        user: {
          select: { name: true, avatar: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    const formatedData= reviews.map((review)=>{
      return{
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        user: review.user,
        created_at: review.created_at,
        time_ago: review.created_at
      }
    })

    return {
      success: true,
      message: 'Reviews fetched successfully',
      data: formatedData,
    };
  }
}
