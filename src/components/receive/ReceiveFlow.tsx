import { useStore } from '../../lib/store';
import { motion } from 'framer-motion';

export default function ReceiveFlow() {
  const { closeModal, user } = useStore();

  const handleClose = () => {
    closeModal();
  };

  return (
    <div className="modal-overlay fade-in" onClick={handleClose}>
      <motion.div
        className="modal-sheet slide-up"
        onClick={(e) => e.stopPropagation()}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        <div className="modal-handle" />

        <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px', textAlign: 'center' }}>
          Receive Coins
        </h2>
        <p style={{ color: 'var(--text-meta)', fontSize: '13px', marginBottom: '28px', textAlign: 'center' }}>
          Coins are received automatically when someone sends to your @username. No PIN needed.
        </p>

        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          marginBottom: '24px',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📤</div>
          <div style={{ color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '8px' }}>
            Share your @username
          </div>
          <div style={{ color: 'var(--green)', fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
            {user?.userTag || '@username'}
          </div>
        </div>

        <p style={{ color: 'var(--text-meta)', fontSize: '13px', textAlign: 'center', marginBottom: '16px' }}>
          When someone sends coins to your @username, they will appear here automatically.
        </p>

        <button className="btn btn-outline" onClick={handleClose}>
          Close
        </button>
      </motion.div>
    </div>
  );
}