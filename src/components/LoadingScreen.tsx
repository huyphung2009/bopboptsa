import React, { useEffect, useState } from 'react';
import styles from './LoadingScreen.module.css';

interface LoadingScreenProps {
  delayMs?: number;
  fadeMs?: number;
}

const LETTERS = ['T', 'S', 'A'];

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  delayMs = 1700,
  fadeMs = 450,
}) => {
  const [fading, setFading] = useState(false);
  const [unmounted, setUnmounted] = useState(false);

  useEffect(() => {
    const fadeTimer = window.setTimeout(() => {
      setFading(true);
    }, delayMs);

    const unmountTimer = window.setTimeout(() => {
      setUnmounted(true);
    }, delayMs + fadeMs);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(unmountTimer);
    };
  }, [delayMs, fadeMs]);

  if (unmounted) return null;

  return (
    <div
      className={`${styles.overlay} ${fading ? styles.fading : ''}`}
      role="status"
      aria-label="Đang tải Parabol"
    >
      <div className={styles.wrapperGrid}>
        {LETTERS.map((letter) => (
          <div key={letter} className={styles.cube}>
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
