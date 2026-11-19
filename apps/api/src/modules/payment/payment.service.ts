import crypto from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../../common/errors.js';

const prisma = new PrismaClient();

export class PaymentService {
  private readonly vnpTmnCode = process.env.VNPAY_TMN_CODE || 'NEXORATM';
  private readonly vnpHashSecret = process.env.VNPAY_HASH_SECRET || 'NEXORAVNPAYHASHSECRET2026DEVKEY';
  private readonly vnpUrl = process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
  private readonly vnpReturnUrl =
    process.env.VNPAY_RETURN_URL || 'http://localhost:5173/checkout/success';

  createVnpayPaymentUrl(params: {
    orderCode: string;
    amount: number;
    orderInfo: string;
    ipAddr?: string;
  }): string {
    const date = new Date();
    const createDate = this.formatDate(date);

    const vnpParams: Record<string, string> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: this.vnpTmnCode,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: params.orderCode,
      vnp_OrderInfo: params.orderInfo || `Thanh toan don hang ${params.orderCode}`,
      vnp_OrderType: 'other',
      vnp_Amount: (params.amount * 100).toString(),
      vnp_ReturnUrl: this.vnpReturnUrl,
      vnp_IpAddr: params.ipAddr || '127.0.0.1',
      vnp_CreateDate: createDate,
    };

    const sortedParams = this.sortObject(vnpParams);
    const signData = new URLSearchParams(sortedParams).toString();
    const hmac = crypto.createHmac('sha512', this.vnpHashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    sortedParams.vnp_SecureHash = signed;

    return `${this.vnpUrl}?${new URLSearchParams(sortedParams).toString()}`;
  }

  async verifyVnpayCallback(query: Record<string, string>): Promise<{
    isSuccess: boolean;
    orderCode: string;
    message: string;
  }> {
    const secureHash = query.vnp_SecureHash;
    delete query.vnp_SecureHash;
    delete query.vnp_SecureHashType;

    const sortedParams = this.sortObject(query);
    const signData = new URLSearchParams(sortedParams).toString();
    const hmac = crypto.createHmac('sha512', this.vnpHashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    const isValidSignature = secureHash?.toLowerCase() === signed.toLowerCase();
    const orderCode = query.vnp_TxnRef || '';
    const responseCode = query.vnp_ResponseCode;

    if (!isValidSignature) {
      return {
        isSuccess: false,
        orderCode,
        message: 'Chữ ký checksum VNPay không hợp lệ.',
      };
    }

    if (responseCode === '00') {
      await prisma.order.update({
        where: { orderCode },
        data: {
          paymentStatus: 'PAID',
          paidAt: new Date(),
          orderStatus: 'CONFIRMED',
        },
      });

      return {
        isSuccess: true,
        orderCode,
        message: 'Thanh toán VNPay thành công.',
      };
    }

    return {
      isSuccess: false,
      orderCode,
      message: `Thanh toán không thành công. Mã lỗi: ${responseCode}`,
    };
  }

  async simulatePaymentSuccess(orderCode: string): Promise<{ orderCode: string; status: string }> {
    const order = await prisma.order.findUnique({ where: { orderCode } });
    if (!order) {
      throw new AppError(404, 'ORDER_NOT_FOUND', `Không tìm thấy đơn hàng ${orderCode}.`);
    }

    await prisma.order.update({
      where: { orderCode },
      data: {
        paymentStatus: 'PAID',
        paidAt: new Date(),
        orderStatus: 'CONFIRMED',
      },
    });

    return {
      orderCode,
      status: 'PAID',
    };
  }

  private sortObject(obj: Record<string, string>): Record<string, string> {
    const sorted: Record<string, string> = {};
    const keys = Object.keys(obj).sort();
    for (const key of keys) {
      if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') {
        sorted[key] = obj[key];
      }
    }
    return sorted;
  }

  private formatDate(date: Date): string {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    return `${yyyy}${mm}${dd}${hh}${min}${ss}`;
  }
}
