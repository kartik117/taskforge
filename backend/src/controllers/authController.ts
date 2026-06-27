import { Request, Response } from 'express';
import { z } from 'zod';
import * as authService from '../services/authService';

export const registerSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const verifyOtpSchema = z.object({
  userId: z.string().min(1),
  code: z.string().length(6),
});

export async function register(req: Request, res: Response): Promise<void> {
  const { name, email, password } = req.body as z.infer<typeof registerSchema>;
  const user = await authService.registerUser(name, email, password);
  res.status(201).json({ message: 'OTP sent to email', userId: user._id, purpose: 'register' });
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as z.infer<typeof loginSchema>;
  const user = await authService.loginStart(email, password);
  res.status(200).json({ message: 'OTP sent to email', userId: user._id, purpose: 'login' });
}

export async function verifyRegisterOtp(req: Request, res: Response): Promise<void> {
  const { userId, code } = req.body as z.infer<typeof verifyOtpSchema>;
  const { token, user } = await authService.completeRegisterOtp(userId, code);
  res.status(200).json({ token, user: { id: user._id, name: user.name, email: user.email } });
}

export async function verifyLoginOtp(req: Request, res: Response): Promise<void> {
  const { userId, code } = req.body as z.infer<typeof verifyOtpSchema>;
  const { token, user } = await authService.completeLoginOtp(userId, code);
  res.status(200).json({ token, user: { id: user._id, name: user.name, email: user.email } });
}
