import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('response metadata styles', () => {
  it('shares duration typography with the live agent status', () => {
    const styles = readFileSync(
      join(process.cwd(), 'packages/yapi-react/styles/components/messages.css'),
      'utf8',
    );

    expect(styles).toMatch(/\.yapi-response-meta\s*\{[\s\S]*?font-family:\s*inherit;/);
    expect(styles).toMatch(/\.yapi-response-meta\s*\{[\s\S]*?font-size:\s*var\(--yapi-text-sm\);/);
    expect(styles).toMatch(/\.yapi-response-meta\s*\{[\s\S]*?font-weight:\s*500;/);
    expect(styles).toMatch(/\.yapi-response-meta\s*\{[\s\S]*?font-style:\s*italic;/);
  });

  it('aligns the live agent status with assistant message content', () => {
    const styles = readFileSync(
      join(process.cwd(), 'packages/yapi-react/styles/components/thinking.css'),
      'utf8',
    );

    expect(styles).toMatch(/\.yapi-thinking\s*\{[\s\S]*?padding-inline:\s*14px;/);
  });
});
