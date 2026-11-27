import React, { useEffect, useState } from 'react';
import styles from './LoadingScreen.module.css';

interface LoadingScreenProps {
  delayMs?: number;
  fadeMs?: number;
  onComplete?: () => void;
}

const LETTERS = ['P', 'A', 'R', 'A', 'B', 'O', 'L'];

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  delayMs = 1700,
  fadeMs = 400,
  onComplete,
}) => {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const fadeTimer = window.setTimeout(() => {
      setFading(true);
    }, delayMs);

    const doneTimer = window.setTimeout(() => {
      onComplete?.();
    }, delayMs + fadeMs);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(doneTimer);
    };
  }, [delayMs, fadeMs, onComplete]);

  return (
    <div
      className={`${styles.overlay} ${fading ? styles.fading : ''}`}
      role="status"
      aria-label="Đang tải Parabol"
    >
      <div className={styles.wrapperGrid}>
        {LETTERS.map((letter, idx) => (
          <div key={`${letter}-${idx}`} className={styles.cube}>
            <div className={`${styles.face} ${styles.faceFront}`}>{letter}</div>
            <div className={`${styles.face} ${styles.faceBack}`} />
            <div className={`${styles.face} ${styles.faceRight}`} />
            <div className={`${styles.face} ${styles.faceLeft}`} />
            <div className={`${styles.face} ${styles.faceTop}`} />
            <div className={`${styles.face} ${styles.faceBottom}`} />
          </div>
        ))}
      </div>
    </div>
  );
};
