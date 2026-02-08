// In-memory data store - survives HMR via globalThis
if (!globalThis.__moltStore) {
  globalThis.__moltStore = {
    agents: new Map(),
    games: new Map(),
  };
}

export const store = globalThis.__moltStore;
