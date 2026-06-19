// src/components/admin/CreateAnnouncement.tsx

import { useState } from 'react';
import { motion } from 'framer-motion';
import { db, collection, addDoc, serverTimestamp } from '../../lib/firebase';
import { useStore } from '../../lib/store';

interface CreateAnnouncementProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateAnnouncement({ onClose, onSuccess }: CreateAnnouncementProps) {
  const { user } = useStore();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'info' | 'warning' | 'important'>('info');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !message.trim()) {
      alert('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'announcements'), {
        title: title.trim(),
        message: message.trim(),
        priority,
        createdBy: user?.username || 'Admin',
        createdAt: serverTimestamp(),
        readBy: [],
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating announcement:', error);
      alert('Failed to create announcement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay fade-in" onClick={onClose}>
      <motion.div
        className="modal-sheet slide-up"
        onClick={(e) => e.stopPropagation()}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
      >
        <div className="modal-handle" />

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>
          📢 Create Announcement
        </h2>
        <p style={{ color: 'var(--text-meta)', fontSize: '13px', marginBottom: '20px' }}>
          Send a message to all users
        </p>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-label)', marginBottom: '8px' }}>
            Title
          </label>
          <input
            type="text"
            className="input-dark"
            placeholder="Announcement title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={50}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-label)', marginBottom: '8px' }}>
            Message
          </label>
          <textarea
            className="input-dark"
            placeholder="Write your announcement..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            style={{ resize: 'none' }}
            maxLength={500}
          />
          <div style={{ fontSize: '11px', color: 'var(--text-meta)', textAlign: 'right', marginTop: '4px' }}>
            {message.length}/500
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-label)', marginBottom: '8px' }}>
            Priority
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {(['info', 'warning', 'important'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPriority(p)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  background: priority === p ? 'var(--green-bg)' : 'transparent',
                  border: `1px solid ${priority === p ? 'var(--green-border)' : 'var(--border-default)'}`,
                  color: priority === p ? 'var(--green)' : 'var(--text-meta)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  textTransform: 'capitalize',
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={loading || !title.trim() || !message.trim()}
        >
          {loading ? 'Sending...' : '📨 Send Announcement'}
        </button>

        <button
          className="btn btn-outline"
          onClick={onClose}
          style={{ marginTop: '12px' }}
        >
          Cancel
        </button>
      </motion.div>
    </div>
  );
}