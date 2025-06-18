type SessionData = {
    accessToken: string;
    expiresAt: number;
  };
  
  declare global {
    // Prevent TypeScript from complaining about re-declaring globalThis types
    // (useful if hot reloading in dev)
    // @ts-ignore
    var __sessionStore: Map<string, SessionData> | undefined;
  }
  
  if (!globalThis.__sessionStore) {
    globalThis.__sessionStore = new Map<string, SessionData>();
  }
  
  export const sessionStore = globalThis.__sessionStore!;
  