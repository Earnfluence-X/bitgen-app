import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TermsAgreementProps {
  onAgree: () => void;
  isSubmitting?: boolean;
  hasAgreed: boolean;
}

const TERMS_TEXT = `BITGEN - TERMS OF SERVICE
Last Updated: June 2026

1. ACCEPTANCE OF TERMS
By creating an account and using BitGen ("the App"), you agree to be bound by these Terms of Service. If you do not agree, do not use the App.

2. DEFINITION & NATURE OF COINS
2.1. BitGen Coins ("BG") are NOT real currency. They are virtual points used exclusively within the BitGen ecosystem.
2.2. BG coins have no monetary value outside the App and cannot be exchanged for real money, goods, or services outside the App.
2.3. BG coins are not backed by any government or financial institution and are not legal tender.

3. ACCOUNT ELIGIBILITY
3.1. You must be a currently enrolled student at a participating campus.
3.2. You must provide accurate and complete information during registration.
3.3. You must be at least 13 years old (or the legal age in your jurisdiction).

4. PROHIBITED ACTIVITIES
You agree NOT to:
4.1. Exchange BG coins for real money - Strictly prohibited
4.2. Sell or trade BG coins on external platforms
4.3. Use the App for illegal activities
4.4. Create multiple accounts
4.5. Attempt to manipulate or exploit the BG economy
4.6. Harass, bully, or intimidate other users
4.7. Post inappropriate or illegal content

5. COIN PURCHASES & IN-APP PURCHASES
5.1. BitGen may offer in-app purchases where users can acquire additional BG coins using real money.
5.2. All in-app purchases are non-refundable and non-transferable.
5.3. The exchange rate for BG coins is set by BitGen and may change.

6. DATA COLLECTION & PRIVACY
6.1. We collect: name, email, username, transaction history, device info, IP address, login activity.
6.2. We DO NOT sell your personal data to third parties.
6.3. You may request data deletion at any time.

7. ACCOUNT SUSPENSION & TERMINATION
7.1. BitGen reserves the right to suspend accounts violating these terms.
7.2. If suspended, you will lose access to your BG coins.

8. DISCLAIMER OF WARRANTIES
8.1. The App is provided "AS IS" without warranties of any kind.
8.2. You use the App at your own risk.

9. LIMITATION OF LIABILITY
9.1. BitGen shall not be liable for loss of BG coins, data, or indirect damages.

10. CONTACT INFORMATION
Email: earnfluencex@gmail.com

By checking "Agree & Continue", you acknowledge that you have read, understood, and agree to all terms above.`;

export default function TermsAgreement({ 
  onAgree, 
  isSubmitting = false,
  hasAgreed 
}: TermsAgreementProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [hasScrolled, setHasScrolled] = useState(false);

  const lines = TERMS_TEXT.split('\n');

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop } = scrollContainerRef.current;
    if (scrollTop > 20) {
      setHasScrolled(true);
    }
  };

  useEffect(() => {
    if (isExpanded) {
      setHasScrolled(false);
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
    }
  }, [isExpanded]);

  return (
    <div style={{ marginTop: '16px' }}>
      {/* Toggle Button - Pill Shape */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          width: '100%',
          padding: '10px 16px',
          background: isExpanded ? 'var(--green-bg)' : 'var(--bg-hover)',
          border: `1px solid ${isExpanded ? 'var(--green-border)' : 'var(--border-default)'}`,
          borderRadius: '50px',
          color: isExpanded ? 'var(--green)' : 'var(--text-meta)',
          fontSize: '13px',
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontFamily: 'inherit',
          transition: 'all 0.3s ease',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>📋</span>
          Terms of Agreement
          {hasAgreed && (
            <span style={{ 
              fontSize: '11px', 
              color: 'var(--green)',
              background: 'var(--green-bg)',
              padding: '2px 10px',
              borderRadius: '10px',
            }}>
              ✅ Agreed
            </span>
          )}
        </span>
        <span style={{
          fontSize: '18px',
          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.3s ease',
        }}>
          ▼
        </span>
      </button>

      {/* Expandable Terms Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              overflow: 'hidden',
              marginTop: '8px',
            }}
          >
            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              style={{
                height: '120px',
                overflowY: 'auto',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                fontSize: '13px',
                color: 'var(--text-secondary)',
                lineHeight: '1.6',
                position: 'relative',
                scrollBehavior: 'smooth',
              }}
            >
              {/* Gradient fade at bottom */}
              <div style={{
                position: 'sticky',
                bottom: 0,
                height: '30px',
                background: 'linear-gradient(to bottom, transparent, var(--bg-primary))',
                pointerEvents: 'none',
                marginTop: '-30px',
              }} />

              {lines.map((line, index) => {
                const isBold = line.startsWith('BITGEN') || 
                              line.includes('TERMS OF SERVICE') ||
                              line.match(/^\d+\./) ||
                              line.match(/^\d+\.\d+\./);
                const isHeader = line.includes('Last Updated:') || line.includes('Email:');
                
                return (
                  <div
                    key={index}
                    style={{
                      fontWeight: isBold ? 600 : 400,
                      color: isBold || isHeader ? 'var(--text-primary)' : 'var(--text-meta)',
                      fontSize: isBold && !isHeader ? '13px' : '12px',
                      padding: '1px 0',
                      borderBottom: line.startsWith('---') ? '1px solid var(--border-default)' : 'none',
                      marginBottom: line.startsWith('---') ? '4px' : '0',
                    }}
                  >
                    {line || '\u00A0'}
                  </div>
                );
              })}
            </div>

            {/* Scroll indicator */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '8px',
              fontSize: '11px',
              color: 'var(--text-meta)',
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>📜</span>
                {hasScrolled ? '✅ You\'ve scrolled through the terms' : 'Scroll to read more...'}
              </span>
              <span style={{ color: 'var(--text-muted)' }}>
                {Math.ceil((scrollContainerRef.current?.scrollTop || 0) / 20)} lines read
              </span>
            </div>

            {/* ✅ Agree Button - Always visible */}
            <button
              type="button"
              onClick={onAgree}
              disabled={isSubmitting}
              style={{
                width: '100%',
                marginTop: '12px',
                padding: '12px',
                background: hasScrolled ? 'var(--green)' : 'var(--green-dark)',
                border: 'none',
                borderRadius: '50px',
                color: 'var(--bg-primary)',
                fontSize: '15px',
                fontWeight: 700,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.6 : 1,
                fontFamily: 'inherit',
                transition: 'all 0.3s ease',
              }}
            >
              {isSubmitting ? 'Creating account...' : hasScrolled ? '✅ Agree & Continue' : 'Agree & Continue'}
            </button>

            <p style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              textAlign: 'center',
              marginTop: '8px',
            }}>
              By clicking "Agree & Continue", you accept the terms above
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}