import { useState } from 'react';
import { useStore } from '../../lib/store';
import { createReport } from '../../lib/admin';
import { motion } from 'framer-motion';

interface ReportButtonProps {
  targetId: string;
  targetUsername: string;
  targetType: 'user' | 'gig' | 'transaction';
}

const REPORT_REASONS = [
  'Spam or Misleading',
  'Harassment or Bullying',
  'Inappropriate Content',
  'Scam or Fraud',
  'Fake Profile',
  'Other',
];

export default function ReportButton({ targetId, targetUsername, targetType }: ReportButtonProps) {
  const { user, showToast } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReport = async () => {
    if (!user) {
      showToast('Please login to report', 'error');
      return;
    }

    if (!reason) {
      showToast('Please select a reason', 'error');
      return;
    }

    setLoading(true);
    try {
      await createReport({
        reporterId: user.id,
        reporterUsername: user.username,
        targetId,
        targetUsername,
        targetType,
        reason,
        description: description || 'No additional details provided',
      });
      
      showToast('Report submitted. We\'ll review it shortly.', 'success');
      setShowModal(false);
      setReason('');
      setDescription('');
    } catch (error) {
      showToast('Failed to submit report', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-meta)',
          fontSize: '12px',
          cursor: 'pointer',
          fontFamily: 'inherit',
          padding: '4px 8px',
          borderRadius: '4px',
        }}
      >
        ⚠️ Report
      </button>

      {showModal && (
        <div className="modal-overlay fade-in" onClick={() => setShowModal(false)}>
          <motion.div
            className="modal-sheet slide-up"
            onClick={(e) => e.stopPropagation()}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
          >
            <div className="modal-handle" />
            
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
              Report {targetType}
            </h2>
            <p style={{ color: 'var(--text-meta)', fontSize: '13px', marginBottom: '24px' }}>
              Reporting: <strong>{targetUsername}</strong>
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-label)', marginBottom: '8px' }}>
                Reason
              </label>
              <select
                className="input-dark"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                style={{ appearance: 'auto' }}
              >
                <option value="">Select a reason...</option>
                {REPORT_REASONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-label)', marginBottom: '8px' }}>
                Additional Details (optional)
              </label>
              <textarea
                className="input-dark"
                placeholder="Provide more context..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                style={{ resize: 'none' }}
              />
            </div>

            <button
              className="btn btn-primary"
              onClick={handleReport}
              disabled={loading || !reason}
              style={{ background: loading ? 'var(--text-muted)' : 'var(--red)' }}
            >
              {loading ? 'Submitting...' : 'Submit Report'}
            </button>

            <button
              className="btn btn-outline"
              onClick={() => setShowModal(false)}
              style={{ marginTop: '12px' }}
            >
              Cancel
            </button>
          </motion.div>
        </div>
      )}
    </>
  );
}