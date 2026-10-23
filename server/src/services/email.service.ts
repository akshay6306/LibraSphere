import nodemailer, { Transporter } from 'nodemailer';
import logger from '../lib/logger';

export interface NewMemberNotificationData {
  membershipId: string;
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  dateOfBirth?: string | Date | null;
  membershipExpiry: string | Date;
  ipAddress?: string;
  registeredAt: Date;
}

export class EmailService {
  private static transporter: Transporter | null = null;
  public static readonly ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || 'krishnarathore2302@gmail.com';

  private static getTransporter(): Transporter | null {
    if (this.transporter) {
      return this.transporter;
    }

    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user, pass }
      });
      return this.transporter;
    }

    return null;
  }

  /**
   * Dispatches new member registration details to admin email (krishnarathore2302@gmail.com).
   * Works via live SMTP if configured, with full fallback console delivery in development.
   */
  static async sendNewMemberNotification(data: NewMemberNotificationData): Promise<boolean> {
    const targetEmail = this.ADMIN_EMAIL;
    const subject = `[LibraSphere Alert] New Member Registered: ${data.name} (${data.membershipId})`;

    const dobFormatted = data.dateOfBirth
      ? new Date(data.dateOfBirth).toLocaleDateString()
      : 'Not Provided';

    const expiryFormatted = new Date(data.membershipExpiry).toLocaleDateString();
    const registeredFormatted = data.registeredAt.toLocaleString();

    const plainText = `
==================================================
           NEW MEMBER REGISTRATION ALERT
==================================================

A new member has just registered in the LibraSphere Library Consortium.

Member Details:
--------------------------------------------------
Membership ID : ${data.membershipId}
Full Name     : ${data.name}
Email Address : ${data.email}
Phone Number  : ${data.phone || 'N/A'}
Address       : ${data.address || 'N/A'}
Date of Birth : ${dobFormatted}
Registered On : ${registeredFormatted}
Card Validity : Valid until ${expiryFormatted}
IP Address    : ${data.ipAddress || 'Unknown / Local'}

Portal Link   : ${process.env.CLIENT_URL || 'http://localhost:5173'}/librarian/members
==================================================
`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%); padding: 28px 24px; color: #ffffff; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.025em; }
    .header p { margin: 6px 0 0; font-size: 14px; opacity: 0.9; }
    .content { padding: 24px; }
    .badge { display: inline-block; background: #e0e7ff; color: #3730a3; padding: 4px 10px; border-radius: 9999px; font-weight: 600; font-size: 13px; margin-bottom: 16px; }
    .detail-table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    .detail-table th { text-align: left; padding: 10px 12px; background: #f1f5f9; color: #475569; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e2e8f0; width: 35%; }
    .detail-table td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #0f172a; font-weight: 500; }
    .footer { padding: 16px 24px; background: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #64748b; }
    .btn { display: inline-block; background: #4f46e5; color: #ffffff !important; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: 600; font-size: 14px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>LibraSphere Library Consortium</h1>
      <p>New Member Registration Notification</p>
    </div>
    <div class="content">
      <div class="badge">Patron Card: ${data.membershipId}</div>
      <p>A new patron has enrolled for library membership. Here are their verified profile details:</p>
      
      <table class="detail-table">
        <tr>
          <th>Full Name</th>
          <td><strong>${data.name}</strong></td>
        </tr>
        <tr>
          <th>Membership ID</th>
          <td><code>${data.membershipId}</code></td>
        </tr>
        <tr>
          <th>Email Address</th>
          <td><a href="mailto:${data.email}">${data.email}</a></td>
        </tr>
        <tr>
          <th>Phone Number</th>
          <td>${data.phone || '<em>Not provided</em>'}</td>
        </tr>
        <tr>
          <th>Address</th>
          <td>${data.address || '<em>Not provided</em>'}</td>
        </tr>
        <tr>
          <th>Date of Birth</th>
          <td>${dobFormatted}</td>
        </tr>
        <tr>
          <th>Enrolled On</th>
          <td>${registeredFormatted}</td>
        </tr>
        <tr>
          <th>Card Expiration</th>
          <td>${expiryFormatted} (1 Year)</td>
        </tr>
        <tr>
          <th>Registration IP</th>
          <td>${data.ipAddress || 'Local/Internal'}</td>
        </tr>
      </table>

      <div style="text-align: center;">
        <a class="btn" href="${process.env.CLIENT_URL || 'http://localhost:5173'}/librarian/members">Inspect Member in Dashboard</a>
      </div>
    </div>
    <div class="footer">
      This notification was automatically sent by LibraSphere Library Management System to <strong>${targetEmail}</strong>.
    </div>
  </div>
</body>
</html>
`;

    const transporter = this.getTransporter();

    if (transporter) {
      try {
        const fromAddress = process.env.SMTP_FROM || `"LibraSphere System" <${process.env.SMTP_USER}>`;
        await transporter.sendMail({
          from: fromAddress,
          to: targetEmail,
          subject,
          text: plainText,
          html: htmlContent
        });
        logger.info(` Successfully sent new member notification email to ${targetEmail} for ${data.email}`);
        return true;
      } catch (error: any) {
        logger.error(` Error dispatching SMTP email to ${targetEmail}: ${error.message}`);
        // Log details to console as fallback
        console.log(`\n=== EMAIL NOTIFICATION TO ${targetEmail} ===`);
        console.log(plainText);
        console.log('============================================\n');
        return false;
      }
    } else {
      // In development or when SMTP credentials are not yet added to .env:
      logger.info(` [EmailService] SMTP not configured. Emulating email dispatch to ${targetEmail}`);
      console.log(`\n======================================================`);
      console.log(` DISPATCHING MEMBER REGISTRATION EMAIL`);
      console.log(` TO      : ${targetEmail}`);
      console.log(` SUBJECT : ${subject}`);
      console.log(plainText);
      console.log(`======================================================\n`);
      return true;
    }
  }
}

export default EmailService;
