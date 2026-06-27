// Runs via jest "setupFiles", before any test file (and therefore before src/config/env.ts
// is ever imported) -- MONGO_URI here is a placeholder; tests actually connect to the
// real in-memory MongoDB instance started in tests/setup.ts, not this URI.
process.env.NODE_ENV = 'test';
process.env.MONGO_URI = 'mongodb://placeholder:27017/taskforge-test';
process.env.JWT_SECRET = 'test-secret-do-not-use-in-production-1234567890';
process.env.JWT_EXPIRES_IN = '1h';
process.env.OTP_TTL_SECONDS = '300';
process.env.OTP_LENGTH = '6';
process.env.CORS_ORIGIN = 'http://localhost:3000';
