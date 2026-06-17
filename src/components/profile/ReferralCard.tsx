import { useStore } from '../../lib/store';

export default function ReferralCard() {
  const { user, showToast } = useStore();
  if (!user) return null;

  const referralCode = user.username.toUpperCase().slice(0, 4) + user.id.slice(0, 4).toUpperCase();

  const handleCopy = () => {
    navigator.clipboard.writeText(referralCode).then(() => {
      showToast('Referral code copied! Share with friends!', 'success');
    }).catch(() => {
      showToast('Code: ' + referralCode, 'info');
    });
  };

  return (
    <div style={{
      background: 'var(--bg-primary)',
      border: '1px solid var(--gold-border)',
      borderRadius: 'var(--radius-lg)',
      padding: '16px',
    }}>
      <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
        🎁 Invite Friends
      </div>
      <div style={{ fontSize: '12px', color: 'var(--text-meta)', marginBottom: '12px' }}>
        Share your code. Both of you get <strong style={{ color: 'var(--gold)' }}>25 BG</strong> when they sign up!
      </div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}>
        <div style={{
          flex: 1,
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 14px',
          fontFamily: 'var(--font-mono)',
          fontSize: '16px',
          fontWeight: 700,
          color: 'var(--green)',
          letterSpacing: '2px',
        }}>
          {referralCode}
        </div>
        <button
          onClick={handleCopy}
          style={{
            padding: '12px 16px',
            background: 'var(--green-bg)',
            border: '1px solid var(--green-border)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--green)',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '13px',
            fontFamily: 'inherit',
          }}
        >
          Copy
        </button>
      </div>
      <div style={{
        marginTop: '12px',
        padding: '8px 12px',
        background: 'var(--bg-surface)',
        borderRadius: 'var(--radius-sm)',
        fontSize: '11px',
        color: 'var(--text-meta)',
        textAlign: 'center',
      }}>
        💡 Share your code on WhatsApp, Instagram, or with friends!
      </div>
    </div>
  );
}