import { Schema, model, Document, Types } from 'mongoose';

export interface IOtpToken extends Document {
  userId: Types.ObjectId;
  codeHash: string;
  purpose: 'register' | 'login';
  attempts: number;
  expiresAt: Date;
}

const otpTokenSchema = new Schema<IOtpToken>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  codeHash: { type: String, required: true },
  purpose: { type: String, enum: ['register', 'login'], required: true },
  attempts: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true },
});

// MongoDB TTL index -- Mongo's background reaper deletes the document once
// expiresAt is in the past, so expired OTPs disappear on their own without a
// cron job. Same "let the database own the expiry" idea as the Redis TTL
// keys used for rate limiting elsewhere in this build.
otpTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const OtpToken = model<IOtpToken>('OtpToken', otpTokenSchema);
