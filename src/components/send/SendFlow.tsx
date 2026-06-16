import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../lib/store';
import { SoundEngine } from '../../lib/soundEngine';

const MAX_AMOUNT = 500;
const TRANSACTION_FEE = 2; // 2 BG fee per transaction

export default function SendFlow() {
  const { closeModal, user, balance, sendToUsername, searchUsers, searchResults, searching, showToast, openModal } = useStore();
  
  const [step, setStep] = useState<'search' | 'amount' | 'pin'>('search');
  const [recipientTag, setRecipientTag] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState<{ id: string; username: string; userTag: string } | null>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [senderPin, setSenderPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState('');

  const handleClose = () => {
    closeModal();
    setStep('search');
    setRecipientTag('');
    setSelectedRecipient(null);
    setAmount('');
    setNote('');
    setSenderPin('');
    setSearchInput('');
  };

  const handleSearch = useCallback(async () => {
    if (!searchInput.trim()) return;
    const results = await searchUsers(searchInput);
    if (results.length === 0) {
      showToast('User not found', 'error');
    }
  }, [searchInput, searchUsers, showToast]);

  const handleSelectRecipient = (recipient: { id: string; username: string; userTag: string }) => {
    setSelectedRecipient(recipient);
    setRecipientTag(recipient.userTag);
    setStep('amount');
  };

  const handleAmountNext = () => {
    const amt = parseInt(amount, 10);
    if (!amt || amt <= 0) {
      showToast('Enter a valid amount', 'error');
      return;
    }
    if (amt > MAX_AMOUNT) {
      showToast(`Maximum ${MAX_AMOUNT} BG per transaction`, 'error');
      return;
    }
    // Check if user has enough for amount + fee
    const totalCost = amt + TRANSACTION_FEE;
    if (totalCost > balance) {
      showToast(`Insufficient balance. Need ${totalCost} BG (${amt} + ${TRANSACTION_FEE} fee)`, 'error');
      return;
    }
    setStep('pin');
  };

  const handleSend = async () => {
    if (!selectedRecipient) return;
    if (!senderPin || senderPin.length !== 4) {
      showToast('Enter your 4-digit transaction PIN', 'error');
      return;
    }
    
    setLoading(true);
    try {
      const success = await sendToUsername(selectedRecipient.userTag, parseInt(amount, 10), note, senderPin);
      if (success) {
        SoundEngine.coinSend();
        handleClose();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send';
      showToast(message, 'error');
      SoundEngine.error();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput) {
        handleSearch();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput, handleSearch]);

  // Check for pending gig payment
  useEffect(() => {
    const pendingGig = sessionStorage.getItem('pendingPaymentGig');
    if (pendingGig) {
      const gig = JSON.parse(pendingGig);
      setAmount(String(gig.amount));
      setNote(`Payment for gig: ${gig.title}`);
      if (gig.workerUserTag) {
        setSearchInput(gig.workerUserTag);
        setTimeout(() => {
          handleSearch();
        }, 100);
      }
      sessionStorage.removeItem('pendingPaymentGig');
    }
  }, [handleSearch]);

  const amt = parseInt(amount, 10);
  const totalCost = amt && amt > 0 ? amt + TRANSACTION_FEE : 0;

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

        <AnimatePresence mode="wait">
          {step === 'search' && (
            <motion.div
              key="search"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Send Coins
              </h2>
              <p style={{ color: 'var(--text-meta)', fontSize: '13px', marginBottom: '24px' }}>
                Search by @username or display name
              </p>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-label)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 500 }}>
                  Recipient
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="input-dark"
                    placeholder="Search by @username or name"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    autoFocus
                  />
                  {searching && (
                    <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-meta)' }}>
                      ...
                    </div>
                  )}
                </div>
              </div>

              {searchResults.length > 0 && (
                <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {searchResults.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => handleSelectRecipient(result)}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '14px 16px',
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        width: '100%',
                        textAlign: 'left',
                        fontFamily: 'inherit',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                          {result.username}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-meta)' }}>
                          {result.userTag}
                        </div>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--gold)' }}>
                        ★ {result.reputationScore}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <button
                className="btn btn-primary"
                onClick={handleSearch}
                disabled={!searchInput.trim() || searching}
              >
                Search
              </button>
            </motion.div>
          )}

          {step === 'amount' && selectedRecipient && (
            <motion.div
              key="amount"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Send to {selectedRecipient.userTag}
              </h2>
              <p style={{ color: 'var(--text-meta)', fontSize: '13px', marginBottom: '24px' }}>
                Enter amount (Max {MAX_AMOUNT} BG per transaction)
              </p>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-label)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 500 }}>
                  Amount (Balance: {balance} BG)
                </label>
                <input
                  type="number"
                  className="input-dark"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="1"
                  max={Math.min(balance - TRANSACTION_FEE, MAX_AMOUNT)}
                />
              </div>

              {/* ✅ FEE DISPLAY - ADDED */}
              <div style={{ 
                fontSize: '12px', 
                color: 'var(--text-meta)', 
                marginTop: '8px',
                padding: '8px 12px',
                background: 'var(--bg-hover)',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                justifyContent: 'space-between',
              }}>
                <span>💰 Transaction fee:</span>
                <span style={{ fontWeight: 600, color: 'var(--gold)' }}>{TRANSACTION_FEE} BG</span>
              </div>
              <div style={{ 
                fontSize: '13px', 
                color: 'var(--text-secondary)', 
                marginTop: '4px',
                padding: '8px 12px',
                background: 'var(--bg-primary)',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                justifyContent: 'space-between',
                border: '1px solid var(--border-default)',
              }}>
                <span>Total cost:</span>
                <span style={{ fontWeight: 700, color: totalCost > 0 ? 'var(--gold)' : 'var(--text-meta)' }}>
                  {totalCost > 0 ? `${totalCost} BG` : '0 BG'}
                </span>
              </div>

              <div style={{ marginBottom: '24px', marginTop: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-label)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 500 }}>
                  Note (optional)
                </label>
                <input
                  type="text"
                  className="input-dark"
                  placeholder="What is this for?"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={100}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  className="btn btn-outline"
                  onClick={() => setStep('search')}
                  style={{ flex: 1 }}
                >
                  Back
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleAmountNext}
                  disabled={!amount || parseInt(amount, 10) <= 0}
                  style={{ flex: 1 }}
                >
                  Next
                </button>
              </div>
            </motion.div>
          )}

          {step === 'pin' && selectedRecipient && (
            <motion.div
              key="pin"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Verify Transaction
              </h2>
              <p style={{ color: 'var(--text-meta)', fontSize: '13px', marginBottom: '24px' }}>
                Enter your 4-digit transaction PIN
              </p>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-label)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 500 }}>
                  Your Transaction PIN
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  className="input-dark"
                  placeholder="****"
                  value={senderPin}
                  onChange={(e) => setSenderPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  style={{ textAlign: 'center', fontSize: '20px', letterSpacing: '8px' }}
                />
              </div>

              <div style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-lg)',
                padding: '16px',
                marginBottom: '24px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--text-meta)', fontSize: '13px' }}>To</span>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{selectedRecipient.userTag}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--text-meta)', fontSize: '13px' }}>Amount</span>
                  <span style={{ color: 'var(--gold)', fontWeight: 700 }}>{amount} BG</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--text-meta)', fontSize: '13px' }}>Fee</span>
                  <span style={{ color: 'var(--text-meta)', fontWeight: 600 }}>+{TRANSACTION_FEE} BG</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid var(--border-default)' }}>
                  <span style={{ color: 'var(--text-meta)', fontSize: '13px', fontWeight: 600 }}>Total deducted</span>
                  <span style={{ color: 'var(--gold)', fontWeight: 700 }}>{parseInt(amount) + TRANSACTION_FEE} BG</span>
                </div>
                {note && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                    <span style={{ color: 'var(--text-meta)', fontSize: '13px' }}>Note</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{note}</span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  className="btn btn-outline"
                  onClick={() => setStep('amount')}
                  style={{ flex: 1 }}
                >
                  Back
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleSend}
                  disabled={loading || senderPin.length !== 4}
                  style={{ flex: 1 }}
                >
                  {loading ? 'Sending...' : 'Confirm & Send'}
                </button>
              </div>

              <button
                onClick={() => {
                  closeModal();
                  openModal('pin');
                }}
                style={{
                  marginTop: '16px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-meta)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'center',
                  fontFamily: 'inherit',
                }}
              >
                Forgot PIN? Set new one
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}