import nodemailer from 'nodemailer';

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private testAccount: nodemailer.TestAccount | null = null;

  private async initializeTransporter() {
    if (this.transporter) return;

    try {
      if (process.env.SMTP_HOST && process.env.SMTP_PORT) {
        // Production or manual SMTP config
        this.transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });
        console.log('✉️ Email Service: Configured using custom SMTP settings');
      } else {
        // Development fallback: Nodemailer Ethereal SMTP Account
        console.log('✉️ Email Service: Creating test Ethereal SMTP account...');
        this.testAccount = await nodemailer.createTestAccount();
        this.transporter = nodemailer.createTransport({
          host: this.testAccount.smtp.host,
          port: this.testAccount.smtp.port,
          secure: this.testAccount.smtp.secure,
          auth: {
            user: this.testAccount.user,
            pass: this.testAccount.pass,
          },
        });
        console.log(`✉️ Email Service: Ethereal SMTP active! User: ${this.testAccount.user}`);
      }
    } catch (error) {
      console.error('✉️ Email Service failed to initialize:', error);
    }
  }

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    await this.initializeTransporter();

    if (!this.transporter) {
      console.warn(`✉️ Email Service (Disabled): Cannot send email to ${to}`);
      return;
    }

    try {
      const from = process.env.SMTP_FROM || 'E-Commerce Platform <no-reply@ecommerce.com>';
      const info = await this.transporter.sendMail({
        from,
        to,
        subject,
        html,
      });

      console.log(`✉️ Email sent to ${to}. MessageId: ${info.messageId}`);
      if (this.testAccount) {
        console.log(`✉️ Preview sent email here: ${nodemailer.getTestMessageUrl(info)}`);
      }
    } catch (error) {
      console.error(`✉️ Failed to send email to ${to}:`, error);
    }
  }

  async sendWelcomeEmail(to: string, name: string): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #4F46E5;">Welcome to Our Multi-Vendor Marketplace, ${name}!</h2>
        <p>Thank you for creating an account with us. We are thrilled to have you join our shopping community.</p>
        <p>Explore thousands of products from local and international sellers, manage your cart, and enjoy seamless checkouts.</p>
        <div style="margin: 30px 0; text-align: center;">
          <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Start Shopping</a>
        </div>
        <p>If you have any questions, feel free to contact our customer support at any time.</p>
        <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 20px 0;" />
        <p style="font-size: 12px; color: #666;">This is an automated system email. Please do not reply directly.</p>
      </div>
    `;
    await this.sendEmail(to, 'Welcome to E-Commerce Platform!', html);
  }

  async sendVerificationEmail(to: string, name: string, token: string): Promise<void> {
    const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify-email?token=${token}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #4F46E5;">Verify Your Email Address</h2>
        <p>Hello ${name},</p>
        <p>Please click the button below to verify your email address and activate your E-Commerce account.</p>
        <div style="margin: 30px 0; text-align: center;">
          <a href="${verificationUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Verify Email Address</a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #4F46E5;">${verificationUrl}</p>
        <p>This verification link will expire in 24 hours.</p>
      </div>
    `;
    await this.sendEmail(to, 'Verify Your Email Address', html);
  }

  async sendPasswordResetEmail(to: string, name: string, token: string): Promise<void> {
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #EF4444;">Reset Your Password</h2>
        <p>Hello ${name},</p>
        <p>We received a request to reset your password. If you didn't make this request, you can safely ignore this email.</p>
        <p>Otherwise, please click the button below to choose a new password.</p>
        <div style="margin: 30px 0; text-align: center;">
          <a href="${resetUrl}" style="background-color: #EF4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Reset Password</a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #EF4444;">${resetUrl}</p>
        <p>This reset link will expire in 1 hour.</p>
      </div>
    `;
    await this.sendEmail(to, 'Password Reset Request', html);
  }

  async sendOrderConfirmationEmail(to: string, name: string, orderId: string, totalAmount: number): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #10B981;">Order Confirmed!</h2>
        <p>Hello ${name},</p>
        <p>Thank you for your order! We have received your payment and are preparing your package.</p>
        <div style="background-color: #F3F4F6; padding: 15px; border-radius: 4px; margin: 20px 0;">
          <p style="margin: 0; font-weight: bold;">Order Summary:</p>
          <p style="margin: 5px 0 0 0;">Order ID: ${orderId}</p>
          <p style="margin: 5px 0 0 0;">Total Amount Paid: $${totalAmount.toFixed(2)}</p>
        </div>
        <p>You can track the status of your order anytime in your account dashboard. We will email you again when your package ships.</p>
      </div>
    `;
    await this.sendEmail(to, `Order Confirmation - #${orderId.substring(0, 8)}`, html);
  }

  async sendShippingUpdateEmail(to: string, name: string, orderId: string, status: string): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #3B82F6;">Order Status Update: ${status}</h2>
        <p>Hello ${name},</p>
        <p>Your order <strong>#${orderId.substring(0, 8)}</strong> status has been updated to <strong>${status}</strong>.</p>
        <p>Our sellers are working hard to deliver your order as soon as possible.</p>
        <p>Check your order history details in our portal for real-time tracking.</p>
      </div>
    `;
    await this.sendEmail(to, `Shipping Update - #${orderId.substring(0, 8)}`, html);
  }
}

export const emailService = new EmailService();
