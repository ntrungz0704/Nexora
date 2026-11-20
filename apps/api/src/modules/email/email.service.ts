import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { getEnv } from '../../config/env.js';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface SentEmailRecord {
  to: string;
  subject: string;
  html: string;
  text?: string;
  sentAt: Date;
  messageId: string;
}

export class EmailService {
  private transporter: Transporter | null = null;
  private static sentEmails: SentEmailRecord[] = [];
  private static mockFailure = false;

  constructor() {
    this.initTransporter();
  }

  private initTransporter(): void {
    const env = getEnv();
    const isTest = process.env.NODE_ENV === 'test' || env.NODE_ENV === 'test';

    if (isTest || process.env.EMAIL_PROVIDER === 'test') {
      // In-memory stream transporter for test suites
      this.transporter = nodemailer.createTransport({
        streamTransport: true,
        newline: 'windows',
      });
      return;
    }

    if (process.env.SMTP_HOST) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER || '',
          pass: process.env.SMTP_PASS || '',
        },
      });
      return;
    }

    // Default to null if no provider is configured
    this.transporter = null;
  }

  isConfigured(): boolean {
    const isTest = process.env.NODE_ENV === 'test';
    if (isTest || process.env.EMAIL_PROVIDER === 'test') {
      return true;
    }
    return !!(process.env.SMTP_HOST || process.env.RESEND_API_KEY);
  }

  async sendEmail(options: SendEmailOptions): Promise<{ success: boolean; messageId: string }> {
    if (EmailService.mockFailure) {
      throw new Error('SIMULATED_EMAIL_PROVIDER_FAILURE: Kết nối tới máy chủ gửi thư bị từ chối.');
    }

    const isTest = process.env.NODE_ENV === 'test' || process.env.EMAIL_PROVIDER === 'test';

    if (!this.isConfigured()) {
      throw new Error('EMAIL_SERVICE_NOT_CONFIGURED: Không có nhà cung cấp dịch vụ email (SMTP hoặc Resend) nào được cấu hình.');
    }

    // If Resend API key is configured and not in test mode
    if (!isTest && process.env.RESEND_API_KEY && !process.env.SMTP_HOST) {
      return this.sendViaResend(options);
    }

    if (!this.transporter) {
      throw new Error('EMAIL_TRANSPORTER_UNAVAILABLE: Không thể khởi tạo email transporter.');
    }

    const from = process.env.SMTP_FROM || 'Nexora Support <no-reply@nexora.local>';
    const info = await this.transporter.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    const messageId = info.messageId || `msg_${Date.now()}`;
    const record: SentEmailRecord = {
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      sentAt: new Date(),
      messageId,
    };

    EmailService.sentEmails.push(record);

    return { success: true, messageId };
  }

  private async sendViaResend(options: SendEmailOptions): Promise<{ success: boolean; messageId: string }> {
    const from = process.env.SMTP_FROM || 'Nexora Support <no-reply@nexora.local>';
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [options.to],
        subject: options.subject,
        html: options.html,
        text: options.text,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`RESEND_API_ERROR (${res.status}): ${errText}`);
    }

    const data = (await res.json()) as { id?: string };
    const messageId = data.id || `resend_${Date.now()}`;
    return { success: true, messageId };
  }

  // --- Test & Inspection Helpers ---
  static getSentEmails(): SentEmailRecord[] {
    return [...EmailService.sentEmails];
  }

  static getLastEmail(): SentEmailRecord | undefined {
    return EmailService.sentEmails[EmailService.sentEmails.length - 1];
  }

  static clearSentEmails(): void {
    EmailService.sentEmails = [];
  }

  static setMockFailure(shouldFail: boolean): void {
    EmailService.mockFailure = shouldFail;
  }
}
