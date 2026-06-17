import { useState } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../../lib/store';
import { sanitizeText, validateGigInput } from '../../lib/validation';

const categories = ['Tutoring', 'Errands', 'Tech Help', 'Creative', 'Rides', 'Food', 'Other'];
const GIG_LISTING_FEE = 2;
const PREMIUM_GIG_PRICE = 15;

export default function GigForm() {
  const { closeModal, postGig, showToast, user } = useStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Other');
  const [type, setType] = useState<'needed' | 'offered'>('needed');
  const [reward, setReward] = useState('');
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const handleClose = () => {
    closeModal();
    setTitle('');
    setDescription('');
    setCategory('Other');
    setType('needed');
    setReward('');
    setIsPremium(false);
    setErrors([]);
  };

  const totalCost = (parseInt(reward) || 0) + GIG_LISTING_FEE + (isPremium ? PREMIUM_GIG_PRICE : 0);

  const handleSubmit = async () => {
    const rewardNum = parseInt(reward, 10);
    
    // ✅ Validate input
    const validation = validateGigInput(title, description, rewardNum);
    if (!validation.valid) {
      setErrors(validation.errors);
      // Show first error as toast
      if (validation.errors.length > 0) {
        showToast(validation.errors[0], 'error');
      }
      return;
    }
    setErrors([]);

    if (user && user.balance < totalCost) {
      showToast(`Insufficient balance. Need ${totalCost} BG`, 'error');
      return;
    }

    // ✅ Sanitize input
    const sanitizedTitle = sanitizeText(title);
    const sanitizedDescription = sanitizeText(description);

    setLoading(true);
    try {
      await postGig(sanitizedTitle, sanitizedDescription, category, type, rewardNum, isPremium);
      handleClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to post gig';
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay fade-in" onClick={handleClose}>
      <motion.div
        className="modal-sheet slide-up"
        onClick={(e) => e.stopPropagation()}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
      >
        <div className="modal-handle" />
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
          Post a Gig
        </h2>
        <p style={{ color: 'var(--text-meta)', fontSize: '13px', marginBottom: '24px' }}>
          Offer your services or request help from others
        </p>

        {errors.length > 0 && (
          <div style={{
            background: 'var(--red-bg)',
            border: '1px solid var(--red-border)',
            borderRadius: 'var(--radius-md)',
            padding: '12px',
            marginBottom: '16px',
          }}>
            {errors.map((error, index) => (
              <div key={index} style={{ color: 'var(--red)', fontSize: '13px' }}>
                • {error}
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button
            onClick={() => setType('needed')}
            style={{
              flex: 1,
              padding: '12px',
              background: type === 'needed' ? 'var(--red-bg)' : 'var(--bg-primary)',
              border: `1.5px solid ${type === 'needed' ? 'var(--red-border)' : 'var(--border-default)'}`,
              borderRadius: 'var(--radius-md)',
              color: type === 'needed' ? 'var(--red)' : 'var(--text-muted)',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            I Need Help
          </button>
          <button
            onClick={() => setType('offered')}
            style={{
              flex: 1,
              padding: '12px',
              background: type === 'offered' ? 'var(--green-bg)' : 'var(--bg-primary)',
              border: `1.5px solid ${type === 'offered' ? 'var(--green-border)' : 'var(--border-default)'}`,
              borderRadius: 'var(--radius-md)',
              color: type === 'offered' ? 'var(--green)' : 'var(--text-muted)',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            I Can Help
          </button>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-label)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 500 }}>
            Title
          </label>
          <input
            type="text"
            className="input-dark"
            placeholder="e.g., Need math tutor for calculus"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={80}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-label)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 500 }}>
            Description (optional)
          </label>
          <textarea
            className="input-dark"
            placeholder="Describe what you need or offer..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={300}
            rows={3}
            style={{ resize: 'none' }}
          />
          <div style={{ fontSize: '11px', color: 'var(--text-meta)', textAlign: 'right', marginTop: '4px' }}>
            {description.length}/300
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-label)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 500 }}>
            Category
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                style={{
                  padding: '8px 14px',
                  background: category === cat ? 'var(--green-bg)' : 'var(--bg-primary)',
                  border: `1px solid ${category === cat ? 'var(--green-border)' : 'var(--border-default)'}`,
                  borderRadius: 'var(--radius-full)',
                  color: category === cat ? 'var(--green)' : 'var(--text-meta)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-label)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 500 }}>
            Coin Reward
          </label>
          <input
            type="number"
            className="input-dark"
            placeholder="How many BG coins? (Max 1000)"
            value={reward}
            onChange={(e) => setReward(e.target.value)}
            min="1"
            max="1000"
          />
          <div style={{ fontSize: '11px', color: 'var(--text-meta)', marginTop: '4px' }}>
            Min: 1 BG • Max: 1000 BG
          </div>
        </div>

        {/* Premium Gig Option */}
        <div style={{ 
          marginBottom: '16px',
          padding: '12px',
          background: isPremium ? 'var(--gold-bg)' : 'var(--bg-primary)',
          border: `1px solid ${isPremium ? 'var(--gold-border)' : 'var(--border-default)'}`,
          borderRadius: 'var(--radius-md)',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
        onClick={() => setIsPremium(!isPremium)}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600, color: isPremium ? 'var(--gold)' : 'var(--text-secondary)' }}>
                ⭐ Premium Listing
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-meta)' }}>
                Featured for 24 hours • +{PREMIUM_GIG_PRICE} BG
              </div>
            </div>
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              border: `2px solid ${isPremium ? 'var(--gold)' : 'var(--border-default)'}`,
              background: isPremium ? 'var(--gold)' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--bg-primary)',
              fontSize: '14px',
            }}>
              {isPremium && '✓'}
            </div>
          </div>
        </div>

        {/* Fee Summary */}
        <div style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)',
          padding: '12px',
          marginBottom: '16px',
        }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
            Fee Summary
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-meta)' }}>
            <span>Listing Fee</span>
            <span>+{GIG_LISTING_FEE} BG</span>
          </div>
          {isPremium && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--gold)' }}>
              <span>Premium Upgrade</span>
              <span>+{PREMIUM_GIG_PRICE} BG</span>
            </div>
          )}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            fontSize: '14px', 
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginTop: '8px',
            paddingTop: '8px',
            borderTop: '1px solid var(--border-default)',
          }}>
            <span>Total Cost</span>
            <span style={{ color: totalCost > 0 ? 'var(--gold)' : 'var(--text-meta)' }}>
              {totalCost > 0 ? `${totalCost} BG` : '0 BG'}
            </span>
          </div>
        </div>

        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={loading || !title.trim() || !reward || totalCost <= 0}
          style={{
            opacity: loading || !title.trim() || !reward || totalCost <= 0 ? 0.5 : 1,
          }}
        >
          {loading ? 'Posting...' : `Post Gig (${totalCost} BG)`}
        </button>
      </motion.div>
    </div>
  );
}