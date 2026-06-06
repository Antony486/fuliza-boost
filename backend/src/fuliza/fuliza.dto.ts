import { IsString, IsNumber, IsPositive } from 'class-validator';

export class InitiateBoostDto {
  @IsNumber()
  @IsPositive()
  limitAmount: number;

  @IsNumber()
  @IsPositive()
  fee: number;

  @IsString()
  phone: string;
}

export class CallbackDto {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item: Array<{ Name: string; Value?: string | number }>;
      };
    };
  };
}
