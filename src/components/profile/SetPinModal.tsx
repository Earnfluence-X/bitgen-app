import { useState } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../../lib/store';

export default function SetPinModal() {
  const { closeModal, setTransactionPin, showToast } = useStore();
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    closeModal();
    setPin('');
    setConfirmPin('');
  };

  const handleSubmit = async () => {
    if (pin.length !== 4) {
      showToast('PIN must be 4 digits', 'error');
      return;
    }
    if (pin !== confirmPin) {
      showToast('PINs do not match', 'error');
      return;
    }
    setLoading(true);
    try {
      await setTransactionPin(pin);
      handleClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to set PIN';
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
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        <div className="modal-handle" />
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', textAlign: 'center' }}>
          Set Transaction PIN
        </h2>
        <p style={{ color: 'var(--text-meta)', fontSize: '13px', marginBottom: '24px', textAlign: 'center' }}>
          Create a 4-digit PIN to authorize sends
        </p>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-label)', marginBottom: '8px' }}>
            Enter PIN
          </label>
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            className="input-dark"
            placeholder="****"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            style={{ textAlign: 'center', fontSize: '24px', letterSpacing: '8px' }}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-label)', marginBottom: '8px' }}>
            Confirm PIN
          </label>
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            className="input-dark"
            placeholder="****"
            value={confirmPin}
            onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            style={{ textAlign: 'center', fontSize: '24px', letterSpacing: '8px' }}
          />
        </div>

        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={loading || pin.length !== 4 || confirmPin.length !== 4}
        >
          {loading ? 'Setting...' : 'Set PIN'}
        </button>
      </motion.div>
    </div>
  );
}