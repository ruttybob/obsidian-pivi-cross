import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('settings navigation styles', () => {
  const styles = readFileSync(
    join(process.cwd(), 'packages/yapi-react/styles/settings/base.css'),
    'utf8',
  );

  it('resets the Obsidian 1.13 definition row before mounting the settings page', () => {
    expect(styles).toMatch(/:root \.yapi-settings-definition-host\.yapi-settings-definition-host\s*{[^}]*display:\s*block;[^}]*padding:\s*0;[^}]*border-top:\s*0;/s);
  });

  it('keeps primary tabs on one native horizontally scrollable row', () => {
    expect(styles).toMatch(/\.yapi-settings-tabs\s*{[^}]*overflow-x:\s*auto;/s);
    expect(styles).toMatch(/\.yapi-settings-tab\s*{[^}]*flex:\s*0 0 auto;[^}]*white-space:\s*nowrap;/s);
    expect(styles).toMatch(/\.yapi-settings-tab\s*{[^}]*appearance:\s*none;/s);
  });

  it('keeps Tools sections in a vertical document flow', () => {
    expect(styles).toMatch(/\.yapi-tools-settings-page\s*{[^}]*flex-direction:\s*column;/s);
    expect(styles).not.toContain('.yapi-tools-settings-section + .yapi-tools-settings-section');
  });

  it('uses quiet section labels on the shared gutter with asymmetric spacing', () => {
    expect(styles).toMatch(/\.yapi-settings\s*{[^}]*--yapi-settings-section-gap:/s);
    expect(styles).toMatch(/\.yapi-settings-section-heading\s*{[^}]*margin:\s*0;[^}]*padding-inline:\s*var\(--yapi-settings-gutter\);/s);
    expect(styles).toMatch(/\.yapi-settings-section-heading\s*{[^}]*font-size:\s*var\(--yapi-host-font-ui-small\);/s);
    expect(styles).toMatch(/\.yapi-settings-section-heading\s*{[^}]*color:\s*var\(--yapi-host-text-muted\);/s);
    expect(styles).toMatch(/\.yapi-settings-section\s*{[^}]*margin-block-start:\s*var\(--yapi-settings-section-gap\);/s);
    expect(styles).toMatch(/\.yapi-settings-section > \.yapi-settings-section-heading\s*{[^}]*margin-block-end:\s*var\(--yapi-settings-section-title-gap\);/s);
    expect(styles).not.toContain('.yapi-settings-list-header__title');
    expect(styles).not.toContain('.yapi-tools-settings-section__title');
  });

  it('groups sections with whitespace and keeps integration item titles quiet', () => {
    expect(styles).not.toMatch(/\.yapi-settings-section-heading\s*{[^}]*border-top:/s);
    expect(styles).toMatch(/\.yapi-integration-setting \.yapi-setting-row__name\s*{[^}]*font-size:\s*var\(--yapi-host-font-ui-small\);[^}]*font-weight:\s*var\(--yapi-host-font-medium\);/s);
    expect(styles.match(/\.yapi-integration-setting \.yapi-setting-row__name\s*{/g)).toHaveLength(1);
    expect(styles).toMatch(/\.yapi-settings-list-header\s*{[^}]*padding-inline:\s*var\(--yapi-settings-gutter\);/s);
  });
});
