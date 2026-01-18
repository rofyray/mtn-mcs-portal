import nodemailer from "nodemailer";

import { requiredEnv } from "@/lib/env";

export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  const { to, subject, html, text } = options;
  const transporter = nodemailer.createTransport({
    host: requiredEnv.smtpHost,
    port: Number(requiredEnv.smtpPort),
    secure: requiredEnv.smtpSecure === "true",
    auth: {
      user: requiredEnv.smtpUser,
      pass: requiredEnv.smtpPassword,
    },
  });

  await transporter.sendMail({
    from: requiredEnv.smtpFrom,
    to,
    subject,
    text,
    html,
  });
}
