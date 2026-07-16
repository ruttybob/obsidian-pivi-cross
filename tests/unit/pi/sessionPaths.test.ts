import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import {
  encodeSessionCwd,
  getYapiSessionDir,
  toAbsoluteSessionPath,
  toVaultRelativePath,
} from '@yapi/yapi-agent-core/session/sessionPaths';

describe('sessionPaths', () => {
  it('encodes absolute vault paths for pi-compatible session directories', () => {
    const encoded = encodeSessionCwd('/Users/example/Vault:Main');

    expect(encoded).toBe('--Users-example-Vault-Main--');
  });

  it('computes the vault-local session directory without creating it', () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'yapi-session-paths-'));
    const vaultPath = path.join(tempRoot, 'Vault');

    const sessionDir = getYapiSessionDir(vaultPath);

    expect(sessionDir).toBe(
      path.join(vaultPath, '.yapi', 'sessions', encodeSessionCwd(vaultPath)),
    );
    expect(fs.existsSync(sessionDir)).toBe(false);

    fs.rmSync(tempRoot, { recursive: true, force: true });
  });

  it('converts an absolute session file under the vault to a forward-slash relative path', () => {
    const vaultPath = path.join('/tmp', 'vault');
    const absoluteSession = path.join(vaultPath, '.yapi', 'sessions', 'session.jsonl');

    expect(toVaultRelativePath(vaultPath, absoluteSession)).toBe(
      '.yapi/sessions/session.jsonl',
    );
  });

  it('resolves forward-slash vault-relative session files to absolute paths', () => {
    const vaultPath = path.join('/tmp', 'vault');

    expect(toAbsoluteSessionPath(vaultPath, '.yapi/sessions/session.jsonl')).toBe(
      path.join(vaultPath, '.yapi', 'sessions', 'session.jsonl'),
    );
  });
});
