import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';

export default function OnboardingScreen() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  return (
    <div className="app-container">
      <div style={{ padding: '60px 24px 40px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Logo and Branding */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: 'linear-gradient(145deg, #FFD700 0%, #FFC107 30%, #E6C200 60%, #BF9B00 100%)',
            boxShadow: '0 4px 20px rgba(255, 215, 0, 0.3), inset 0 -2px 4px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 900,
            fontSize: '34px',
            color: '#8B6914',
            margin: '0 auto 20px',
            border: '2px solid rgba(255,255,255,0.2)',
            position: 'relative',
          }}>
            B
          </div>
          <h1 style={{
            fontSize: '32px',
            fontWeight: 700,
            letterSpacing: '-0.5px',
            color: 'var(--text-primary)',
            marginBottom: '8px',
          }}>
            Bit<span style={{ color: 'var(--green)' }}>Gen</span>
          </h1>
          <p style={{
            color: 'var(--text-meta)',
            fontSize: '15px',
            lineHeight: 1.5,
          }}>
            Campus micro-currency exchange
          </p>
        </div>

        {/* Auth Form */}
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, x: mode === 'login' ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: mode === 'login' ? 20 : -20 }}
            transition={{ duration: 0.2 }}
            style={{ flex: 1 }}
          >
            {mode === 'login' ? (
              <LoginForm onSwitch={() => setMode('signup')} />
            ) : (
              <SignupForm onSwitch={() => setMode('login')} />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Footer */}
        <div style={{ textAlign: 'center', paddingTop: '24px', paddingBottom: '20px' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
            No real money involved. Virtual campus currency only.
          </p>
        </div>
      </div>
    </div>
  );
}
