import { otpEvents } from '../../src/services/mailer';

export function waitForOtp(email: string): Promise<string> {
  return new Promise((resolve) => {
    const handler = (payload: { to: string; code: string }) => {
      if (payload.to === email.toLowerCase()) {
        otpEvents.off('otp-sent', handler);
        resolve(payload.code);
      }
    };
    otpEvents.on('otp-sent', handler);
  });
}
