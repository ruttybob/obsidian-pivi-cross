import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('tool step group styles', () => {
  it('keeps generic tool shells free of a border and background surface', () => {
    const styles = readFileSync(
      join(process.cwd(), 'packages/yapi-react/styles/components/toolcalls.css'),
      'utf8',
    );
    const toolShell = styles.match(/\.yapi-tool-call\s*\{([^}]*)\}/)?.[1] ?? '';

    expect(toolShell).toContain('margin: 4px 0');
    expect(toolShell).not.toMatch(/border(?:-inline-start|-radius)?\s*:/);
    expect(toolShell).not.toMatch(/background\s*:/);
    expect(toolShell).not.toMatch(/overflow\s*:/);
  });

  it('does not prepend a decorative list dot to the step summary', () => {
    const styles = readFileSync(
      join(process.cwd(), 'packages/yapi-react/styles/components/toolcalls.css'),
      'utf8',
    );

    expect(styles).not.toMatch(/\.yapi-tool-step-group-header::before\s*\{/);
  });

  it('shares a one-line flex header contract with imperative subagent rows', () => {
    const styles = readFileSync(
      join(process.cwd(), 'packages/yapi-react/styles/components/toolcalls.css'),
      'utf8',
    );

    expect(styles).toMatch(/\.yapi-container \.yapi-tool-step-group-header,\s*\n\.yapi-container \.yapi-tool-header\s*\{/);
    expect(styles).toMatch(/\.yapi-container \.yapi-tool-step-group-header,[\s\S]*?display:\s*flex;/);
    expect(styles).toMatch(/\.yapi-container \.yapi-tool-step-group-header,[\s\S]*?flex-wrap:\s*nowrap;/);
    expect(styles).not.toContain('.yapi-container button.yapi-tool-header');
  });

  it('keeps subagent steps unboxed, contiguous, and width-adaptive', () => {
    const styles = readFileSync(
      join(process.cwd(), 'packages/yapi-react/styles/components/subagent.css'),
      'utf8',
    );

    expect(styles).toContain('container: yapi-subagent-content / inline-size');
    expect(styles).toContain('.yapi-subagent-tools>.yapi-tool-step-group');
    expect(styles).toContain('.yapi-subagent-tools .yapi-tool-call-in-step-group');
    expect(styles).toContain('.yapi-subagent-tools .yapi-tool-step-group-steps:not(.yapi-hidden)');
    expect(styles).not.toMatch(/\.yapi-subagent-tools \.yapi-tool-step-group-steps\s*\{[^}]*display:\s*flex;/);
    expect(styles).toMatch(/\.yapi-subagent-tools \.yapi-tool-step-group-steps:not\(\.yapi-hidden\)\s*\{[^}]*gap:\s*0;/s);
    expect(styles).toMatch(/\.yapi-subagent-tools \.yapi-tool-step-group-steps:not\(\.yapi-hidden\)\s*\{[^}]*padding-block:\s*0 4px;/s);
    expect(styles).not.toMatch(/\.yapi-subagent-tools>\.yapi-tool-step-group\s*\{[^}]*(?:border|background|padding):/s);
    expect(styles).not.toMatch(/\.yapi-subagent-tools \.yapi-tool-call-in-step-group\s*\{[^}]*(?:border|background):/s);
    expect(styles).toMatch(/\.yapi-subagent-tools \.yapi-tool-call-in-step-group\s*\{[^}]*margin:\s*0;/s);
    expect(styles).toContain('@container yapi-subagent-content (max-width: 320px)');
    expect(styles).toContain('@container yapi-subagent-content (max-width: 240px)');
  });

  it('caps each top-level disclosure while its body owns the only scrollbar', () => {
    const styles = readFileSync(
      join(process.cwd(), 'packages/yapi-react/styles/components/toolcalls.css'),
      'utf8',
    );

    expect(styles).toMatch(/\.yapi-tool-step-group\.expanded,[\s\S]*?\.yapi-tool-call\.expanded\s*\{[^}]*max-height:\s*var\(--yapi-expanded-content-max-height/s);
    expect(styles).toMatch(/\.yapi-tool-step-group\.expanded,[\s\S]*?\.yapi-tool-call\.expanded\s*\{[^}]*display:\s*flex;/s);
    expect(styles).toMatch(/\.yapi-tool-step-group\.expanded,[\s\S]*?\.yapi-tool-call\.expanded\s*\{[^}]*overflow:\s*hidden;/s);
    expect(styles).toMatch(/\.yapi-tool-step-group\.expanded > \.yapi-tool-step-group-steps,[\s\S]*?\.yapi-tool-call\.expanded > \.yapi-tool-content\s*\{[^}]*overflow-y:\s*auto;/s);
    expect(styles).not.toMatch(/overscroll-behavior-y:\s*contain;/);
    expect(styles).toMatch(/\.yapi-subagent-content \.yapi-tool-step-group\.expanded,[\s\S]*?\.yapi-tool-step-group-steps \.yapi-tool-call\.expanded\s*\{[^}]*max-height:\s*none;/s);
    expect(styles).toMatch(/\.yapi-tool-step-group-steps \.yapi-tool-call\.expanded > \.yapi-tool-content\s*\{[^}]*overflow:\s*visible;/s);
  });

  it('keeps top-level card headers layout-fixed and nests sticky titles inside the body scrollport', () => {
    const styles = readFileSync(
      join(process.cwd(), 'packages/yapi-react/styles/components/toolcalls.css'),
      'utf8',
    );

    expect(styles).toMatch(/\.yapi-tool-step-group\.expanded > \.yapi-tool-step-group-header\s*\{[^}]*flex:\s*0 0 auto;/s);
    expect(styles).not.toMatch(/(?:^|[\n\r])\s*\.yapi-tool-step-group\.expanded > \.yapi-tool-step-group-header\s*\{[^}]*position:\s*sticky;/s);
    expect(styles).toMatch(/\.yapi-tool-call\.expanded:not\(\.yapi-tool-call-in-step-group\) > \.yapi-tool-header\s*\{[^}]*flex:\s*0 0 auto;/s);
    expect(styles).not.toMatch(/(?:^|[\n\r])\s*\.yapi-tool-call\.expanded:not\(\.yapi-tool-call-in-step-group\) > \.yapi-tool-header\s*\{[^}]*position:\s*sticky;/s);
    expect(styles).toMatch(/\.yapi-tool-step-group-steps\s*\{[^}]*padding-block:\s*0 4px;/s);
    expect(styles).toMatch(/\.yapi-tool-step-item\s*\{[^}]*margin-block:\s*0;/s);
    expect(styles).toMatch(/\.yapi-subagent-content \.yapi-tool-step-group\.expanded > \.yapi-tool-step-group-header\s*\{[^}]*position:\s*sticky;/s);
    expect(styles).toMatch(/\.yapi-subagent-content \.yapi-tool-step-group\.expanded > \.yapi-tool-step-group-header\s*\{[^}]*top:\s*0;/s);
    expect(styles).toMatch(/\.yapi-tool-step-group\.expanded[\s\S]*?> \.yapi-tool-call\.expanded[\s\S]*?> \.yapi-tool-header\s*\{[^}]*top:\s*0;/s);
    expect(styles).toMatch(/\.yapi-subagent-content \.yapi-tool-step-group\.expanded[\s\S]*?> \.yapi-tool-call\.expanded[\s\S]*?> \.yapi-tool-header\s*\{[^}]*top:\s*var\(--yapi-tool-step-group-sticky-top, 18px\);/s);
    expect(styles).toMatch(/\.yapi-subagent-content \.yapi-tool-call\.expanded:not\(\.yapi-tool-call-in-step-group\) > \.yapi-tool-header\s*\{[^}]*top:\s*0;/s);
    expect(styles).toMatch(/\.yapi-subagent-content \.yapi-tool-step-group\.expanded > \.yapi-tool-step-group-steps\s*\{[^}]*overflow:\s*visible;/s);
  });

  it('keeps expanded card height fixed without a shrink-to-title chain', () => {
    const styles = readFileSync(
      join(process.cwd(), 'packages/yapi-react/styles/components/toolcalls.css'),
      'utf8',
    );

    expect(styles).not.toContain('yapi-disclosure-chain-active');
    expect(styles).not.toContain('--yapi-disclosure-chain-max-height');
  });

  it('restores subagent motion only for the canonical running lifecycle class', () => {
    const animationStyles = readFileSync(
      join(process.cwd(), 'packages/yapi-react/styles/base/animations.css'),
      'utf8',
    );
    const accessibilityStyles = readFileSync(
      join(process.cwd(), 'packages/yapi-react/styles/accessibility.css'),
      'utf8',
    );

    expect(animationStyles).toContain('@keyframes yapi-working-icon-spin');
    expect(animationStyles).toMatch(/\.yapi-working-icon-arc\s*\{[^}]*animation:\s*yapi-working-icon-spin/s);
    expect(animationStyles).toContain('@keyframes yapi-running-header-flow');
    expect(animationStyles).toContain('@keyframes yapi-subagent-icon-stroke-draw');
    expect(animationStyles).toContain('@keyframes yapi-subagent-icon-sway');
    expect(animationStyles).toContain('@keyframes yapi-subagent-heart-pulse');
    expect(animationStyles).toMatch(/\.yapi-subagent-list\.running>\.yapi-subagent-header::after\s*\{[^}]*animation:\s*yapi-running-header-flow/s);
    expect(animationStyles).not.toContain('.yapi-subagent-list:is(.is-running, .pending, .running)');
    expect(animationStyles).not.toContain('.yapi-subagent-list.queued>.yapi-subagent-header::after');
    expect(animationStyles).not.toContain('.yapi-subagent-list.waiting>.yapi-subagent-header::after');
    expect(accessibilityStyles).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.yapi-subagent-running-icon \.yapi-subagent-icon-stroke,[\s\S]*?\.yapi-subagent-header::after,[\s\S]*?animation:\s*none;/);
  });
});
