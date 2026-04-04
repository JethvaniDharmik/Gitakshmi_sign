import nodemailer from "nodemailer";

let transporter;

const createTransporter = async () => {
  if (transporter) return transporter;

  const hasSmtpConfig =
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS;

  if (hasSmtpConfig) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    return transporter;
  }

  // Fallback transport logs messages in development environments.
  transporter = nodemailer.createTransport({
    jsonTransport: true,
  });
  return transporter;
};

export const sendEmail = async ({ to, subject, html }) => {
  const mailer = await createTransporter();
  const info = await mailer.sendMail({
    from: process.env.MAIL_FROM || "no-reply@gitakshmisign.local",
    to,
    subject,
    html,
  });

  return info;
};
