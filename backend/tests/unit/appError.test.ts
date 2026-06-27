import { AppError } from '../../src/utils/AppError';

describe('AppError factories', () => {
  it.each([
    ['badRequest', 400],
    ['unauthorized', 401],
    ['forbidden', 403],
    ['notFound', 404],
    ['conflict', 409],
  ] as const)('%s maps to status %i', (factory, status) => {
    const err = AppError[factory]('message');
    expect(err.statusCode).toBe(status);
    expect(err.message).toBe('message');
    expect(err.isOperational).toBe(true);
  });

  it('unauthorized and forbidden have sensible defaults with no message', () => {
    expect(AppError.unauthorized().message).toBe('Unauthorized');
    expect(AppError.forbidden().message).toBe('Forbidden');
  });
});
