import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DarajaService } from '../daraja/daraja.service';
import { InitiateBoostDto } from './fuliza.dto';

export const LIMIT_TIERS = [
  { limitAmount: 5000,  fee: 159 },
  { limitAmount: 10000, fee: 200 },
  { limitAmount: 19000, fee: 270 },
  { limitAmount: 32000, fee: 599 },
  { limitAmount: 44000, fee: 770 },
  { limitAmount: 53000, fee: 990 },
  { limitAmount: 62000, fee: 1339 },
  { limitAmount: 75000, fee: 2000 },
];

@Injectable()
export class FulizaService {
  constructor(
    private prisma: PrismaService,
    private daraja: DarajaService,
  ) {}

  getLimits() {
    return LIMIT_TIERS;
  }

  async initiateBoost(userId: string, dto: InitiateBoostDto) {
    const validTier = LIMIT_TIERS.find(
      (t) => t.limitAmount === dto.limitAmount && t.fee === dto.fee,
    );
    if (!validTier) throw new BadRequestException('Invalid limit tier selected');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const transaction = await this.prisma.transaction.create({
      data: {
        userId,
        limitAmount: dto.limitAmount,
        fee: dto.fee,
        status: 'PENDING',
      },
    });

    const phone = dto.phone || user.phone;
    const stkResponse = await this.daraja.stkPush(
      phone,
      dto.fee,
      'FULIZA-' + transaction.id.slice(0, 8).toUpperCase(),
    );

    const updated = await this.prisma.transaction.update({
      where: { id: transaction.id },
      data: { checkoutRequestId: stkResponse.CheckoutRequestID },
    });

    return {
      message: 'STK Push sent. Complete payment on your phone.',
      checkoutRequestId: stkResponse.CheckoutRequestID,
      transactionId: updated.id,
    };
  }

  async handleCallback(body: any) {
    const callback = body?.Body?.stkCallback;
    if (!callback) return { message: 'Invalid callback' };

    const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = callback;

    const transaction = await this.prisma.transaction.findUnique({
      where: { checkoutRequestId: CheckoutRequestID },
    });

    if (!transaction) return { message: 'Transaction not found' };

    if (ResultCode === 0) {
      const receiptItem = CallbackMetadata?.Item?.find(
        (i: any) => i.Name === 'MpesaReceiptNumber',
      );
      const receipt = receiptItem?.Value?.toString() ?? null;

      await this.prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: 'SUCCESS', mpesaReceiptNumber: receipt },
      });

      await this.prisma.user.update({
        where: { id: transaction.userId },
        data: { currentLimit: transaction.limitAmount },
      });
    } else {
      await this.prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: 'FAILED' },
      });
    }

    return { message: ResultDesc };
  }

  async getStatus(checkoutRequestId: string, userId: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { checkoutRequestId },
    });

    if (!transaction || transaction.userId !== userId) {
      throw new NotFoundException('Transaction not found');
    }

    return {
      status: transaction.status,
      limitAmount: transaction.limitAmount,
      fee: transaction.fee,
      mpesaReceiptNumber: transaction.mpesaReceiptNumber,
      createdAt: transaction.createdAt,
    };
  }

  async getHistory(userId: string) {
    return this.prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
