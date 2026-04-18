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
    const provider = process.env.RESEND_API_KEY ? "resend" : process.env.SMTP_HOST ? "smtp" : "console";
    console.log(`[Email:${provider}] -> ${opts.to} | ${opts.subject} | ${info.messageId || "(logged)"}`);
    return true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[Email Error] -> ${opts.to} | ${opts.subject} | ${msg}`);
    return false;
  }
}

function shell(title: string, bodyHtml: string, ctaUrl?: string, ctaLabel?: string, companyName = "Hensek"): string {
  const cta = ctaUrl
    ? `<p style="text-align:center;margin:24px 0;"><a href="${ctaUrl}" style="background:#EAB308;color:#1A1A2E;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">${ctaLabel || "Open"}</a></p>`
    : "";
  return `
    <div style="font-family: Inter, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #FEFCE8; padding: 32px; border-radius: 16px;">
      <div style="background: #1A1A2E; padding: 20px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
        <h1 style="color: #EAB308; margin: 0; font-size: 24px;">${companyName}</h1>
        <p style="color: #fff; margin: 4px 0 0; font-size: 14px;">Company Management System</p>
      </div>
      <h2 style="color: #1C1917; margin-top:0;">${title}</h2>
      <div style="color: #44403C; line-height: 1.6; font-size: 15px;">${bodyHtml}</div>
      ${cta}
      <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;" />
      <p style="color: #9CA3AF; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} ${companyName}. Automated email — please do not reply.</p>
    </div>
  `;
}

export function buildRegistrationEmail(staffName: string, deptName: string, appUrl: string): { subject: string; html: string } {
  return {
    subject: `New staff registration awaiting approval — ${staffName}`,
    html: shell(
      "New Staff Registration",
      `<p><strong>${staffName}</strong> has registered for the <strong>${deptName}</strong> department and is awaiting your approval.</p>`,
      appUrl,
      "Review in HR Dashboard",
    ),
  };
}

export function buildApplicationStatusEmail(staffName: string, appType: string, statusMessage: string, appUrl: string): { subject: string; html: string } {
  return {
    subject: `Update on your ${appType} application`,
    html: shell(
      "Application Update",
      `<p>Hi ${staffName},</p><p>${statusMessage}</p><p>Application type: <strong>${appType}</strong></p>`,
      appUrl,
      "View Application",
    ),
  };
}

export function buildEscalationEmail(appType: string, staffName: string, appUrl: string): { subject: string; html: string } {
  return {
    subject: `Application escalated for MD review — ${appType}`,
    html: shell(
      "Application Escalated",
      `<p>HR has escalated a <strong>${appType}</strong> application from <strong>${staffName}</strong> for your review.</p>`,
      appUrl,
      "Review Application",
    ),
  };
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
