import { IsEnum } from 'class-validator';
import { PaymentMethod } from '../../generated/prisma/enums';

export class CreatePaymentDto {
  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;
}