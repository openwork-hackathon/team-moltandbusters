// In-memory data store - survives HMR via globalThis
if (!globalThis.__moltStore) {
  globalThis.__moltStore = {
    agents: new Map(),
    games: new Map(),
    lastGuess: new Map(), // agentId -> timestamp (rate limiting)
  };
}

export const store = globalThis.__moltStore;

export const GUESS_COOLDOWN_MS = 30_000;
