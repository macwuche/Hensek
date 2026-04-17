import nodemailer from "nodemailer";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: { filename: string; content: Buffer; contentType: string }[];
}

function getTransporter() {
  if (process.env.RESEND_API_KEY) {
    return nodemailer.createTransport({
      host: "smtp.resend.com",
      port: 465,
      secure: true,
      auth: { user: "resend", pass: process.env.RESEND_API_KEY },
    });
  }
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  // Dev fallback — logs to console
  return nodemailer.createTransport({ jsonTransport: true });
}

export async function sendEmail(opts: EmailOptions): Promise<boolean> {
  try {
    const transporter = getTransporter();
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || "Hensek System <noreply@hensek.com>",
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      attachments: opts.attachments,
    });
    if (process.env.NODE_ENV === "development") {
      console.log("[Email]", opts.to, opts.subject, info.messageId || "(logged)");
    }
    return true;
  } catch (err) {
    console.error("[Email Error]", err);
    return false;
  }
}

export function buildReportEmail(reportType: string, period: string, companyName = "Hensek"): string {
  return `
    <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; background: #FEFCE8; padding: 32px; border-radius: 16px;">
      <div style="background: #1A1A2E; padding: 20px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
        <h1 style="color: #EAB308; margin: 0; font-size: 24px;">${companyName}</h1>
        <p style="color: #fff; margin: 4px 0 0; font-size: 14px;">Company Management System</p>
      </div>
      <h2 style="color: #1C1917;">Automated ${reportType} Report</h2>
      <p style="color: #44403C;">Period: <strong>${period}</strong></p>
      <p style="color: #44403C;">Please find the attached ${reportType.toLowerCase()} report for the period ${period}.</p>
      <p style="color: #44403C;">This is an automated email from the Hensek system. Please do not reply.</p>
      <hr style="border: 1px solid #E5E7EB; margin: 24px 0;" />
      <p style="color: #9CA3AF; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} Hensek. All rights reserved.</p>
    </div>
  `;
}
