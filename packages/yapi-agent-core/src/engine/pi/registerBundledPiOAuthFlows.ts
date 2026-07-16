import { registerYapiBundledOAuthFlowLoaders } from './registerYapiBundledOAuthFlowLoaders';
import type { ProviderOAuthFetch } from './yapiXaiOAuthDeviceFlow';

/** Register pi-ai OAuth flows statically for Obsidian's bundled CJS runtime. */
export function registerBundledPiOAuthFlows(request: ProviderOAuthFetch): void {
  registerYapiBundledOAuthFlowLoaders(request);
}
