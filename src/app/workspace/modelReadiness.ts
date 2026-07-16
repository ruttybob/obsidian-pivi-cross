import { INTERACTIVE_OAUTH_PROVIDER_IDS } from '@yapi/yapi-agent-core/auth/piProviderCredentials';
import { deriveProviderReadinessStatus } from '@yapi/yapi-agent-core/auth/providerReadiness';
import { PI_AI_MODELS_CACHE } from '@yapi/yapi-agent-core/engine/pi/piModelRegistry';
import type { ObsidianCredentialStore } from '@yapi/yapi-agent-core/engine/pi/piProviderCredentialStore';
import type { ProviderOAuthService } from '@yapi/yapi-agent-core/engine/pi/piProviderOAuthService';
import { getPiAgentSettings } from '@yapi/yapi-agent-core/foundation/agentSettings';
import type {
  AppModelReadinessStatus,
  AppModelTestResult,
} from '@yapi/yapi-agent-core/foundation/modelReadiness';
import { getProviderIdFromModelValue } from '@yapi/yapi-agent-core/foundation/providerLogos';

import { testModelReadiness, testProviderReadiness } from './providerReadiness';

export interface PiModelReadinessContext {
  credentialStore: ObsidianCredentialStore | null;
  providerOAuth: ProviderOAuthService;
}

function unavailableStatus(description: string): AppModelReadinessStatus {
  return {
    kind: 'unavailable',
    label: 'Unavailable',
    description,
  };
}

export function derivePiModelReadinessStatus(
  model: string,
  settings: Record<string, unknown>,
  context: PiModelReadinessContext,
): AppModelReadinessStatus {
  const providerId = getProviderIdFromModelValue(model);
  if (!providerId) {
    return unavailableStatus('This model id is not in provider/model format.');
  }

  const piSettings = getPiAgentSettings(settings);
  const interactiveOAuthConnected = (INTERACTIVE_OAUTH_PROVIDER_IDS as readonly string[]).includes(providerId)
    ? context.providerOAuth.hasProviderOAuth(providerId)
    : false;

  const custom = piSettings.customProviders.find((provider) => provider.id === providerId);
  const allowKeyless = !!custom && custom.apiKeyRequired === false;

  return deriveProviderReadinessStatus({
    providerId,
    piSettings,
    credential: context.credentialStore?.readSync(providerId),
    interactiveOAuthConnected,
    modelCount: PI_AI_MODELS_CACHE.has(model) ? 1 : 0,
    allowKeyless,
  });
}

export async function runPiModelReadinessTest(
  model: string,
  settings: Record<string, unknown>,
): Promise<AppModelTestResult> {
  return testModelReadiness(model, getPiAgentSettings(settings));
}

export async function runPiProviderReadinessTest(
  providerId: string,
  settings: Record<string, unknown>,
): Promise<AppModelTestResult> {
  return testProviderReadiness(providerId, getPiAgentSettings(settings));
}
