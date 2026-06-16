import { useState } from 'react';
import { useStore } from '../../lib/store';
import { formatTimeAgo } from '../../lib/utils';
import type { Gig } from '../../types';

interface GigCardProps {
  gig: Gig;
}

export default function GigCard({ gig }: GigCardProps) {
  const { user, acceptApplicant, rejectApplicant, openModal, setActiveTab, showToast, requestGig } = useStore();
  const [accepting, setAccepting] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  
  const isOwner = user?.id === gig.posterId;
  const isAcceptedWorker = user?.id === gig.acceptedApplicantId;
  const hasApplicants = gig.applicants && gig.applicants.length > 0;

  const handleAccept = async (applicantUserTag: string) => {
    setAccepting(applicantUserTag);
    try {
      await acceptApplicant(gig.id, applicantUserTag);
      setActiveTab('home');
      openModal('send');
    } finally {
      setAccepting(null);
    }
  };

  const handleReject = async (applicantUserTag: string) => {
    setRejecting(applicantUserTag);
    try {
      await rejectApplicant(gig.id, applicantUserTag);
    } finally {
      setRejecting(null);
    }
  };

  const handleRequestGig = async () => {
    try {
      await requestGig(gig.id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to request gig';
      showToast(message, 'error');
    }
  };

  let actionButton = null;
  
  // Show applicants list for owner
  if (isOwner && gig.status === 'requested' && hasApplicants) {
    return (
      <div className="gig-card">
        <div className="gig-top">
          <span className={`gig-badge ${gig.type === 'needed' ? 'needed' : 'offered'}`}>
            {gig.type === 'needed' ? 'NEEDED' : 'OFFERED'}
          </span>
          <div className="gig-reward">
            <div className="coin-b-small" />
            {gig.coinReward} BG
          </div>
        </div>
        <div className="gig-title">{gig.title}</div>
        {gig.description && (
          <p style={{ color: 'var(--text-meta)', fontSize: '13px', marginBottom: '8px', lineHeight: 1.4 }}>
            {gig.description}
          </p>
        )}
        <div className="gig-meta">
          <span>by {gig.posterUsername}</span>
          <span>{gig.category}</span>
          <span>{formatTimeAgo(gig.createdAt)}</span>
        </div>
        
        <div style={{ marginTop: '12px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
            Applicants ({gig.applicants.length}):
          </div>
          {gig.applicants.map((applicant) => (
            <div key={applicant.userId} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 0',
              borderBottom: '1px solid var(--border-default)',
            }}>
              <div>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{applicant.username}</span>
                <span style={{ color: 'var(--text-meta)', fontSize: '12px', marginLeft: '8px' }}>{applicant.userTag}</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleAccept(applicant.userTag)}
                  disabled={accepting === applicant.userTag}
                  style={{
                    padding: '4px 12px',
                    borderRadius: '20px',
                    background: 'var(--green-bg)',
                    border: '1px solid var(--green-border)',
                    color: 'var(--green)',
                    fontSize: '12px',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {accepting === applicant.userTag ? '...' : 'Accept'}
                </button>
                <button
                  onClick={() => handleReject(applicant.userTag)}
                  disabled={rejecting === applicant.userTag}
                  style={{
                    padding: '4px 12px',
                    borderRadius: '20px',
                    background: 'var(--red-bg)',
                    border: '1px solid var(--red-border)',
                    color: 'var(--red)',
                    fontSize: '12px',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {rejecting === applicant.userTag ? '...' : 'Reject'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  // Regular gig card for non-owners or no applicants
  if (isOwner && gig.status === 'open') {
    actionButton = (
      <div style={{ marginTop: '12px', padding: '10px', textAlign: 'center', fontSize: '13px', color: 'var(--text-meta)' }}>
        Waiting for requests...
      </div>
    );
  } else if (!isOwner && gig.status === 'open') {
    const alreadyApplied = gig.applicants?.some(a => a.userId === user?.id);
    actionButton = (
      <button
        className="gig-action"
        onClick={handleRequestGig}
        disabled={alreadyApplied}
        style={{ 
          borderColor: alreadyApplied ? 'var(--text-meta)' : 'var(--green)', 
          color: alreadyApplied ? 'var(--text-meta)' : 'var(--green)',
          opacity: alreadyApplied ? 0.6 : 1,
          cursor: alreadyApplied ? 'not-allowed' : 'pointer',
        }}
      >
        {alreadyApplied ? 'Request Sent' : 'Request to Work'}
      </button>
    );
  } else if (gig.status === 'accepted' && isOwner) {
    actionButton = (
      <button
        className="gig-action"
        onClick={() => {
          setActiveTab('home');
          openModal('send');
        }}
        style={{ borderColor: 'var(--green)', color: 'var(--green)' }}
      >
        Send Payment to {gig.acceptedApplicantUserTag}
      </button>
    );
  } else if (gig.status === 'accepted' && isAcceptedWorker) {
    actionButton = (
      <div style={{ marginTop: '12px', padding: '10px', textAlign: 'center', fontSize: '13px', color: 'var(--gold)' }}>
        Accepted! Waiting for payment...
      </div>
    );
  } else if (gig.status === 'completed') {
    actionButton = (
      <div style={{ marginTop: '12px', padding: '10px', textAlign: 'center', fontSize: '13px', color: 'var(--green)' }}>
        Completed
      </div>
    );
  }

  return (
    <div className="gig-card">
      <div className="gig-top">
        <span className={`gig-badge ${gig.type === 'needed' ? 'needed' : 'offered'}`}>
          {gig.type === 'needed' ? 'NEEDED' : 'OFFERED'}
        </span>
        <div className="gig-reward">
          <div className="coin-b-small" />
          {gig.coinReward} BG
        </div>
      </div>
      <div className="gig-title">{gig.title}</div>
      {gig.description && (
        <p style={{ color: 'var(--text-meta)', fontSize: '13px', marginBottom: '8px', lineHeight: 1.4 }}>
          {gig.description}
        </p>
      )}
      <div className="gig-meta">
        <span>by {gig.posterUsername}</span>
        <span>{gig.category}</span>
        <span>{formatTimeAgo(gig.createdAt)}</span>
      </div>
      {gig.status === 'requested' && !isOwner && (
        <div style={{ marginTop: '8px', padding: '8px 12px', background: 'var(--gold-bg)', borderRadius: 'var(--radius-sm)', fontSize: '12px', color: 'var(--gold)' }}>
          Request pending - poster will review
        </div>
      )}
      {actionButton}
    </div>
  );
}