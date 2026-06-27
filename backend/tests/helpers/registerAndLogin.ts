import { Express } from 'express';
import request from 'supertest';
import { waitForOtp } from './waitForOtp';

export interface TestUser {
  token: string;
  userId: string;
  email: string;
}

/** Runs the full register -> verify-otp flow against a live app instance and returns a usable JWT. */
export async function registerAndVerify(app: Express, email: string, name = 'Test User'): Promise<TestUser> {
  const otpPromise = waitForOtp(email);
  const registerRes = await request(app)
    .post('/api/auth/register')
    .send({ name, email, password: 'correct-horse-battery-staple' });
  expect(registerRes.status).toBe(201);
  const code = await otpPromise;

  const verifyRes = await request(app)
    .post('/api/auth/register/verify-otp')
    .send({ userId: registerRes.body.userId, code });
  expect(verifyRes.status).toBe(200);

  return { token: verifyRes.body.token, userId: verifyRes.body.user.id, email };
}
