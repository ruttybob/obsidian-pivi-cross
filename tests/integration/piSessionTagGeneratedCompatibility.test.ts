import { spawnSync } from 'node:child_process';

describe('Yapi 0.7.0 tag-generated session compatibility', () => {
  it('migrates device-local paths and hydrates the frozen writer output idempotently', () => {
    const script = String.raw`
      import { createHash } from 'node:crypto';
      import fs from 'node:fs';
      import os from 'node:os';
      import path from 'node:path';
      import { PiSessionStore } from '@yapi/yapi-agent-core/engine/pi/session/piSessionStore';
      import { readSessionJsonlIndex } from '@yapi/yapi-agent-core/engine/pi/session/sessionJsonlIndex';
      import { OpenSessionManager } from '@yapi/yapi-agent-core/session/openSessionManager';
      import { getYapiSessionDir, toVaultRelativePath } from '@yapi/yapi-agent-core/session/sessionPaths';

      const fixtureSha256 = 'd51b60c088b5a96922db38f4cf78c4e81c6e1d0343b278121ba78585d5b25955';
      const source = path.join(
        process.cwd(),
        'tests',
        'fixtures',
        'sessions',
        'tag-generated-yapi-0.7.0-v3.jsonl',
      );
      const root = fs.mkdtempSync(path.join(os.tmpdir(), 'yapi-0.7.0-head-open-'));
      const sessionDir = getYapiSessionDir(root);
      const target = path.join(sessionDir, path.basename(source));
      fs.mkdirSync(sessionDir, { recursive: true });
      fs.copyFileSync(source, target);
      const sessionFile = toVaultRelativePath(root, target);
      const sourceBytes = fs.readFileSync(target);
      const sourceDigest = createHash('sha256').update(sourceBytes).digest('hex');
      if (sourceDigest !== fixtureSha256) {
        throw new Error('Frozen 0.7.0 fixture SHA256 changed: ' + sourceDigest);
      }
      const sourceText = sourceBytes.toString('utf8');
      if (sourceText.includes(process.cwd()) || sourceText.includes(os.homedir())) {
        throw new Error('Frozen 0.7.0 fixture contains a machine-specific path');
      }

      const absolute = file => path.join(root, file);
      const adapter = {
        exists: async file => fs.existsSync(absolute(file)),
        read: async file => fs.readFileSync(absolute(file), 'utf8'),
        write: async (file, content) => fs.writeFileSync(absolute(file), content),
        append: async (file, content) => fs.appendFileSync(absolute(file), content),
        delete: async file => fs.rmSync(absolute(file), { force: true }),
        deleteFolder: async file => fs.rmSync(absolute(file), { recursive: true, force: true }),
        listFiles: async () => [],
        listFolders: async () => [],
        listFilesRecursive: async () => [sessionFile],
        ensureFolder: async file => fs.mkdirSync(absolute(file), { recursive: true }),
      };

      const sessionPaths = new Map();
      const turnPaths = new Map();
      const turnKey = (file, entryId) => file + '\0' + entryId;
      const externalContexts = {
        getSessionPaths: file => [...(sessionPaths.get(file) ?? [])],
        setSessionPaths: (file, paths) => sessionPaths.set(file, [...paths]),
        getTurnPaths: (file, entryId) => [...(turnPaths.get(turnKey(file, entryId)) ?? [])],
        setTurnPaths: (file, entryId, paths) => turnPaths.set(turnKey(file, entryId), [...paths]),
        copySession: () => undefined,
        deleteSession: () => undefined,
      };

      try {
        const store = new PiSessionStore(adapter, root, externalContexts);
        const manager = new OpenSessionManager({
          getVaultPath: () => root,
          getStore: () => store,
        });

        const opened = await manager.openByFile(sessionFile);
        const hydrated = await manager.switch(opened.id);
        if (!hydrated) throw new Error('HEAD did not hydrate the 0.7.0 session');
        const afterFirstOpen = fs.readFileSync(target);
        if (afterFirstOpen.equals(sourceBytes)) {
          throw new Error('HEAD did not migrate the 0.7.0 external-context fields');
        }
        if (afterFirstOpen.includes(Buffer.from('externalContextPaths'))) {
          throw new Error('Migrated JSONL still contains device-local paths');
        }
        if (readSessionJsonlIndex(target).migrations.externalContexts !== 1) {
          throw new Error('Migrated sidecar does not record external-context migration');
        }

        const roles = hydrated.messages.map(message => message.role);
        const user = hydrated.messages.find(message => message.role === 'user');
        const assistant = hydrated.messages.find(message => message.role === 'assistant');
        const restored = {
          sessionId: hydrated.sessionId,
          title: hydrated.title,
          roles,
          userContent: user?.content,
          assistantContent: assistant?.content,
          sessionExternalContextPaths: hydrated.externalContextPaths,
          turnExternalContextPaths: user?.turnRequest?.externalContextPaths,
          enabledMcpServers: hydrated.enabledMcpServers,
        };
        const expected = {
          sessionId: '01907a90-5e00-7424-8909-0a4242424242',
          title: 'Yapi 0.7.0 tag-generated fixture',
          roles: ['user', 'assistant'],
          userContent: 'Hello from the Yapi 0.7.0 writer.',
          assistantContent: 'Restored answer from the tag-generated fixture.',
          sessionExternalContextPaths: ['/synthetic/yapi-0.7.0/session-context'],
          turnExternalContextPaths: ['/synthetic/yapi-0.7.0/turn-context'],
          enabledMcpServers: ['synthetic-mcp'],
        };
        if (JSON.stringify(restored) !== JSON.stringify(expected)) {
          throw new Error('HEAD did not restore the frozen 0.7.0 session semantics: '
            + JSON.stringify(restored));
        }

        await store.open(sessionFile);
        const afterSecondOpen = fs.readFileSync(target);
        if (!afterSecondOpen.equals(afterFirstOpen)) {
          throw new Error('Second HEAD open changed the migrated session bytes');
        }

        console.log(JSON.stringify({
          sourceSha256: sourceDigest,
          migrationMarker: 1,
          restoredRoles: roles,
          idempotentSecondOpen: true,
        }));
      } finally {
        fs.rmSync(root, { recursive: true, force: true });
      }
    `;

    const result = spawnSync(process.execPath, [
      '--import',
      'tsx',
      '--input-type=module',
      '--eval',
      script,
    ], {
      cwd: process.cwd(),
      encoding: 'utf8',
      env: { ...process.env, NODE_ENV: 'production' },
    });

    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual({
      sourceSha256: 'd51b60c088b5a96922db38f4cf78c4e81c6e1d0343b278121ba78585d5b25955',
      migrationMarker: 1,
      restoredRoles: ['user', 'assistant'],
      idempotentSecondOpen: true,
    });
  });
});
