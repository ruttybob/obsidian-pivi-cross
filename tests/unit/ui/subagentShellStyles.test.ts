import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('subagent shell styles', () => {
  const styles = readFileSync(
    join(process.cwd(), 'packages/yapi-react/styles/components/subagent.css'),
    'utf8',
  );

  it('uses a uniform shell border without an inline branch line', () => {
    expect(styles).not.toContain('border-inline-start');
    expect(styles).not.toContain('.yapi-subagent-progress');
    expect(styles).not.toContain('.yapi-subagent-indicator-dot');
  });

  it('keeps the header and icon geometry stable while toggling', () => {
    expect(styles).toMatch(/\.yapi-subagent-header\s*\{[^}]*min-height:\s*0;/s);
    expect(styles).toMatch(/\.yapi-subagent-header\s*\{[^}]*height:\s*auto;/s);
    expect(styles).toMatch(/\.yapi-subagent-header\s*\{[^}]*padding:\s*3px 8px 3px 4px;/s);
    expect(styles).not.toMatch(/\.yapi-subagent-card:not\(\.expanded\) \.yapi-subagent-header/);
    expect(styles).toMatch(/\.yapi-subagent-icon\s*\{[^}]*width:\s*16px;/s);
    expect(styles).toMatch(/\.yapi-subagent-icon\s*\{[^}]*height:\s*16px;/s);
    expect(styles).toMatch(/\.yapi-subagent-icon\s*\{[^}]*flex:\s*0 0 16px;/s);
  });

  it('keeps the subagent name stable and gives the brief description the remaining width', () => {
    expect(styles).toMatch(/\.yapi-subagent-label\s*\{[^}]*flex:\s*0 0 auto;/s);
    expect(styles).toMatch(/\.yapi-subagent-label\s*\{[^}]*font-size:\s*var\(--yapi-text-base\);/s);
    expect(styles).toMatch(/\.yapi-subagent-label\s*\{[^}]*line-height:\s*1\.2;/s);
    expect(styles).toMatch(/\.yapi-subagent-step-summary\s*\{[^}]*flex:\s*1;/s);
    expect(styles).toMatch(/\.yapi-subagent-step-summary\s*\{[^}]*font-size:\s*var\(--yapi-text-base\);/s);
    expect(styles).toMatch(/\.yapi-subagent-step-summary\s*\{[^}]*line-height:\s*1\.2;/s);
    expect(styles).toMatch(/\.yapi-subagent-step-summary\s*\{[^}]*text-overflow:\s*ellipsis;/s);
    expect(styles).not.toMatch(/\.yapi-subagent-card:not\(\.expanded\) \.yapi-subagent-label/);
  });

  it('uses the shared small shell radius while collapsed and expanded', () => {
    expect(styles).toMatch(/\.yapi-subagent-card\s*\{[^}]*border-radius:\s*var\(--yapi-radius-sm\);/s);
    expect(styles).not.toMatch(/\.yapi-subagent-card:not\(\.expanded\)\s*\{[^}]*border-radius:/s);
    expect(styles).not.toMatch(/\.yapi-subagent-card\.expanded\s*\{[^}]*border-radius:/s);
  });

  it('caps the shell while its body owns the only scrollbar', () => {
    expect(styles).toMatch(/\.yapi-subagent-list\.expanded\s*\{[^}]*max-height:\s*var\(--yapi-subagent-expanded-max-height, min\(640px, 66vh\)\);/s);
    expect(styles).toMatch(/\.yapi-subagent-list\.expanded\s*\{[^}]*display:\s*flex;/s);
    expect(styles).not.toMatch(/\.yapi-subagent-content\s*\{[^}]*max-height:/s);
    expect(styles).toMatch(/\.yapi-subagent-list\.expanded > \.yapi-subagent-content\s*\{[^}]*overflow-y:\s*auto;/s);
    expect(styles).not.toMatch(/overscroll-behavior-y:\s*contain;/);
    expect(styles).not.toMatch(/\.yapi-subagent-content\s*\{[^}]*resize:/s);
    expect(styles).not.toContain('58vh');
  });

  it('publishes zero top padding on the subagent scroll body for a gapless sticky stack', () => {
    expect(styles).toMatch(/\.yapi-subagent-content\s*\{[^}]*padding-block:\s*0 8px;/s);
    expect(styles).not.toContain('--yapi-subagent-content-padding-top');
    expect(styles).toMatch(/\.yapi-subagent-content > :first-child\s*\{[^}]*margin-block-start:\s*6px;/s);
  });

  it('keeps the subagent header layout-fixed at the card top', () => {
    expect(styles).toMatch(/\.yapi-subagent-list\.expanded\s*\{[^}]*overflow:\s*hidden;/s);
    expect(styles).toMatch(/\.yapi-subagent-list\.expanded > \.yapi-subagent-header\s*\{[^}]*flex:\s*0 0 auto;/s);
    expect(styles).not.toMatch(/\.yapi-subagent-list\.expanded > \.yapi-subagent-header\s*\{[^}]*position:\s*sticky;/s);
    expect(styles).toMatch(/\.yapi-subagent-list\.expanded > \.yapi-subagent-header\s*\{[^}]*z-index:\s*9;/s);
  });
});
