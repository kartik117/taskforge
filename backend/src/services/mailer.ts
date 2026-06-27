import { EventEmitter } from 'events';
import nodemailer, { Transporter } from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../utils/logger';

let transporter: Transporter | null = null;
let usingConsoleFallback = false;

/**
 * Emits every OTP this module sends, real-SMTP or console-fallback alike.
 * Integration tests subscribe to this instead of mocking sendOtpEmail --
 * it's the same transport boundary a real inbox would observe from, just
 * read in-process instead of over IMAP.
 */
export const otpEvents = new EventEmitter();

/**
 * Lazily builds the SMTP transporter. Without SMTP_HOST configured (the
 * default in dev/CI, same as the optional-LLM-client pattern used in the
 * GenAI projects) it falls back to logging the OTP instead of crashing
 * startup or silently dropping it -- the email "send" still happens, it
 * just lands in structured logs rather than an inbox.
 */
function getTransporter(): Transporter | null {
  if (!env.SMTP_HOST) {
    usingConsoleFallback = true;
    return null;
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT ?? 587,
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
    });
  }
  return transporter;
}

export async function sendOtpEmail(to: string, code: string): Promise<{ delivered: boolean }> {
  const t = getTransporter();
  if (!t) {
    logger.info({ to, code }, '[console-fallback] OTP code (no SMTP_HOST configured)');
    otpEvents.emit('otp-sent', { to, code, delivered: false });
    return { delivered: false };
  }
  await t.sendMail({
    from: 'TaskForge <no-reply@taskforge.dev>',
    to,
    subject: 'Your TaskForge verification code',
    text: `Your verification code is ${code}. It expires in ${env.OTP_TTL_SECONDS / 60} minutes.`,
  });
  otpEvents.emit('otp-sent', { to, code, delivered: true });
  return { delivered: true };
}

export function isUsingConsoleFallback(): boolean {
  return usingConsoleFallback;
}

/** Test-only: forces re-evaluation of SMTP_HOST on next send. */
export function resetMailerForTest(): void {
  transporter = null;
  usingConsoleFallback = false;
}
