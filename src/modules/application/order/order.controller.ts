import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderService } from './order.service';

@ApiTags('Orders')
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post('buy')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Purchase products using wallet balance' })
  async placeOrder(@Req() req: any, @Body() dto: CreateOrderDto) {
    const userId = req.user.userId;
    const order = await this.orderService.createOrder(userId, dto);

    return {
      success: true,
      message: 'Order created successfully',
      data: order,
    };
  }

@Get("all-order")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all orders with search and pagination' })
  async getAllOrders(
    @Query('search') search?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.orderService.getAllOrders(search, Number(page), Number(limit));
  }

  @Get('my-orders')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user orders' })
  async getMyOrders(@Req() req: any) {
    const userId = req.user.userId;
    return this.orderService.getUserOrders(userId);
  }
}
