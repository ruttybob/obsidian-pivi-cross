import type { AuxQueryRunner } from '@yapi/yapi-agent-core/runtime/auxQueryRunner';
import type { InlineEditPort } from '@yapi/yapi-react/ports';

export interface InlineEditCompositionHost {
  createAuxQueryRunner(): AuxQueryRunner;
}

export function createInlineEditPort(host: InlineEditCompositionHost): InlineEditPort {
  return {
    createAuxQueryRunner: () => host.createAuxQueryRunner(),
  };
}
