let measurementSequence = 0;

export async function measureStartupPhase<T>(
  phase: 'settings' | 'workspace',
  action: () => Promise<T>,
): Promise<T> {
  const performanceApi = window.performance;
  if (!performanceApi?.mark || !performanceApi.measure) return action();

  const sequence = measurementSequence++;
  const start = `yapi:startup:${phase}:${sequence}:start`;
  const end = `yapi:startup:${phase}:${sequence}:end`;
  performanceApi.mark(start);
  try {
    return await action();
  } finally {
    performanceApi.mark(end);
    performanceApi.measure(`yapi:startup:${phase}`, start, end);
    performanceApi.clearMarks(start);
    performanceApi.clearMarks(end);
  }
}
