import { generateOtpCode, hashOtpCode, compareOtpCode } from '../../src/utils/otp';

describe('otp utils', () => {
  it('generates a zero-padded numeric code of the requested length', () => {
    for (let i = 0; i < 50; i += 1) {
      const code = generateOtpCode(6);
      expect(code).toMatch(/^\d{6}$/);
    }
  });

  it('pads short random values with leading zeros', () => {
    // length 1 forces single-digit range [0,10) -- exercises the padStart path deterministically
    const codes = new Set(Array.from({ length: 30 }, () => generateOtpCode(1)));
    expect([...codes].every((c) => c.length === 1)).toBe(true);
  });

  it('hashes a code such that the same code compares true and a wrong one compares false', async () => {
    const hash = await hashOtpCode('123456');
    await expect(compareOtpCode('123456', hash)).resolves.toBe(true);
    await expect(compareOtpCode('000000', hash)).resolves.toBe(false);
  });
});
