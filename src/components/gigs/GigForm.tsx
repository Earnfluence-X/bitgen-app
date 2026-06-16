import { useState } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../../lib/store';

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

  const handleClose = () => {
    closeModal();
    setTitle('');
    setDescription('');
    setCategory('Other');
    setType('needed');
    setReward('');
    setIsPremium(false);
  };

  const totalCost = (parseInt(reward) || 0) + GIG_LISTING_FEE + (isPremium ? PREMIUM_GIG_PRICE : 0);

  const handleSubmit = async () => {
    if (!title.trim()) {
      showToast('Title is required', 'error');
      return;
    }
    const rewardNum = parseInt(reward, 10);
    if (!rewardNum || rewardNum <= 0) {
      showToast('Enter a valid reward amount', 'error');
      return;
    }

    if (user && user.balance < totalCost) {
      showToast(`Insufficient balance. Need ${totalCost} BG`, 'error');
      return;
    }

    setLoading(true);
    try {
      await postGig(title.trim(), description.trim(), category, type, rewardNum, isPremium);
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
            placeholder="How many BG coins?"
            value={reward}
            onChange={(e) => setReward(e.target.value)}
            min="1"
          />
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