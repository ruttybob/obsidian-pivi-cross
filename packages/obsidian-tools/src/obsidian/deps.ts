import type {
  ExternalFileEntry,
  ExternalFileReadResult,
  ExternalFileStat,
  ObsidianCliTransport,
  ObsidianVaultApi,
} from '@yapi/obsidian-host';
import type { ObsidianToolsSettings } from '@yapi/yapi-agent-core/foundation';
import type { ProcessRunner } from '@yapi/yapi-agent-core/ports';


export interface ObsidianImageGenerator {
  generateImage(request: {
    prompt: string;
    model?: string;
    outputFormat?: 'png' | 'jpeg' | 'webp';
    sessionId?: string;
    signal?: AbortSignal;
  }): Promise<{
    data: string;
    mimeType: string;
    outputFormat: 'png' | 'jpeg' | 'webp';
    model: string;
    backendImageModel: string;
    responseId?: string;
    imageGenerationId?: string;
    revisedPrompt?: string;
    usage?: unknown;
  }>;
}

export interface ExternalFileApiLike {
  readFile(absolutePath: string): Promise<ExternalFileReadResult>;
  listPath(absolutePath: string): ExternalFileEntry[];
  stat(absolutePath: string): ExternalFileStat;
}

export interface ObsidianToolDeps {
  vault: ObsidianVaultApi;
  cli: ObsidianCliTransport;
  externalFiles: ExternalFileApiLike;
  settings: ObsidianToolsSettings;
  vaultName: string;
  obsidianCliAvailable?: boolean;
  processRunner: ProcessRunner;
  imageGenerator?: ObsidianImageGenerator;
}
