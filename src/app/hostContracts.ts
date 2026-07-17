/**
 * Narrow UI-facing host contracts. Product UI depends on these shapes — not on
 * concrete YapiViewHost or workspace implementation modules.
 */
import type { AgentHostContext } from "@yapi/obsidian-host/bootstrap/hostContext";
import type { SharedAppStorage } from "@yapi/obsidian-host/bootstrap/storage";
import type { AppTabManagerState } from "@yapi/obsidian-host/bootstrap/types";
import type { ProviderCredential } from "@yapi/yapi-agent-core/auth/piProviderCredentials";
import type { ProviderOAuthProgress } from "@yapi/yapi-agent-core/auth/providerOAuthProgress";
import type { YapiSettings } from "@yapi/yapi-agent-core/foundation";
import type { ChatUIConfig, ChatUIOption } from "@yapi/yapi-agent-core/foundation/chatUi";
import type {
  AppModelReadinessProvider,
} from "@yapi/yapi-agent-core/foundation/modelReadiness";
import type { EnvironmentScope, WebProviderId } from "@yapi/yapi-agent-core/foundation/settings";
import type {
  AppMcpDiagnostics,
  AppMcpOAuth,
  AppMcpServerProbeProvider,
  AppMcpServerTester,
  AppMcpStorage,
  AppMcpToolProvider,
} from "@yapi/yapi-agent-core/mcp/ports";
import type { ManagedMcpServer } from "@yapi/yapi-agent-core/mcp/types";
import type { HttpClient, ProcessRunner } from "@yapi/yapi-agent-core/ports";
import type { SlashCommandCatalog } from "@yapi/yapi-agent-core/skills/commands/slashCommandCatalog";
import type { SlashCatalogEntry } from "@yapi/yapi-agent-core/skills/commands/slashCommandEntry";
import type { AppSkillProvider } from "@yapi/yapi-agent-core/skills/skillProvider";
import type {
  App,
  Editor,
  MarkdownView,
  Plugin,
  TFile,
  WorkspaceLeaf,
} from "obsidian";

import type {
  NoteToolbarItemStyle,
  NoteToolbarSetupResult,
} from "@/app/noteToolbarIntegration";


export interface YapiChatViewCommandState {
  mounted: boolean;
  canCreateTab: boolean;
  canStartNewSession: boolean;
  canCloseActiveTab: boolean;
}

/** User-command capabilities. No tab, controller, runtime, or DOM graph escapes. */
export interface YapiChatViewCommands {
  getState(): YapiChatViewCommandState;
  createTab(): Promise<boolean>;
  startNewSession(): Promise<boolean>;
  closeActiveTab(): Promise<boolean>;
  cancelActiveTurn(): boolean;
  addEditorSelection(editor: Editor, markdownView: MarkdownView): boolean;
  sendWorkspaceCommandInNewSession(content: string): Promise<boolean>;
  getInlineEditModel(): string | null;
  getActiveExternalContexts(): string[];
}

/** App-owned maintenance operations over all tabs in one mounted view. */
export interface YapiChatViewMaintenance {
  persistState(): Promise<void>;
  resetSession(openSessionId: string): Promise<void>;
  getBoundSessionFiles(): string[];
  hasSession(openSessionId: string): boolean;
  activateSession(openSessionId: string): Promise<boolean>;
  refreshModelPresentation(): void;
  refreshRuntimePrompt(): Promise<void>;
  reloadMcpServers(): Promise<void>;
  refreshVaultSkills(): Promise<void>;
  invalidateSlashCatalog(): void;
  warmSlashCatalog(): void;
  syncExternalReadDirectories(paths: readonly string[]): void;
  applyEnvironmentRuntimeChange(modelChanged: boolean): Promise<{ failedTabs: number }>;
  markFileContextDirty(includesFolders: boolean): void;
  handleFileOpen(file: TFile): void;
  dismissMentionDropdown(target: Node): void;
}

/** Development-only deterministic workload controls, absent from production bundles. */
export interface YapiChatDevelopmentCommands {
  run20SubagentsWorkload(hooks: {
    afterRender(result: { subagents: number; messages: number }): Promise<void>;
  }): Promise<{
    subagents: number;
    messages: number;
  }>;
  runIndexedSessionPagingWorkload(hooks: {
    afterColdOpen(): Promise<void>;
    afterOlderPage(): Promise<void>;
  }): Promise<{
    initialMessages: number;
    messagesAfterPrepend: number;
  }>;
  run100KbMarkdownStream(): Promise<{
    bytes: number;
    chunks: number;
    durationMs: number;
  }>;
  runTabSwitchingWorkload(): Promise<{
    tabs: number;
    switches: number;
    durationMs: number;
  }>;
}

/** Stable semantic boundary between the app shell and chat product runtime. */
export interface YapiChatViewHandle {
  commands: YapiChatViewCommands;
  maintenance: YapiChatViewMaintenance;
  development?: YapiChatDevelopmentCommands;
}

/**
 * Minimal chat view surface. Host contracts depend on this — not on concrete
 * `YapiViewHost` from product UI (breaks the type-level app ↔ ui cycle).
 */
export interface YapiChatView {
  leaf: WorkspaceLeaf;
  getChatHandle(): YapiChatViewHandle | null;
}

export interface YapiMcpAvailabilitySummary {
  totalCount: number;
  enabledCount: number;
  alwaysActiveCount: number;
  contextSavingCount: number;
}

export interface YapiMcpServerManager {
  getServers(): ManagedMcpServer[];
  getContextSavingServers(): ManagedMcpServer[];
  getAvailabilitySummary(): YapiMcpAvailabilitySummary;
}

export interface YapiProviderCredentialStore {
  readSync(providerId: string): ProviderCredential | undefined;
  modify(
    providerId: string,
    fn: (current: ProviderCredential | undefined) => Promise<ProviderCredential | undefined>,
  ): Promise<ProviderCredential | undefined>;
  delete(providerId: string): Promise<void>;
}

export interface YapiProviderOAuth {
  hasCodexAuth(): boolean;
  hasProviderOAuth(providerId: string): boolean;
  loginProviderOAuth(
    providerId: string,
    onProgress?: (progress: ProviderOAuthProgress) => void,
  ): Promise<void>;
  cancelProviderOAuthLogin(providerId: string): void;
  logoutProviderOAuth(providerId: string): Promise<void>;
}

export interface YapiWebSearchCredentialStore {
  readSync(providerId: WebProviderId): string | undefined;
  writeSync(providerId: WebProviderId, apiKey: string): void;
  clearSync(providerId: WebProviderId): void;
}

export interface YapiUiFacades {
  /** Chat toolbar/settings model-selector configuration. */
  readonly chatUIConfig: ChatUIConfig;

  /** Project active model/reasoning fields onto a settings snapshot. */
  getSettingsSnapshot<T extends Record<string, unknown>>(settings: T): T;

  /** Write a settings snapshot back into durable settings. */
  commitSettingsSnapshot(
    settings: Record<string, unknown>,
    snapshot: Record<string, unknown>,
  ): void;

  /** List catalog models for one provider (settings checklist). */
  listModelsForProvider(providerId: string): ChatUIOption[];

  /** Reinstall custom/local providers from settings into the pi-ai registry. */
  syncCustomProviders(settings: Record<string, unknown>): void;

  /** Fetch remote model list for a custom/local provider and persist it. */
  fetchCustomProviderModels(
    providerId: string,
    settings: Record<string, unknown>,
  ): Promise<{ count: number }>;

}

/** Workspace services exposed to chat/settings UI by the Obsidian plugin shell. */
export interface YapiPluginWorkspace {
  mcpStorage: AppMcpStorage;
  mcpServerManager: YapiMcpServerManager;
  mcpToolProvider: AppMcpToolProvider;
  mcpDiagnostics: AppMcpDiagnostics;
  mcpServerProbeProvider: AppMcpServerProbeProvider;
  mcpServerTester: AppMcpServerTester;
  modelReadinessProvider: AppModelReadinessProvider;
  skillProvider: AppSkillProvider;
  mcpOAuth: AppMcpOAuth | null;
  providerOAuth?: YapiProviderOAuth;
  credentialStore?: YapiProviderCredentialStore | null;
  webSearchCredentialStore?: YapiWebSearchCredentialStore | null;
  slashCommandCatalog: SlashCommandCatalog;
}

/**
 * Shared host capabilities needed by chat and settings UI.
 * Wide composition fields (workspace, storage, HTTP, process) stay off this
 * surface so chat UI cannot depend on them — use ChatPorts / SettingsPorts.
 */
export interface YapiHostCore {
  app: App;
  settings: YapiSettings;

  saveSettings(): Promise<void>;
  getAgentHostContext(): AgentHostContext;
  getVaultPath(): string | null;
  getUiFacades(): YapiUiFacades;
}

/** Chat-runtime host. Every other capability must arrive through `ChatPorts`. */
export interface YapiChatHost {
  app: App;
}

/** Composition-only chat capabilities; never pass this contract into `src/ui`. */
export interface YapiChatCompositionHost extends YapiHostCore {
  getAllViews(): YapiChatView[];
  loadTabManagerState(): Promise<AppTabManagerState | null>;
  persistTabManagerState(state: AppTabManagerState): Promise<void>;
}

/**
 * Settings/composition host: environment, model refresh, and wide capabilities
 * used by `createUiPorts` / main (not by `src/ui` chat code).
 */
export interface YapiSettingsHost extends YapiHostCore {
  storage: SharedAppStorage;
  httpClient: HttpClient;
  processRunner: ProcessRunner;
  getAllViews(): YapiChatView[];
  refreshVaultSkills(): Promise<void>;
  /** Opens Style Settings, or its community-plugin page when unavailable. */
  openStyleSettings(): Promise<boolean>;
  /** Checks for Note Toolbar's installed manifest without requiring it to be enabled. */
  isNoteToolbarInstalled(): Promise<boolean>;
  /** Configures the Yapi command in Note Toolbar's selected-text toolbar. */
  setupNoteToolbarIntegration(
    itemStyle: NoteToolbarItemStyle,
  ): Promise<NoteToolbarSetupResult>;
  setupWorkspaceCommandNoteToolbar(entry: SlashCatalogEntry): Promise<NoteToolbarSetupResult>;
  reconcileWorkspaceCommands(): Promise<void>;
  /** Session-file cleanup action exposed from the session-files settings section. */
  purgeDeletedSessionFiles(): Promise<number>;
  getActiveEnvironmentVariables(): string;
  getEnvironmentVariablesForScope(scope: EnvironmentScope): string;
  applyEnvironmentVariables(
    scope: EnvironmentScope,
    envText: string,
  ): Promise<void>;
  applyEnvironmentVariablesBatch(
    updates: Array<{ scope: EnvironmentScope; envText: string }>,
  ): Promise<void>;
  /** Obsidian Notice adapter used for timely settings and workspace feedback. */
  notify(
    message: string | DocumentFragment,
    timeout?: number,
  ): { noticeEl: HTMLElement; hide(): void } | null;
}

/**
 * Full plugin host surface (chat + settings). Implemented by the Obsidian
 * Plugin class. `settings` is Yapi-typed and overrides Plugin's looser field.
 */
export interface YapiPluginHost
  extends Omit<Plugin, "settings">,
    YapiChatCompositionHost,
    YapiSettingsHost {
  settings: YapiSettings;
}

export type { YapiPluginHost as default, YapiPluginHost as YapiPlugin };
