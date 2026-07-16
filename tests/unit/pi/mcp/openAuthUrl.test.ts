import type { ExternalOpener } from '@yapi/yapi-agent-core/ports';
import { openAuthUrl } from '@yapi/yapi-agent-core/mcp/oauth/openAuthUrl';

describe('openAuthUrl', () => {

  it('delegates to ExternalOpener when provided', async () => {
    const opener: ExternalOpener = {
      openExternalUrl: jest.fn().mockResolvedValue(undefined),
    };

    await openAuthUrl('https://issuer.example.com/authorize', opener);

    expect(opener.openExternalUrl).toHaveBeenCalledWith('https://issuer.example.com/authorize');
  });

  it('propagates opener failures', async () => {
    const opener: ExternalOpener = {
      openExternalUrl: jest.fn().mockRejectedValue(new Error('blocked')),
    };

    await expect(openAuthUrl('https://issuer.example.com/authorize', opener)).rejects.toThrow('blocked');
  });
});