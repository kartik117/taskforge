import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { env } from '../config/env';

/** Generates a zero-padded numeric OTP, e.g. "042918" for length 6. */
export function generateOtpCode(length: number = env.OTP_LENGTH): string {
  const max = 10 ** length;
  const n = crypto.randomInt(0, max);
  return n.toString().padStart(length, '0');
}

export async function hashOtpCode(code: string): Promise<string> {
  return bcrypt.hash(code, 10);
}

export async function compareOtpCode(code: string, hash: string): Promise<boolean> {
  return bcrypt.compare(code, hash);
}
