import type { McpTool } from '@yapi/yapi-agent-core/mcp/types';

import { useT } from '../i18n';

export function McpToolInventory({ tools }: { readonly tools: readonly McpTool[] }) {
  const t = useT();

  return (
    <section className="yapi-mcp-tool-inventory">
      <p className="yapi-mcp-tool-inventory-title">
        {t('settings.mcp.test.availableTools', { count: tools.length })}
      </p>
      <div className="yapi-mcp-tool-inventory-grid">
        {tools.map((tool) => (
          <div className="yapi-mcp-tool-card" key={tool.name}>
            <span className="yapi-mcp-tool-name">{tool.name}</span>
            {tool.description ? <span className="yapi-mcp-tool-description">{tool.description}</span> : null}
          </div>
        ))}
      </div>
    </section>
  );
}
