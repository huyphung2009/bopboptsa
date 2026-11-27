import React, { useEffect, useRef, useState } from 'react';

// In-memory set per page load: plays once per session unless the browser page is reloaded.
const playedTexts = new Set<string>();

interface MistTyperProps {
  text: string;
  baseDelay?: number;
  jitter?: number;
  startDelay?: number;
  startOnVisible?: boolean;
  className?: string;
}

export const MistTyper: React.FC<MistTyperProps> = ({
  text,
  baseDelay = 40,
  jitter = 20,
  startDelay = 180,
  startOnVisible = false,
  className = '',
}) => {
  const [typedLength, setTypedLength] = useState(() =>
    playedTexts.has(text) ? text.length : 0
  );
  const [phase, setPhase] = useState<'idle' | 'typing' | 'done'>(() =>
    playedTexts.has(text) ? 'done' : 'idle'
  );
  const containerRef = useRef<HTMLSpanElement | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const clearTimer = () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    if (playedTexts.has(text)) {
      timerRef.current = window.setTimeout(() => {
        setTypedLength(text.length);
        setPhase('done');
      }, 0);
      return clearTimer;
    }

    let started = false;

    const startTyping = () => {
      if (started) return;
      started = true;

      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReduced) {
        playedTexts.add(text);
        timerRef.current = window.setTimeout(() => {
          setTypedLength(text.length);
          setPhase('done');
        }, 0);
        return;
      }

      let idx = 0;

      const step = () => {
        if (idx >= text.length) {
          playedTexts.add(text);
          setPhase('done');
          return;
        }
        const ch = text[idx];
        idx += 1;
        setTypedLength(idx);

        let delay = baseDelay + (Math.random() * 2 - 1) * jitter;
        if (ch === ' ') delay += 10;
        if ('.!?'.includes(ch)) delay += 160;
        else if (',;:·'.includes(ch)) delay += 80;

        timerRef.current = window.setTimeout(step, Math.max(10, delay));
      };

      timerRef.current = window.setTimeout(() => {
        setTypedLength(0);
        setPhase('typing');
        step();
      }, startDelay);
    };

    if (!startOnVisible) {
      startTyping();
      return clearTimer;
    }

    const node = containerRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          startTyping();
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
      clearTimer();
    };
  }, [text, baseDelay, jitter, startDelay, startOnVisible]);

  const visibleText = text.slice(0, typedLength);

  return (
    <span ref={containerRef} className={`type-wrap ${className}`}>
      <span className="type-ghost">{text}</span>
      <span className="type-live" aria-hidden="true">
        {visibleText}
        <span
          className={`mist-cursor ${
            phase === 'typing' ? 'is-typing' : phase === 'done' ? 'is-breathing' : ''
          }`}
        />
      </span>
    </span>
  );
};
