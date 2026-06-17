import { useState } from 'react';
import { auth, db, createUserWithEmailAndPassword, sendEmailVerification, doc, setDoc, serverTimestamp } from '../../lib/firebase';
import { generateUniqueUserTag } from '../../lib/utils';
import TermsAgreement from './TermsAgreement';

interface SignupFormProps {
  onSwitch: () => void;
}

export default function SignupForm({ onSwitch }: SignupFormProps) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email || !password) {
      setError('All fields are required');
      return;
    }
    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (!agreedToTerms) {
      setError('You must agree to the Terms of Service');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      
      await sendEmailVerification(cred.user);
      
      const userTag = await generateUniqueUserTag(username);

      await setDoc(doc(db, 'users', cred.user.uid), {
        email,
        username: username.toLowerCase(),
        userTag: userTag,
        balance: 100,
        totalEarned: 100,
        totalSpent: 0,
        transactionPin: '',
        gigsCompleted: 0,
        gigsPosted: 0,
        reputationScore: 5,
        reputationCount: 0,
        loginStreak: 1,
        lastLoginDate: new Date().toISOString().split('T')[0],
        lastBonusDate: '',
        emailVerified: false,
        agreedToTerms: true,
        agreedToTermsAt: new Date().toISOString(),
        createdAt: serverTimestamp(),
      });
      
      setVerificationSent(true);
      
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Signup failed';
      if (message.includes('email-already-in-use')) {
        setError('Email already registered');
      } else if (message.includes('weak-password')) {
        setError('Password too weak (min 6 chars)');
      } else if (message.includes('invalid-email')) {
        setError('Invalid email address');
      } else {
        setError('Signup failed. Try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTermsAgree = () => {
    setAgreedToTerms(true);
    setError('');
  };

  // Show verification screen after signup
  if (verificationSent) {
    return (
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'var(--green-bg)',
          border: '2px solid var(--green-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
          Verify Your Email
        </h2>
        <p style={{ color: 'var(--text-meta)', fontSize: '14px', marginBottom: '16px' }}>
          We sent a verification link to<br />
          <strong style={{ color: 'var(--green)' }}>{email}</strong>
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '24px' }}>
          Click the link in the email to activate your account.<br />
          You won't be able to send coins until verified.
        </p>
        <button
          className="btn btn-primary"
          onClick={() => onSwitch()}
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-label)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 500 }}>
          Username
        </label>
        <input
          type="text"
          className="input-dark"
          placeholder="Choose a username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
        />
        <p style={{ fontSize: '11px', color: 'var(--text-meta)', marginTop: '4px' }}>
          Your unique tag will be @{username.toLowerCase().replace(/[^a-z0-9]/g, '')} (numbers added if taken)
        </p>
      </div>
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
          placeholder="Min 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
        />
      </div>

      {/* ✅ TERMS AGREEMENT - Pill Shape at Bottom */}
      <TermsAgreement 
        onAgree={handleTermsAgree} 
        isSubmitting={loading}
        hasAgreed={agreedToTerms}
      />

      {error && (
        <div style={{ color: 'var(--red)', fontSize: '13px', fontWeight: 500 }}>
          {error}
        </div>
      )}

      {/* ✅ CREATE ACCOUNT BUTTON - Always visible, disabled if not agreed */}
      <button
        type="submit"
        className="btn btn-primary"
        disabled={loading || !agreedToTerms}
        style={{ 
          marginTop: '8px',
          opacity: agreedToTerms ? 1 : 0.4,
          cursor: agreedToTerms ? 'pointer' : 'not-allowed',
        }}
      >
        {loading ? 'Creating account...' : 'Create Account'}
      </button>

      <div style={{ textAlign: 'center', marginTop: '4px' }}>
        <span style={{ color: 'var(--text-meta)', fontSize: '14px' }}>Already have an account? </span>
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
          Sign in
        </button>
      </div>
    </form>
  );
}