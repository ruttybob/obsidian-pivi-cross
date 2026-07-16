import { useEffect, useRef } from 'react';

import type { WelcomeQuoteAdapter } from '../types';

export function WelcomeSurface({ greeting, quoteAdapter }: {
  greeting: string | null;
  quoteAdapter?: WelcomeQuoteAdapter;
}) {
  const quoteRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const quoteContainer = quoteRef.current;
    return quoteContainer && quoteAdapter ? quoteAdapter.mount(quoteContainer) : undefined;
  }, [greeting, quoteAdapter]);

  if (!greeting) return null;
  return (
    <div className="yapi-welcome">
      <div className="yapi-welcome-quote-adapter" ref={quoteRef} />
      <div className="yapi-welcome-greeting">{greeting}</div>
    </div>
  );
}
