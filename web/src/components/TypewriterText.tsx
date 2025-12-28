import { useEffect, useMemo, useState } from "react";

type Props = {
  text: string;
  /** delay before starting (ms) */
  delayMs?: number;
  /** ms per character */
  speedMs?: number;
  className?: string;
  /** show blinking caret while typing */
  cursor?: boolean;
  onDone?: () => void;
};

/**
 * Typewriter-style reveal ("manuscrito") for headings.
 * Uses Array.from(...) to avoid breaking emojis/surrogates.
 */
export function TypewriterText({
  text,
  delayMs = 0,
  speedMs = 26,
  className,
  cursor = true,
  onDone,
}: Props) {
  const chars = useMemo(() => Array.from(text), [text]);
  const [i, setI] = useState(0);
  const [started, setStarted] = useState(delayMs === 0);

  useEffect(() => {
    if (delayMs === 0) return;
    const t = window.setTimeout(() => setStarted(true), delayMs);
    return () => window.clearTimeout(t);
  }, [delayMs]);

  useEffect(() => {
    if (!started) return;
    if (i >= chars.length) return;

    const t = window.setTimeout(() => setI((v) => Math.min(v + 1, chars.length)), speedMs);
    return () => window.clearTimeout(t);
  }, [started, i, chars.length, speedMs]);

  useEffect(() => {
    if (!started) return;
    if (i !== chars.length) return;
    onDone?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i, started]);

  const value = started ? chars.slice(0, i).join("") : "";
  const showCaret = cursor && started && i < chars.length;

  return (
    <span className={className} aria-label={text}>
      {value}
      {showCaret ? <span className="tw-caret">▍</span> : null}
    </span>
  );
}
