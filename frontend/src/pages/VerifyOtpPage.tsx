import { FormEvent, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { verifyOtp } from '../api/endpoints';
import { ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';

interface LocationState {
  purpose: 'register' | 'login';
  userId: string;
  email: string;
}

export function VerifyOtpPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const auth = useAuth();
  const state = location.state as LocationState | undefined;
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!state) {
      navigate('/login');
    }
  }, [state, navigate]);

  if (!state) {
    return null;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await verifyOtp(state!.purpose, state!.userId, code);
      auth.login(res.token, res.user);
      navigate('/projects');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-card">
      <h1>Enter your verification code</h1>
      <p className="hint">
        We sent a 6-digit code to <strong>{state.email}</strong>. In dev/CI without SMTP configured, check the API
        server logs -- it's printed there instead of emailed.
      </p>
      <form onSubmit={handleSubmit}>
        <label>
          Code
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            maxLength={6}
            inputMode="numeric"
            autoFocus
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={submitting || code.length !== 6}>
          {submitting ? 'Verifying...' : 'Verify'}
        </button>
      </form>
    </div>
  );
}
