import bcrypt from 'bcryptjs';
import { User, IUser } from '../models/User';
import { AppError } from '../utils/AppError';
import { issueOtp, verifyOtp } from './otpService';
import { signAccessToken } from '../utils/jwt';

const PASSWORD_SALT_ROUNDS = 10;

export async function registerUser(name: string, email: string, password: string): Promise<IUser> {
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw AppError.conflict('An account with this email already exists');
  }
  const passwordHash = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
  const user = await User.create({ name, email: email.toLowerCase(), passwordHash });
  await issueOtp(user._id, user.email, 'register');
  return user;
}

export async function loginStart(email: string, password: string): Promise<IUser> {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw AppError.unauthorized('Invalid email or password');
  }
  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) {
    throw AppError.unauthorized('Invalid email or password');
  }
  await issueOtp(user._id, user.email, 'login');
  return user;
}

export async function completeRegisterOtp(userId: string, code: string): Promise<{ token: string; user: IUser }> {
  const user = await User.findById(userId);
  if (!user) {
    throw AppError.notFound('User not found');
  }
  await verifyOtp(user._id, 'register', code);
  user.isVerified = true;
  await user.save();
  const token = signAccessToken({ sub: user._id.toString(), email: user.email });
  return { token, user };
}

export async function completeLoginOtp(userId: string, code: string): Promise<{ token: string; user: IUser }> {
  const user = await User.findById(userId);
  if (!user) {
    throw AppError.notFound('User not found');
  }
  await verifyOtp(user._id, 'login', code);
  const token = signAccessToken({ sub: user._id.toString(), email: user.email });
  return { token, user };
}
