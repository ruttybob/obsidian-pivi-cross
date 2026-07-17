import {
  DEFAULT_SUBAGENT_RUNTIME_SETTINGS,
  DEFAULT_WEB_SEARCH_TOOLS_SETTINGS,
  type YapiSettings,
} from "./settings";

/** Default pi-ai environment string for fresh installs. */
export const PI_DEFAULT_ENVIRONMENT_VARIABLES = "PI_ENABLE_EXA=1";

/** Primary model key for new vaults (`YapiSettings.model` and `agentSettings.visibleModels`). */
export const DEFAULT_MODEL_KEY = "opencode-go/deepseek-v4-flash";

/** Providers Yapi exposes by default on fresh installs. */
export const DEFAULT_PI_PROVIDER_IDS = [
  "opencode-go",
  "deepseek",
  "openai-codex",
] as const;

/** Persisted agent defaults when `agentSettings` is missing or repaired on load. */
export const DEFAULT_AGENT_SETTINGS = Object.freeze({
  addedProviders: [...DEFAULT_PI_PROVIDER_IDS],
  environmentVariables: PI_DEFAULT_ENVIRONMENT_VARIABLES,
  selectedMode: "default",
  visibleModels: [DEFAULT_MODEL_KEY],
  webSearchTools: {
    providerOrder: [...DEFAULT_WEB_SEARCH_TOOLS_SETTINGS.providerOrder],
    disabledProviders: [],
  },
  subagents: { ...DEFAULT_SUBAGENT_RUNTIME_SETTINGS },
});

export const DEFAULT_YAPI_SETTINGS: YapiSettings = {
  userName: "",
  model: DEFAULT_MODEL_KEY,
  thinkingBudget: "off",
  thinkingLevel: "medium",
  enableAutoTitleGeneration: true,
  titleGenerationModel: "",
  enableAutoCompact: true,
  autoCompactThresholdRatio: 0.9,
  autoCompactKeepRecentTokens: 20_000,
  excludedTags: [],
  sharedEnvironmentVariables: "",
  customContextLimits: {},
  keyboardNavigation: {
    scrollUpKey: "w",
    scrollDownKey: "s",
    focusInputKey: "i",
  },
  requireCommandOrControlEnterToSend: false,
  locale: "en",
  agentSettings: { ...DEFAULT_AGENT_SETTINGS },
  enableAutoScroll: true,
  deferMathRenderingDuringStreaming: true,
  chatViewPlacement: "right-sidebar",
  hiddenSlashCommands: [],
};
