import { useState } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../../lib/store';
import { COIN_PACKAGES, initializePaystackPayment, recordPurchase } from '../../lib/paystack';

interface BuyCoinsModalProps {
  onClose: () => void;
}

export default function BuyCoinsModal({ onClose }: BuyCoinsModalProps) {
  const { user, showToast } = useStore();
  const [selectedPackage, setSelectedPackage] = useState<typeof COIN_PACKAGES[0] | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePurchase = async (pkg: typeof COIN_PACKAGES[0]) => {
    if (!user) {
      showToast('Please login first', 'error');
      return;
    }

    setSelectedPackage(pkg);
    setLoading(true);

    initializePaystackPayment({
      email: user.email,
      amount: pkg.price * 100, // Convert to kobo
      metadata: {
        userId: user.id,
        username: user.username,
        packageId: pkg.id,
        coins: pkg.coins,
      },
      callback: async (response) => {
        setLoading(false);
        try {
          const success = await recordPurchase(
            user.id,
            user.username,
            pkg.id,
            pkg.coins,
            pkg.price,
            response.reference
          );
          
          if (success) {
            showToast(`🎉 Purchased ${pkg.coins} BG coins successfully!`, 'success');
            onClose();
          } else {
            showToast('Payment confirmed but failed to credit coins. Contact support.', 'error');
          }
        } catch (error) {
          showToast('Failed to process purchase', 'error');
        }
      },
      onClose: () => {
        setLoading(false);
        setSelectedPackage(null);
      },
    });
  };

  return (
    <div className="modal-overlay fade-in" onClick={onClose}>
      <motion.div
        className="modal-sheet slide-up"
        onClick={(e) => e.stopPropagation()}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        style={{ maxHeight: '85vh' }}
      >
        <div className="modal-handle" />

        <h2 style={{
          fontSize: '20px',
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginBottom: '4px',
        }}>
          💳 Buy BG Coins
        </h2>
        <p style={{
          color: 'var(--text-meta)',
          fontSize: '13px',
          marginBottom: '20px',
        }}>
          Choose a package to get started
        </p>

        {loading ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              border: '3px solid var(--border-default)',
              borderTopColor: 'var(--green)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 16px',
            }} />
            <div style={{ color: 'var(--text-secondary)', fontSize: '16px', fontWeight: 600 }}>
              Processing payment...
            </div>
            <p style={{ color: 'var(--text-meta)', fontSize: '13px', marginTop: '4px' }}>
              Please wait while we redirect you to Paystack
            </p>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}>
            {COIN_PACKAGES.map((pkg) => {
              const pricePerCoin = (pkg.price / pkg.coins).toFixed(2);
              
              return (
                <button
                  key={pkg.id}
                  onClick={() => handlePurchase(pkg)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 18px',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-lg)',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: '0.2s',
                    width: '100%',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--green-border)';
                    e.currentTarget.style.background = 'var(--bg-hover)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-default)';
                    e.currentTarget.style.background = 'var(--bg-primary)';
                  }}
                >
                  <div>
                    <div style={{
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      fontSize: '15px',
                    }}>
                      {pkg.name}
                    </div>
                    <div style={{
                      fontSize: '13px',
                      color: 'var(--text-meta)',
                    }}>
                      {pkg.coins} BG • {pkg.priceDisplay}
                    </div>
                  </div>
                  <div style={{
                    textAlign: 'right',
                  }}>
                    <div style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: 'var(--green)',
                    }}>
                      {pkg.priceDisplay}
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                    }}>
                      ₦{pricePerCoin}/coin
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <div style={{
          marginTop: '16px',
          padding: '12px',
          background: 'var(--bg-hover)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '12px',
          color: 'var(--text-meta)',
          textAlign: 'center',
        }}>
          💳 Secure payment via Paystack • Instant coin delivery
        </div>

        <button
          className="btn btn-outline"
          onClick={onClose}
          style={{ marginTop: '16px' }}
          disabled={loading}
        >
          Cancel
        </button>
      </motion.div>
    </div>
  );
}