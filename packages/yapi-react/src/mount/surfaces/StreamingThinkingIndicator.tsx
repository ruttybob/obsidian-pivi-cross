import type { ChatUiSnapshot } from '../../store';

export function StreamingThinkingIndicator({
  indicator,
}: {
  indicator: ChatUiSnapshot['thinkingIndicator'];
}) {
  if (!indicator) return null;
  return (
    <div className={`${indicator.className} yapi-response-meta`}>
      <span>{indicator.text}</span>
      <span className="yapi-thinking-hint">{indicator.elapsedLabel}</span>
    </div>
  );
}
