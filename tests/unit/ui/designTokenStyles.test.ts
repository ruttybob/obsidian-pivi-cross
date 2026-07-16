import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const stylesRoot = join(process.cwd(), 'packages/yapi-react/styles');

describe('product design tokens', () => {
  const variables = readFileSync(join(stylesRoot, 'base/variables.css'), 'utf8');
  const accessibility = readFileSync(join(stylesRoot, 'accessibility.css'), 'utf8');
  const primitives = readFileSync(join(stylesRoot, 'base/presentation-primitives.css'), 'utf8');
  const modelSelector = readFileSync(join(stylesRoot, 'toolbar/model-selector.css'), 'utf8');
  const thinkingSelector = readFileSync(join(stylesRoot, 'toolbar/thinking-selector.css'), 'utf8');

  it('defines shared tokens on every presentation root', () => {
    expect(variables).toMatch(/\.yapi-container,\s*\.yapi-settings,\s*\.yapi-inline-edit-modal\s*\{/);
    for (const token of [
      '--yapi-radius-xs',
      '--yapi-shadow-popover-up-md',
      '--yapi-material-blur-lg',
      '--yapi-ease-out',
      '--yapi-duration-fast',
      '--yapi-surface-subtle',
      '--yapi-text-chat-body',
      '--yapi-text-composer',
      '--yapi-focus-ring',
      '--yapi-press-scale',
    ]) {
      expect(variables).toContain(`${token}:`);
    }
    expect(variables).toContain('--yapi-text-chat-body: var(--yapi-chat-font-size');
    expect(variables).toContain('--yapi-text-composer: var(--yapi-composer-font-size');
  });

  it('keeps focus rings independent from component geometry', () => {
    expect(accessibility).toContain('.yapi-settings-action-btn:focus-visible');
    expect(accessibility).toContain('.yapi-skill-choice:focus-within');
    expect(accessibility).not.toMatch(/focus-visible[^}]*border-radius:/s);
    expect(primitives).toContain('.yapi-toggle:focus-within');
    expect(primitives).not.toContain(':has(');
    expect(accessibility).not.toContain(':has(');
  });

  it('uses the same press targets in default and reduced-motion rules', () => {
    for (const selector of [
      '.yapi-model-btn:active:not(:disabled)',
      '.yapi-thinking-current:active:not(:disabled)',
      '.yapi-external-context-btn:active:not(:disabled)',
      '.yapi-mode-selector:active:not(:disabled)',
      '.yapi-tab-switcher-item:active:not([aria-disabled=\'true\'])',
      '.yapi-slash-item:active:not([aria-disabled=\'true\'])',
      '.yapi-settings-action-btn:active:not(:disabled)',
      '.yapi-settings-text-btn:active:not(:disabled)',
      '.yapi-provider-header:active',
      '.yapi-hotkey-item:active:not(:disabled)',
      '.yapi-skill-choice:active',
      '.yapi-send-button:active:not(:disabled)',
      '.yapi-toggle:not(.yapi-toggle--disabled):active',
    ]) {
      expect(primitives).toContain(selector);
      expect(accessibility).toContain(selector);
    }
  });

  it('blends selected model and thinking options into the menu until interaction', () => {
    expect(modelSelector).toMatch(/\.yapi-model-dropdown \.yapi-model-option\s*\{[^}]*background:\s*transparent;/s);
    expect(thinkingSelector).toMatch(/\.yapi-thinking-options \.yapi-thinking-gear\s*\{[^}]*background:\s*transparent;/s);
    expect(modelSelector).toMatch(/\.yapi-model-option\.selected\s*\{[^}]*background:\s*transparent;/s);
    expect(thinkingSelector).toMatch(/\.yapi-thinking-gear\.selected\s*\{[^}]*background:\s*transparent;/s);
    expect(modelSelector).toMatch(/\.yapi-model-option:hover\s*\{[^}]*background:\s*var\(--yapi-host-background-hover\);/s);
    expect(thinkingSelector).toMatch(/\.yapi-thinking-gear:hover\s*\{[^}]*background:\s*var\(--yapi-host-background-hover\);/s);
  });
});
