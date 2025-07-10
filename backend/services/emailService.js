const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = this.createTransporter();
  }

  createTransporter() {
    // Create transporter based on environment
    if (process.env.NODE_ENV === 'production') {
      // Production email service (e.g., SendGrid, AWS SES, etc.)
      return nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
    } else {
      // Development - use Ethereal Email for testing or console logging
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        return nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          }
        });
      } else {
        // Fallback to console logging for development
        return nodemailer.createTransport({
          streamTransport: true,
          newline: 'unix',
          buffer: true
        });
      }
    }
  }

  async sendEmail(options) {
    try {
      const mailOptions = {
        from: `${process.env.EMAIL_FROM_NAME || 'MERN Blog'} <${process.env.EMAIL_FROM || 'noreply@mernblog.com'}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html
      };

      const info = await this.transporter.sendMail(mailOptions);

      if (process.env.NODE_ENV === 'development') {
        if (info.messageId && nodemailer.getTestMessageUrl) {
          console.log('Email sent:', nodemailer.getTestMessageUrl(info));
        } else {
          console.log('Email would be sent:', {
            to: options.email,
            subject: options.subject,
            message: options.message
          });
        }
      }

      return info;
    } catch (error) {
      console.error('Email sending failed:', error);
      throw new Error('Email could not be sent');
    }
  }

  async sendPasswordResetEmail(user, resetToken) {
    const resetURL = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    
    const message = `
      Hi ${user.firstName},
      
      You requested a password reset for your account.
      
      Please click the link below to reset your password:
      ${resetURL}
      
      This link will expire in 1 hour.
      
      If you didn't request this, please ignore this email.
      
      Best regards,
      MERN Blog Team
    `;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">Password Reset Request</h2>
        <p>Hi ${user.firstName},</p>
        <p>You requested a password reset for your account.</p>
        <p>Please click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetURL}" 
             style="background-color: #3b82f6; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 6px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p><strong>This link will expire in 1 hour.</strong></p>
        <p>If you didn't request this, please ignore this email.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 14px;">
          Best regards,<br>
          MERN Blog Team
        </p>
      </div>
    `;

    await this.sendEmail({
      email: user.email,
      subject: 'Password Reset Request',
      message,
      html
    });
  }



  async sendWelcomeEmail(user) {
    const message = `
      Hi ${user.firstName},
      
      Welcome to MERN Blog! Your account has been successfully created.
      
      You can now start writing and sharing your stories with the world.
      
      Best regards,
      MERN Blog Team
    `;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">Welcome to MERN Blog!</h2>
        <p>Hi ${user.firstName},</p>
        <p>Welcome to MERN Blog! Your account has been successfully created.</p>
        <p>You can now start writing and sharing your stories with the world.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.CLIENT_URL}/dashboard" 
             style="background-color: #3b82f6; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 6px; display: inline-block;">
            Go to Dashboard
          </a>
        </div>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 14px;">
          Best regards,<br>
          MERN Blog Team
        </p>
      </div>
    `;

    await this.sendEmail({
      email: user.email,
      subject: 'Welcome to MERN Blog!',
      message,
      html
    });
  }

  async sendPasswordChangeNotification(user) {
    const message = `
      Hi ${user.firstName},
      
      Your password has been successfully changed.
      
      If you didn't make this change, please contact us immediately.
      
      Best regards,
      MERN Blog Team
    `;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">Password Changed</h2>
        <p>Hi ${user.firstName},</p>
        <p>Your password has been successfully changed.</p>
        <p><strong>If you didn't make this change, please contact us immediately.</strong></p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 14px;">
          Best regards,<br>
          MERN Blog Team
        </p>
      </div>
    `;

    await this.sendEmail({
      email: user.email,
      subject: 'Password Changed Successfully',
      message,
      html
    });
  }
}

module.exports = new EmailService();
