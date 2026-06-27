import { signAccessToken, verifyAccessToken } from '../../src/utils/jwt';

describe('jwt utils', () => {
  it('round-trips a payload through sign and verify', () => {
    const token = signAccessToken({ sub: 'user-1', email: 'a@b.com' });
    const decoded = verifyAccessToken(token);
    expect(decoded.sub).toBe('user-1');
    expect(decoded.email).toBe('a@b.com');
  });

  it('rejects a tampered token', () => {
    const token = signAccessToken({ sub: 'user-1', email: 'a@b.com' });
    const tampered = token.slice(0, -2) + (token.endsWith('a') ? 'b' : 'a');
    expect(() => verifyAccessToken(tampered)).toThrow();
  });
});
