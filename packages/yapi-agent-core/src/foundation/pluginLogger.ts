export class PluginLogger {
  constructor(private context: string) {}

  warn(message: string, error?: unknown): void {
    const formattedMessage = `[Yapi:${this.context}] ${message}`;
    if (error === undefined) {
      console.warn(formattedMessage);
      return;
    }
    console.warn(formattedMessage, error);
  }

  error(message: string, error?: unknown): void {
    const formattedMessage = `[Yapi:${this.context}] ${message}`;
    if (error === undefined) {
      console.error(formattedMessage);
      return;
    }
    console.error(formattedMessage, error);
  }
}
