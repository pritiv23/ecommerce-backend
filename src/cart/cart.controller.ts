import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { ApiBearerAuth } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

@ApiBearerAuth()
@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  // Get current user's cart
  @Get()
  getCart(@Req() req: AuthenticatedRequest) {
    return this.cartService.getOrCreateCart(req.user.id);
  }

  // Add product to cart
  @Post('items')
  addItem(
    @Req() req: AuthenticatedRequest,
    @Body() addCartItemDto: AddCartItemDto,
  ) {
    return this.cartService.addItem(
      req.user.id,
      addCartItemDto,
    );
  }

  // Update cart item quantity
  @Patch('items/:id')
  updateItem(
    @Req() req: AuthenticatedRequest,
    @Param('id') itemId: string,
    @Body() updateCartItemDto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItem(
      req.user.id,
      itemId,
      updateCartItemDto,
    );
  }

  // Remove item from cart
  @Delete('items/:id')
  removeItem(
    @Req() req: AuthenticatedRequest,
    @Param('id') itemId: string,
  ) {
    return this.cartService.removeItem(
      req.user.id,
      itemId,
    );
  }
}