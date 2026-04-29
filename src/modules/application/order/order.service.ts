import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { UserType } from 'prisma/generated';
import { TajulStorage } from 'src/common/lib/Disk/TajulStorage';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrderService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrder(userId: string, dto: CreateOrderDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (user.type !== UserType.CLIENT) {
      throw new BadRequestException('Unauthorized');
    }

    const order = await this.prisma.$transaction(async (tx) => {
      // 1. User check (Just to ensure user exists)
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new NotFoundException('User not found');

      let totalAmount = 0;
      const orderItems = [];

      // 2. Loop through items to validate stock and calculate price
      for (const item of dto.items) {
        const product = await tx.product.findUnique({
          where: { id: item.product_id },
          select: {
            id: true,
            name: true,
            price: true,
            discount_price: true,
            stock: true,
          },
        });

        if (!product) {
          throw new NotFoundException(
            `Product ID ${item.product_id} not found`,
          );
        }

        // Stock validation (Balance skip korleo stock check kora safety-r jonno dorkar)
        if (product.stock < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for ${product.name}`,
          );
        }

        const unitPrice = product.discount_price
          ? Number(product.discount_price)
          : Number(product.price);
        totalAmount += unitPrice * item.quantity;

        orderItems.push({
          product_id: product.id,
          quantity: item.quantity,
          unit_price: unitPrice,
        });

        // 3. Stock update (Decrement)
        await tx.product.update({
          where: { id: product.id },
          data: { stock: { decrement: item.quantity } },
        });
      }

      // 4. Create Order (Balance check skip kora hoyeche)
      const order = await tx.order.create({
        data: {
          user_id: userId,
          total_amount: totalAmount,
          status: 'PENDING',
          items: {
            create: orderItems,
          },
        },
        include: {
          items: {
            include: {
              product: { select: { name: true, thumbnail: true } },
            },
          },
        },
      });

      return order;
    });

    return {
      success: true,
      message: 'Order created successfully',
      data: order,
    };
  }
  async getAllOrders(search?: string, page: number = 1, limit: number = 10) {
    try {
      const skip = (page - 1) * limit;

      // 1. Build dynamic filter
      const where: any = {};

      if (search) {
        where.user = {
          name: {
            contains: search,
            mode: 'insensitive', // Case-insensitive search
          },
        };
      }

      // 2. Fetch data and total count in parallel
      const [orders, total_items] = await Promise.all([
        this.prisma.order.findMany({
          where,
          include: {
            user: {
              // Ensure you include user to get the customer name
              select: { name: true, email: true },
            },
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    thumbnail: true,
                  },
                },
              },
            },
          },
          orderBy: { created_at: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.order.count({ where }),
      ]);

      // 3. URL Transformation & Data Mapping
      const mappedOrders = orders.map((order) => ({
        ...order,
        total_amount: Number(order.total_amount),
        items: order.items.map((item) => ({
          ...item,
          unit_price: Number(item.unit_price),
          product: {
            ...item.product,
            thumbnail: item.product?.thumbnail
              ? TajulStorage.url(item.product.thumbnail)
              : null,
          },
        })),
      }));

      // 4. Calculate Meta Data
      const total_pages = Math.ceil(total_items / limit);

      return {
        success: true,
        message: 'Orders fetched successfully',
        data: mappedOrders,
        meta: {
          total_items,
          total_pages,
          current_page: page,
          limit,
        },
      };
    } catch (error) {
      console.error('Fetch Orders Error:', error);
      throw new InternalServerErrorException('Failed to fetch orders.');
    }
  }

  async getUserOrders(userId: string) {
    try {
      const orders = await this.prisma.order.findMany({
        where: { user_id: userId },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  thumbnail: true,
                },
              },
            },
          },
        },
        orderBy: { created_at: 'desc' },
      });

      // URL Transformation Logic
      const mappedOrders = orders.map((order) => ({
        ...order,
        // Decimal price formatting (Optional but safe for frontend)
        total_amount: Number(order.total_amount),
        items: order.items.map((item) => ({
          ...item,
          unit_price: Number(item.unit_price),
          product: {
            ...item.product,
            // Apnar getAllProducts logic-er motoi path convert kora hoyeche
            thumbnail: item.product?.thumbnail
              ? TajulStorage.url(item.product.thumbnail)
              : null,
          },
        })),
      }));

      return {
        success: true,
        message: 'Orders fetched successfully',
        data: mappedOrders,
      };
    } catch (error) {
      console.error('Fetch Orders Error:', error);
      throw new InternalServerErrorException('Failed to fetch your orders.');
    }
  }
}
