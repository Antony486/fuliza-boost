import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class DarajaService {
  private readonly logger = new Logger(DarajaService.name);
  private accessToken: string = '';
  private tokenExpiry: number = 0;

  constructor(private config: ConfigService) {}

  private get baseUrl(): string {
    return this.config.get('DARAJA_ENV') === 'sandbox'
      ? 'https://sandbox.safaricom.co.ke'
      : 'https://api.safaricom.co.ke';
  }

  async getAccessToken(): Promise<string> {
    const now = Date.now();
    if (this.accessToken && now < this.tokenExpiry) {
      return this.accessToken;
    }

    const key = this.config.get('DARAJA_CONSUMER_KEY');
    const secret = this.config.get('DARAJA_CONSUMER_SECRET');
    const credentials = Buffer.from(`${key}:${secret}`).toString('base64');

    const response = await axios.get(
      `${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
      { headers: { Authorization: `Basic ${credentials}` } },
    );

    this.accessToken = response.data.access_token;
    this.tokenExpiry = now + (response.data.expires_in - 60) * 1000;
    this.logger.log('Daraja access token refreshed');
    return this.accessToken;
  }

  async stkPush(phone: string, amount: number, accountRef: string): Promise<any> {
    const token = await this.getAccessToken();
    const shortcode = this.config.get('DARAJA_SHORTCODE');
    const passkey = this.config.get('DARAJA_PASSKEY');
    const callbackUrl = this.config.get('DARAJA_CALLBACK_URL');

    const timestamp = new Date()
      .toISOString()
      .replace(/[-T:.Z]/g, '')
      .slice(0, 14);

    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');

    const sanitizedPhone = phone.startsWith('0')
      ? `254${phone.slice(1)}`
      : phone;

    const payload = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: sanitizedPhone,
      PartyB: shortcode,
      PhoneNumber: sanitizedPhone,
      CallBackURL: callbackUrl,
      AccountReference: accountRef,
      TransactionDesc: `Fuliza Limit Boost - ${accountRef}`,
    };

    const response = await axios.post(
      `${this.baseUrl}/mpesa/stkpush/v1/processrequest`,
      payload,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    this.logger.log(`STK Push sent to ${sanitizedPhone}`);
    return response.data;
  }

  async queryStkStatus(checkoutRequestId: string): Promise<any> {
    const token = await this.getAccessToken();
    const shortcode = this.config.get('DARAJA_SHORTCODE');
    const passkey = this.config.get('DARAJA_PASSKEY');

    const timestamp = new Date()
      .toISOString()
      .replace(/[-T:.Z]/g, '')
      .slice(0, 14);

    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');

    const response = await axios.post(
      `${this.baseUrl}/mpesa/stkpushquery/v1/query`,
      {
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId,
      },
      { headers: { Authorization: `Bearer ${token}` } },
    );

    return response.data;
  }
}
