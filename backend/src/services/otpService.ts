import { Types } from 'mongoose';
import { OtpToken } from '../models/OtpToken';
import { env } from '../config/env';
import { generateOtpCode, hashOtpCode, compareOtpCode } from '../utils/otp';
import { sendOtpEmail } from './mailer';
import { AppError } from '../utils/AppError';

const MAX_ATTEMPTS = 5;

export async function issueOtp(
  userId: Types.ObjectId,
  email: string,
  purpose: 'register' | 'login'
): Promise<void> {
  // A user retrying signup/login shouldn't accumulate multiple live OTPs --
  // invalidate any previous one for this purpose before issuing a fresh one.
  await OtpToken.deleteMany({ userId, purpose });

  const code = generateOtpCode();
  const codeHash = await hashOtpCode(code);
  const expiresAt = new Date(Date.now() + env.OTP_TTL_SECONDS * 1000);

  await OtpToken.create({ userId, codeHash, purpose, expiresAt, attempts: 0 });
  await sendOtpEmail(email, code);
}

export async function verifyOtp(
  userId: Types.ObjectId,
  purpose: 'register' | 'login',
  code: string
): Promise<void> {
  const token = await OtpToken.findOne({ userId, purpose }).sort({ _id: -1 });
  if (!token) {
    throw AppError.unauthorized('No active verification code -- request a new one');
  }
  if (token.expiresAt.getTime() < Date.now()) {
    await token.deleteOne();
    throw AppError.unauthorized('Verification code expired -- request a new one');
  }
  if (token.attempts >= MAX_ATTEMPTS) {
    await token.deleteOne();
    throw AppError.unauthorized('Too many incorrect attempts -- request a new one');
  }

  const matches = await compareOtpCode(code, token.codeHash);
  if (!matches) {
    token.attempts += 1;
    await token.save();
    throw AppError.unauthorized('Incorrect verification code');
  }

  await token.deleteOne();
}
