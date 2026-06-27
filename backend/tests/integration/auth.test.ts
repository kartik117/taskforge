import { Express } from 'express';
import request from 'supertest';
import { createApp } from '../../src/app';
import { waitForOtp } from '../helpers/waitForOtp';
import { registerAndVerify } from '../helpers/registerAndLogin';

describe('auth flow', () => {
  let app: Express;

  beforeAll(() => {
    app = createApp();
  });

  it('registers, verifies the real OTP, and returns a usable JWT', async () => {
    const user = await registerAndVerify(app, 'alice@example.com');
    expect(user.token).toBeTruthy();

    const me = await request(app).get('/api/projects').set('Authorization', `Bearer ${user.token}`);
    expect(me.status).toBe(200);
  });

  it('rejects a second registration with the same email', async () => {
    await registerAndVerify(app, 'bob@example.com');
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Bob Two', email: 'bob@example.com', password: 'another-password' });
    expect(res.status).toBe(409);
  });

  it('rejects the wrong OTP code and accepts the right one on a second attempt', async () => {
    const otpPromise = waitForOtp('carol@example.com');
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Carol', email: 'carol@example.com', password: 'correct-horse-battery-staple' });
    const realCode = await otpPromise;

    const wrongAttempt = await request(app)
      .post('/api/auth/register/verify-otp')
      .send({ userId: registerRes.body.userId, code: realCode === '000000' ? '111111' : '000000' });
    expect(wrongAttempt.status).toBe(401);

    const rightAttempt = await request(app)
      .post('/api/auth/register/verify-otp')
      .send({ userId: registerRes.body.userId, code: realCode });
    expect(rightAttempt.status).toBe(200);
  });

  it('requires login + a second OTP to get a fresh token (the 2-step part of 2-step verification)', async () => {
    await registerAndVerify(app, 'dave@example.com');

    const otpPromise = waitForOtp('dave@example.com');
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'dave@example.com', password: 'correct-horse-battery-staple' });
    expect(loginRes.status).toBe(200);
    const code = await otpPromise;

    const verifyRes = await request(app)
      .post('/api/auth/login/verify-otp')
      .send({ userId: loginRes.body.userId, code });
    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.token).toBeTruthy();
  });

  it('rejects login with the wrong password before an OTP is ever issued', async () => {
    await registerAndVerify(app, 'erin@example.com');
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'erin@example.com', password: 'totally-wrong' });
    expect(res.status).toBe(401);
  });

  it('rejects requests with no Authorization header', async () => {
    const res = await request(app).get('/api/projects');
    expect(res.status).toBe(401);
  });
});
