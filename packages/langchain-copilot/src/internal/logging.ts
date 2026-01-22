import type { CopilotLogEvent, CopilotLogPayload, CopilotLogger } from "../types.js";

export type LogPayload = CopilotLogPayload;

export const logEvent = (logger: CopilotLogger | undefined, event: LogPayload): void => {
  if (!logger) return;
  logger({ timestamp: new Date().toISOString(), ...event } as CopilotLogEvent);
};
