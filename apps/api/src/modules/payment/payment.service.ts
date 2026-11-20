import crypto from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../../common/errors.js';

const prisma = new PrismaClient();

export class PaymentService {
  private readonly vnpTmnCode = process.env.VNPAY_TMN_CODE || 'NEXORATM';
  private readonly vnpUrl = process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
  private readonly vnpReturnUrl =
    process.env.VNPAY_RETURN_URL || 'http://localhost:5173/checkout/success';

  private getHashSecret(): string {
    const isProd = process.env.NODE_ENV === 'production';
    const secret = process.env.VNPAY_HASH_SECRET;
    if (isProd && (!secret || secret.trim() === '')) {
      throw new AppError(
        500,
        'PAYMENT_CONFIG_ERROR',
        'VNPAY_HASH_SECRET bắt buộc phải được cấu hình trong môi trường Production.'
      );
    }
    return secret || 'NEXORAVNPAYHASHSECRET2026DEVKEY';
  }

  /**
   * Tạo URL thanh toán VNPay
   * Số tiền được lấy trực tiếp từ Order trong database, tuyệt đối không tin tưởng client input.
   */
  async createVnpayPaymentUrl(params: {
    orderCode: string;
    orderInfo?: string;
    ipAddr?: string;
    requester?: { sub: number; role: string; email?: string } | null;
    customerEmail?: string;
    customerPhone?: string;
  }): Promise<string> {
    const order = await prisma.order.findUnique({
      where: { orderCode: params.orderCode },
    });

    if (!order) {
      throw new AppError(404, 'ORDER_NOT_FOUND', `Không tìm thấy đơn hàng ${params.orderCode}.`);
    }

    if (order.paymentStatus === 'PAID') {
      throw new AppError(400, 'ORDER_ALREADY_PAID', `Đơn hàng ${params.orderCode} đã được thanh toán trước đó.`);
    }

    // Xác thực quyền sở hữu đơn hàng (Ownership verification)
    if (order.userId !== null) {
      // Đơn hàng của người dùng đã đăng ký
      if (!params.requester) {
        throw new AppError(401, 'UNAUTHORIZED', 'Vui lòng đăng nhập để thanh toán cho đơn hàng này.');
      }
      const isPrivileged = params.requester.role === 'ADMIN' || params.requester.role === 'STAFF';
      const isOwner = Number(params.requester.sub) === Number(order.userId);
      if (!isPrivileged && !isOwner) {
        throw new AppError(
          403,
          'FORBIDDEN',
          'Bạn không có quyền thực hiện thanh toán cho đơn hàng của người dùng khác.'
        );
      }
    } else {
      // Đơn hàng của khách vãng lai (Guest)
      const isPrivileged =
        params.requester && (params.requester.role === 'ADMIN' || params.requester.role === 'STAFF');
      if (!isPrivileged) {
        const matchesUserEmail =
          params.requester?.email &&
          params.requester.email.toLowerCase() === order.customerEmail.toLowerCase();
        const matchesProvidedEmail =
          params.customerEmail &&
          params.customerEmail.trim().toLowerCase() === order.customerEmail.toLowerCase();
        const matchesProvidedPhone =
          params.customerPhone && params.customerPhone.trim() === order.customerPhone.trim();

        if (!matchesUserEmail && !matchesProvidedEmail && !matchesProvidedPhone) {
          throw new AppError(
            403,
            'FORBIDDEN',
            'Yêu cầu xác thực thông tin đơn hàng (email hoặc số điện thoại trùng khớp) để thanh toán.'
          );
        }
      }
    }

    const serverAmount = Number(order.totalAmount);
    if (serverAmount <= 0) {
      throw new AppError(400, 'INVALID_AMOUNT', 'Số tiền của đơn hàng không hợp lệ để thanh toán.');
    }

    const secret = this.getHashSecret();
    const date = new Date();
    const createDate = this.formatDate(date);

    const vnpParams: Record<string, string> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: this.vnpTmnCode,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: order.orderCode,
      vnp_OrderInfo: params.orderInfo || `Thanh toan don hang ${order.orderCode}`,
      vnp_OrderType: 'other',
      vnp_Amount: Math.round(serverAmount * 100).toString(),
      vnp_ReturnUrl: this.vnpReturnUrl,
      vnp_IpAddr: params.ipAddr || '127.0.0.1',
      vnp_CreateDate: createDate,
    };

    const sortedParams = this.sortObject(vnpParams);
    const signData = new URLSearchParams(sortedParams).toString();
    const hmac = crypto.createHmac('sha512', secret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    sortedParams.vnp_SecureHash = signed;

    return `${this.vnpUrl}?${new URLSearchParams(sortedParams).toString()}`;
  }

  /**
   * Xác thực callback/IPN từ VNPay
   * Kiểm tra chữ ký HMAC-SHA512, sự tồn tại của đơn hàng, đối chiếu số tiền và xử lý idempotent.
   */
  async verifyVnpayCallback(query: Record<string, string>): Promise<{
    isSuccess: boolean;
    orderCode: string;
    message: string;
  }> {
    const secret = this.getHashSecret();
    const secureHash = query.vnp_SecureHash;
    const cleanQuery = { ...query };
    delete cleanQuery.vnp_SecureHash;
    delete cleanQuery.vnp_SecureHashType;

    const sortedParams = this.sortObject(cleanQuery);
    const signData = new URLSearchParams(sortedParams).toString();
    const hmac = crypto.createHmac('sha512', secret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    const isValidSignature = secureHash?.toLowerCase() === signed.toLowerCase();
    const orderCode = query.vnp_TxnRef || '';
    const responseCode = query.vnp_ResponseCode;
    const transactionStatus = query.vnp_TransactionStatus;

    if (!isValidSignature) {
      return {
        isSuccess: false,
        orderCode,
        message: 'Chữ ký checksum VNPay không hợp lệ.',
      };
    }

    const order = await prisma.order.findUnique({
      where: { orderCode },
    });

    if (!order) {
      return {
        isSuccess: false,
        orderCode,
        message: `Không tìm thấy đơn hàng ${orderCode}.`,
      };
    }

    // Đối chiếu số tiền thanh toán từ cổng so với cơ sở dữ liệu
    const expectedAmount = Math.round(Number(order.totalAmount) * 100);
    const receivedAmount = Number(query.vnp_Amount || 0);
    if (receivedAmount !== expectedAmount) {
      return {
        isSuccess: false,
        orderCode,
        message: `Số tiền thanh toán không khớp (nhận: ${receivedAmount}, cần: ${expectedAmount}).`,
      };
    }

    // Xử lý Idempotent: Nếu đã thanh toán rồi thì trả về thành công ngay, không cập nhật trùng lặp
    if (order.paymentStatus === 'PAID') {
      return {
        isSuccess: true,
        orderCode,
        message: 'Đơn hàng đã được ghi nhận thanh toán thành công trước đó (Idempotent).',
      };
    }

    const isPaid = responseCode === '00' && (transactionStatus === '00' || !transactionStatus);

    if (isPaid) {
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

    // Cập nhật trạng thái thất bại
    await prisma.order.update({
      where: { orderCode },
      data: {
        paymentStatus: 'FAILED',
      },
    });

    return {
      isSuccess: false,
      orderCode,
      message: `Thanh toán không thành công. Mã phản hồi: ${responseCode}, trạng thái giao dịch: ${transactionStatus || 'unknown'}`,
    };
  }

  /**
   * Giả lập thanh toán Sandbox (CHỈ CHO PHÉP TRONG DEVELOPMENT & TEST)
   */
  async simulatePaymentSuccess(orderCode: string): Promise<{ orderCode: string; status: string }> {
    if (process.env.NODE_ENV === 'production') {
      throw new AppError(
        403,
        'SIMULATOR_DISABLED',
        'Tính năng giả lập thanh toán bị vô hiệu hóa trong môi trường Production.'
      );
    }

    const order = await prisma.order.findUnique({ where: { orderCode } });
    if (!order) {
      throw new AppError(404, 'ORDER_NOT_FOUND', `Không tìm thấy đơn hàng ${orderCode}.`);
    }

    if (order.paymentStatus === 'PAID') {
      return {
        orderCode,
        status: 'PAID',
      };
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
