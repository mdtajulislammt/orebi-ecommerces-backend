import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
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

  @Get('all-order')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all orders with search and pagination' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getAllOrders(
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.orderService.getAllOrders(search, page, limit);
  }

  @Get('my-orders')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user orders' })
  async getMyOrders(@Req() req: any) {
    const userId = req.user.userId;
    return this.orderService.getUserOrders(userId);
  }

  //get single order
  @Get('single/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get single order' })
  async getSingleOrder(@Param('id') id: string) {
    return this.orderService.getSingleOrder(id);
  }
}
