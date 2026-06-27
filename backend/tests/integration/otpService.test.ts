import { User } from '../../src/models/User';
import { OtpToken } from '../../src/models/OtpToken';
import { issueOtp, verifyOtp } from '../../src/services/otpService';
import { waitForOtp } from '../helpers/waitForOtp';

async function makeUser(email: string) {
  return User.create({ name: 'Test', email, passwordHash: 'irrelevant-for-this-test' });
}

describe('otpService (direct, no HTTP layer)', () => {
  it('issues a code that verifies successfully and consumes the token', async () => {
    const user = await makeUser('direct1@example.com');
    const otpPromise = waitForOtp('direct1@example.com');
    await issueOtp(user._id, user.email, 'register');
    const code = await otpPromise;

    await expect(verifyOtp(user._id, 'register', code)).resolves.toBeUndefined();
    const remaining = await OtpToken.countDocuments({ userId: user._id });
    expect(remaining).toBe(0);
  });

  it('rejects when there is no active code for that purpose', async () => {
    const user = await makeUser('direct2@example.com');
    await expect(verifyOtp(user._id, 'login', '123456')).rejects.toThrow(/No active verification code/);
  });

  it('rejects an expired code and removes it', async () => {
    const user = await makeUser('direct3@example.com');
    const otpPromise = waitForOtp('direct3@example.com');
    await issueOtp(user._id, user.email, 'register');
    const code = await otpPromise;

    // Force expiry directly rather than waiting out OTP_TTL_SECONDS in real time.
    await OtpToken.updateMany({ userId: user._id }, { expiresAt: new Date(Date.now() - 1000) });

    await expect(verifyOtp(user._id, 'register', code)).rejects.toThrow(/expired/);
    expect(await OtpToken.countDocuments({ userId: user._id })).toBe(0);
  });

  it('increments the attempts counter on a wrong code', async () => {
    const user = await makeUser('direct4@example.com');
    const otpPromise = waitForOtp('direct4@example.com');
    await issueOtp(user._id, user.email, 'register');
    const realCode = await otpPromise;
    const wrongCode = realCode === '000000' ? '111111' : '000000';

    await expect(verifyOtp(user._id, 'register', wrongCode)).rejects.toThrow(/Incorrect verification code/);
    const token = await OtpToken.findOne({ userId: user._id });
    expect(token?.attempts).toBe(1);
  });

  it('locks out after exactly 5 wrong attempts, not 6', async () => {
    const user = await makeUser('direct4b@example.com');
    const otpPromise = waitForOtp('direct4b@example.com');
    await issueOtp(user._id, user.email, 'register');
    const realCode = await otpPromise;
    const wrongCode = realCode === '000000' ? '111111' : '000000';

    for (let i = 0; i < 4; i += 1) {
      await expect(verifyOtp(user._id, 'register', wrongCode)).rejects.toThrow(/Incorrect verification code/);
    }
    expect((await OtpToken.findOne({ userId: user._id }))?.attempts).toBe(4);

    // The 5th wrong attempt itself must trip the cap and delete the token --
    // not let one more guess through first.
    await expect(verifyOtp(user._id, 'register', wrongCode)).rejects.toThrow(/Too many incorrect attempts/);
    expect(await OtpToken.countDocuments({ userId: user._id })).toBe(0);

    await expect(verifyOtp(user._id, 'register', realCode)).rejects.toThrow(/No active verification code/);
  });

  it('replaces a previous unused OTP when a new one is issued for the same purpose', async () => {
    const user = await makeUser('direct5@example.com');
    await issueOtp(user._id, user.email, 'register');
    const firstCount = await OtpToken.countDocuments({ userId: user._id, purpose: 'register' });
    expect(firstCount).toBe(1);

    await issueOtp(user._id, user.email, 'register');
    const secondCount = await OtpToken.countDocuments({ userId: user._id, purpose: 'register' });
    expect(secondCount).toBe(1);
  });
});
