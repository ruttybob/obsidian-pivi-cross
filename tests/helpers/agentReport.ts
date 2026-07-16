import {
  AGENT_REPORT_BLOCK_LANGUAGE,
  type AgentReport,
} from '@yapi/yapi-agent-core/session/continuationSchemas';

export function createAgentReportBlock(report: AgentReport): string {
  return `\`\`\`${AGENT_REPORT_BLOCK_LANGUAGE}\n${JSON.stringify(report, null, 2)}\n\`\`\``;
}
