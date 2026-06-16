import { useEffect, useState } from 'react';

interface CoinAnimProps {
  show: boolean;
  onComplete?: () => void;
}

export default function CoinAnimation({ show, onComplete }: CoinAnimProps) {
  const [particles, setParticles] = useState<{ id: number; x: number; delay: number }[]>([]);

  useEffect(() => {
    if (show) {
      const newParticles = Array.from({ length: 6 }, (_, i) => ({
        id: i,
        x: Math.random() * 200 - 100,
        delay: Math.random() * 0.3,
      }));
      setParticles(newParticles);

      const timer = setTimeout(() => {
        setParticles([]);
        onComplete?.();
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!show || particles.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 300,
      pointerEvents: 'none',
    }}>
      {particles.map((p) => (
        <div
          key={p.id}
          className="coin-animation"
          style={{
            position: 'absolute',
            left: `${p.x}px`,
            animationDelay: `${p.delay}s`,
          }}
        >
          <div className="coin-b-small" />
        </div>
      ))}
    </div>
  );
}
