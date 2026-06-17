import { useState } from 'react';
import { useStore } from '../../lib/store';
import { formatTimeAgo } from '../../lib/utils';
import type { Transaction } from '../../types';
import Skeleton from '../ui/Skeleton';

function getTransactionDisplay(tx: Transaction, userId: string) {
  const isSender = tx.senderId === userId;
  const isSystem = tx.type === 'bonus' || tx.type === 'gig_reward';

  let iconClass = 'system';
  let amountClass = 'system';
  let prefix = '+';
  let iconSymbol = 'B';
  let label = tx.note || 'Transaction';
  let name = 'BitGen';

  if (isSystem) {
    iconClass = 'system';
    amountClass = 'system';
    prefix = '+';
    iconSymbol = 'B';
    name = 'BitGen System';
    label = tx.note;
  } else if (isSender) {
    iconClass = 'sent';
    amountClass = 'sent';
    prefix = '-';
    iconSymbol = 'S';
    name = tx.recipientUsername || 'Unknown';
    label = tx.note || 'Sent';
  } else {
    iconClass = 'received';
    amountClass = 'received';
    prefix = '+';
    iconSymbol = 'R';
    name = tx.senderUsername || 'Unknown';
    label = tx.note || 'Received';
  }

  return { iconClass, amountClass, prefix, iconSymbol, label, name };
}

export default function ActivityFeed() {
  const { transactions, user } = useStore();
  const [visibleCount, setVisibleCount] = useState(5);

  if (!user) {
    return (
      <div>
        <div className="section-header">
          <Skeleton width="120px" height="17px" />
        </div>
        <div className="tx-list">
          {[1, 2, 3].map((i) => (
            <div key={i} className="tx-item">
              <Skeleton width="42px" height="42px" borderRadius="50%" />
              <div style={{ flex: 1 }}>
                <Skeleton width="80px" height="14px" />
                <Skeleton width="120px" height="12px" className="mt-1" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const myTransactions = transactions.filter(
    (tx) => tx.senderId === user.id || tx.recipientId === user.id
  );

  const visibleTransactions = myTransactions.slice(0, visibleCount);
  const hasMore = myTransactions.length > visibleCount;

  return (
    <div>
      <div className="section-header">
        <h2 className="section-title">Recent Activity</h2>
        {myTransactions.length > 5 && (
          <button className="section-link">View all</button>
        )}
      </div>
      <div className="tx-list">
        {myTransactions.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '32px 16px',
            color: 'var(--text-muted)',
            fontSize: '14px',
          }}>
            No transactions yet. Send or receive coins to get started.
          </div>
        ) : (
          <>
            {visibleTransactions.map((tx) => {
              const display = getTransactionDisplay(tx, user.id);
              return (
                <div key={tx.id} className="tx-item">
                  <div className={`tx-icon ${display.iconClass}`}>
                    {display.iconSymbol}
                  </div>
                  <div className="tx-info">
                    <div className="tx-username">{display.name}</div>
                    <div className="tx-type">{display.label}</div>
                  </div>
                  <div className="tx-right">
                    <div className={`tx-amount ${display.amountClass}`}>
                      {display.prefix}{tx.amount} BG
                    </div>
                    <div className="tx-time">{formatTimeAgo(tx.createdAt)}</div>
                  </div>
                </div>
              );
            })}
            
            {hasMore && (
              <button
                onClick={() => setVisibleCount(prev => prev + 5)}
                style={{
                  padding: '10px',
                  background: 'var(--bg-hover)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-meta)',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: '13px',
                  width: '100%',
                  transition: '0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--green-border)';
                  e.currentTarget.style.color = 'var(--green)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-default)';
                  e.currentTarget.style.color = 'var(--text-meta)';
                }}
              >
                Load More ({myTransactions.length - visibleCount} remaining)
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}