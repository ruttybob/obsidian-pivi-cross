import { nodeFetch } from "@yapi/obsidian-host/nodeFetch";
import type { PiBaseToolProvider } from "@yapi/yapi-agent-core/engine/pi/buildPiToolRegistryCore";
import { createPiAuxQueryRunner } from "@yapi/yapi-agent-core/engine/pi/piAuxQueryRunner";
import { PiChatRuntime } from "@yapi/yapi-agent-core/engine/pi/piChatRuntime";
import type { PiRuntimeHost } from "@yapi/yapi-agent-core/engine/pi/piRuntimeHost";
import type { SubagentConcurrencyLimiter } from "@yapi/yapi-agent-core/engine/pi/subagentConcurrencyLimiter";
import type { McpOAuthService, McpServerManager } from "@yapi/yapi-agent-core/mcp";
import type { HttpClient } from "@yapi/yapi-agent-core/ports";
import type { AuxQueryRunner } from "@yapi/yapi-agent-core/runtime/auxQueryRunner";
import type { PiChatService } from "@yapi/yapi-agent-core/runtime/piChatService";

/**
 * App-layer factories that construct concrete Pi engine services.
 * Product UI must receive only PiChatService / AuxQueryRunner contracts.
 */
export interface ChatRuntimeServiceFactories {
  createChatService(host: PiRuntimeHost, httpClient: HttpClient): PiChatService;
  createAuxQueryRunner(host: PiRuntimeHost): AuxQueryRunner;
}

export function createChatRuntimeServiceFactories(deps: {
  mcpServerManager: McpServerManager | null;
  mcpOAuth: McpOAuthService | null;
  baseToolProvider: PiBaseToolProvider | null;
  subagentConcurrencyLimiter: SubagentConcurrencyLimiter;
}): ChatRuntimeServiceFactories {
  return {
    createChatService(host, httpClient) {
      return new PiChatRuntime(
        host,
        {
          httpClient,
          mcpFetch: nodeFetch,
          mcpProcessEnv: process.env,
        },
        deps.mcpServerManager,
        deps.mcpOAuth,
        deps.baseToolProvider,
        deps.subagentConcurrencyLimiter,
      );
    },
    createAuxQueryRunner(host) {
      return createPiAuxQueryRunner(host, {
        subagentConcurrencyLimiter: deps.subagentConcurrencyLimiter,
      });
    },
  };
}
