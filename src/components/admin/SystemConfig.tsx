// src/components/admin/SystemConfig.tsx

import { useState, useEffect } from 'react';
import { db, doc, getDoc, updateDoc } from '../../lib/firebase';

interface Config {
  maxTransactionAmount: number;
  transactionFee: number;
  gigListingFee: number;
  premiumGigPrice: number;
  dailyBonusBase: number;
  maxDailyBonus: number;
  referralBonus: number;
  maintenanceMode: boolean;
  registrationOpen: boolean;
}

const DEFAULT_CONFIG: Config = {
  maxTransactionAmount: 500,
  transactionFee: 2,
  gigListingFee: 2,
  premiumGigPrice: 15,
  dailyBonusBase: 5,
  maxDailyBonus: 25,
  referralBonus: 25,
  maintenanceMode: false,
  registrationOpen: true,
};

export default function SystemConfig() {
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const configDoc = await getDoc(doc(db, 'config', 'system'));
      if (configDoc.exists()) {
        setConfig({ ...DEFAULT_CONFIG, ...configDoc.data() });
      }
    } catch (error) {
      console.error('Error loading config:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    setMessage('');
    try {
      await updateDoc(doc(db, 'config', 'system'), {
        ...config,
        updatedAt: new Date().toISOString(),
      });
      setMessage('✅ Settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving config:', error);
      setMessage('❌ Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading config...</div>;
  }

  return (
    <div>
      <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '16px' }}>
        ⚙️ System Configuration
      </h3>
      <p style={{ color: 'var(--text-meta)', fontSize: '13px', marginBottom: '20px' }}>
        Adjust platform settings. Changes take effect immediately.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Economy Settings */}
        <div style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
        }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '12px' }}>
            💰 Economy Settings
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-meta)' }}>Max Transaction Amount</label>
              <input
                type="number"
                className="input-dark"
                value={config.maxTransactionAmount}
                onChange={(e) => setConfig({ ...config, maxTransactionAmount: Number(e.target.value) })}
                style={{ marginTop: '4px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-meta)' }}>Transaction Fee (BG)</label>
              <input
                type="number"
                className="input-dark"
                value={config.transactionFee}
                onChange={(e) => setConfig({ ...config, transactionFee: Number(e.target.value) })}
                style={{ marginTop: '4px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-meta)' }}>Gig Listing Fee (BG)</label>
              <input
                type="number"
                className="input-dark"
                value={config.gigListingFee}
                onChange={(e) => setConfig({ ...config, gigListingFee: Number(e.target.value) })}
                style={{ marginTop: '4px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-meta)' }}>Premium Gig Price (BG)</label>
              <input
                type="number"
                className="input-dark"
                value={config.premiumGigPrice}
                onChange={(e) => setConfig({ ...config, premiumGigPrice: Number(e.target.value) })}
                style={{ marginTop: '4px' }}
              />
            </div>
          </div>
        </div>

        {/* Bonus Settings */}
        <div style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
        }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '12px' }}>
            🎁 Bonus Settings
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-meta)' }}>Daily Bonus Base (BG)</label>
              <input
                type="number"
                className="input-dark"
                value={config.dailyBonusBase}
                onChange={(e) => setConfig({ ...config, dailyBonusBase: Number(e.target.value) })}
                style={{ marginTop: '4px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-meta)' }}>Max Daily Bonus (BG)</label>
              <input
                type="number"
                className="input-dark"
                value={config.maxDailyBonus}
                onChange={(e) => setConfig({ ...config, maxDailyBonus: Number(e.target.value) })}
                style={{ marginTop: '4px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-meta)' }}>Referral Bonus (BG)</label>
              <input
                type="number"
                className="input-dark"
                value={config.referralBonus}
                onChange={(e) => setConfig({ ...config, referralBonus: Number(e.target.value) })}
                style={{ marginTop: '4px' }}
              />
            </div>
          </div>
        </div>

        {/* Platform Settings */}
        <div style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
        }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '12px' }}>
            🔧 Platform Settings
          </div>
          
          <div style={{ display: 'flex', gap: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={config.maintenanceMode}
                onChange={(e) => setConfig({ ...config, maintenanceMode: e.target.checked })}
              />
              Maintenance Mode
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={config.registrationOpen}
                onChange={(e) => setConfig({ ...config, registrationOpen: e.target.checked })}
              />
              Registration Open
            </label>
          </div>
        </div>

        {message && (
          <div style={{
            padding: '12px',
            borderRadius: 'var(--radius-sm)',
            background: message.includes('✅') ? 'var(--green-bg)' : 'var(--red-bg)',
            color: message.includes('✅') ? 'var(--green)' : 'var(--red)',
            fontSize: '13px',
            textAlign: 'center',
          }}>
            {message}
          </div>
        )}

        <button
          className="btn btn-primary"
          onClick={saveConfig}
          disabled={saving}
        >
          {saving ? 'Saving...' : '💾 Save Settings'}
        </button>
      </div>
    </div>
  );
}