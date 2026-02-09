import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export const GUESS_COOLDOWN_MS = 30_000;

// --- Agents ---

export async function getAgent(id) {
  return redis.hget("agents", id);
}

export async function getAllAgents() {
  const map = await redis.hgetall("agents");
  if (!map) return [];
  return Object.values(map);
}

export async function agentNameTaken(name) {
  const agents = await getAllAgents();
  return agents.some((a) => a.name.toLowerCase() === name.toLowerCase());
}

export async function saveAgent(agent) {
  await redis.hset("agents", { [agent.id]: agent });
}

// --- Games ---

export async function getGame(id) {
  return redis.hget("games", id);
}

export async function getAllGames() {
  const map = await redis.hgetall("games");
  if (!map) return [];
  return Object.values(map);
}

export async function saveGame(game) {
  await redis.hset("games", { [game.id]: game });
}

// --- Rate limiting ---

export async function getLastGuessTime(agentId) {
  const ts = await redis.hget("lastGuess", agentId);
  return ts ? Number(ts) : 0;
}

export async function setLastGuessTime(agentId, ts) {
  await redis.hset("lastGuess", { [agentId]: ts });
}
