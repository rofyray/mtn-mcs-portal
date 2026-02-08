import nodemailer from "nodemailer";

import { requiredEnv } from "@/lib/env";

let _transporter: nodemailer.Transporter;

function getTransporter() {
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      host: requiredEnv.smtpHost,
      port: Number(requiredEnv.smtpPort),
      secure: requiredEnv.smtpSecure === "true",
      auth: {
        user: requiredEnv.smtpUser,
        pass: requiredEnv.smtpPassword,
      },
    });
  }
  return _transporter;
}

export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  const { to, subject, html, text } = options;

  await getTransporter().sendMail({
    from: requiredEnv.smtpFrom,
    to,
    subject,
    text,
    html,
  });
}
