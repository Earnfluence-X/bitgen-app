import { useState } from 'react';
import { auth, signInWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail } from '../../lib/firebase';

interface LoginFormProps {
  onSwitch: () => void;
}

export default function LoginForm({ onSwitch }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resendSent, setResendSent] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('All fields are required');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      
      if (!userCred.user.emailVerified) {
        setError('Please verify your email before logging in. Check your inbox.');
        setLoading(false);
        return;
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      if (message.includes('invalid-credential') || message.includes('wrong-password')) {
        setError('Invalid email or password');
      } else if (message.includes('user-not-found')) {
        setError('No account found with this email');
      } else if (message.includes('too-many-requests')) {
        setError('Too many attempts. Try again later.');
      } else {
        setError('Login failed. Check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Enter your email first');
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
      setError('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send reset email';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email || !password) {
      setError('Enter both email and password first');
      return;
    }
    setLoading(true);
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(userCred.user);
      setResendSent(true);
      setError('');
      await auth.signOut();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to resend verification';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-label)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 500 }}>
          Email
        </label>
        <input
          type="email"
          className="input-dark"
          placeholder="you@campus.edu"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
      </div>
      <div>
        <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-label)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 500 }}>
          Password
        </label>
        <input
          type="password"
          className="input-dark"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
        <button
          type="button"
          onClick={handleForgotPassword}
          disabled={loading}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-meta)',
            fontSize: '12px',
            cursor: 'pointer',
            marginTop: '8px',
            textAlign: 'right',
            width: '100%',
            fontFamily: 'inherit',
          }}
        >
          {resetSent ? 'Reset email sent! Check your inbox.' : 'Forgot password?'}
        </button>
      </div>

      {error && (
        <div style={{ color: 'var(--red)', fontSize: '13px', fontWeight: 500 }}>
          {error}
        </div>
      )}

      {error === 'Please verify your email before logging in. Check your inbox.' && (
        <button
          type="button"
          onClick={handleResendVerification}
          disabled={loading || resendSent}
          style={{
            background: 'var(--green-bg)',
            border: '1px solid var(--green-border)',
            borderRadius: 'var(--radius-md)',
            padding: '10px',
            color: 'var(--green)',
            fontSize: '13px',
            cursor: 'pointer',
            fontFamily: 'inherit',
            marginTop: '8px',
          }}
        >
          {resendSent ? 'Verification email sent! Check your inbox.' : 'Resend verification email'}
        </button>
      )}

      <button
        type="submit"
        className="btn btn-primary"
        disabled={loading}
        style={{ marginTop: '8px' }}
      >
        {loading ? 'Signing in...' : 'Sign In'}
      </button>

      <div style={{ textAlign: 'center', marginTop: '8px' }}>
        <span style={{ color: 'var(--text-meta)', fontSize: '14px' }}>No account? </span>
        <button
          type="button"
          onClick={onSwitch}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--green)',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 600,
            fontFamily: 'inherit',
          }}
        >
          Create one
        </button>
      </div>
    </form>
  );
}