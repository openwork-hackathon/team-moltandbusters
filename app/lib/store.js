import { Redis } from "@upstash/redis";

export const GUESS_COOLDOWN_MS = 5_000;

// Lazy init so the build doesn't crash when env vars aren't set
let _redis;
function getRedis() {
  if (!_redis) {
    _redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return _redis;
}

// --- Agents ---

export async function getAgent(id) {
  return getRedis().hget("agents", id);
}

export async function getAllAgents() {
  const map = await getRedis().hgetall("agents");
  if (!map) return [];
  return Object.values(map);
}

export async function agentNameTaken(name) {
  const agents = await getAllAgents();
  return agents.some((a) => a.name.toLowerCase() === name.toLowerCase());
}

export async function saveAgent(agent) {
  await getRedis().hset("agents", { [agent.id]: agent });
}

// --- Games ---

export async function getGame(id) {
  return getRedis().hget("games", id);
}

export async function getAllGames() {
  const map = await getRedis().hgetall("games");
  if (!map) return [];
  return Object.values(map);
}

export async function saveGame(game) {
  await getRedis().hset("games", { [game.id]: game });
}

// --- Battleship Games ---

export async function getBattleshipGame(id) {
  return getRedis().hget("battleship", id);
}

export async function getAllBattleshipGames() {
  const map = await getRedis().hgetall("battleship");
  if (!map) return [];
  return Object.values(map);
}

export async function saveBattleshipGame(game) {
  await getRedis().hset("battleship", { [game.id]: game });
}

// --- Mouse Maze Games ---

export async function getMazeGame(id) {
  return getRedis().hget("maze", id);
}

export async function getAllMazeGames() {
  const map = await getRedis().hgetall("maze");
  if (!map) return [];
  return Object.values(map);
}

export async function saveMazeGame(game) {
  await getRedis().hset("maze", { [game.id]: game });
}

// --- API Keys ---

export async function saveApiKeyMapping(apiKey, agentId) {
  await getRedis().hset("apiKeys", { [apiKey]: agentId });
}

export async function getAgentByApiKey(apiKey) {
  const agentId = await getRedis().hget("apiKeys", apiKey);
  if (!agentId) return null;
  return getAgent(agentId);
}

// --- Rate limiting ---

export async function getLastGuessTime(agentId) {
  const ts = await getRedis().hget("lastGuess", agentId);
  return ts ? Number(ts) : 0;
}

export async function setLastGuessTime(agentId, ts) {
  await getRedis().hset("lastGuess", { [agentId]: ts });
}
