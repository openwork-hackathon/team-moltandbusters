#!/usr/bin/env node

/**
 * CaptainAhab — a continuously running Battleship agent.
 * Registers once, persists API key to disk, then loops forever:
 *   1. Check if there's an active battleship game
 *   2. If not, start one and play it with hunt/target strategy
 *   3. Wait, repeat
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const KEY_FILE = resolve(__dirname, ".captainahab-key");
const BASE = process.argv[2] || "https://moltandbusters.vercel.app";
const WALLET = "0xa21ae264F20347EcF0fc6e26e331b33bC3C15Cf3"; // Jupiter's wallet (holds $MOLTBUSTER)
const SHOT_DELAY = 2_000;
const BETWEEN_GAMES = 5_000;

let API_KEY = "";

function log(msg) {
  const ts = new Date().toLocaleTimeString();
  console.log(`[${ts}] ${msg}`);
}

async function api(path, opts) {
  const headers = { "Content-Type": "application/json" };
  if (API_KEY) headers["Authorization"] = `Bearer ${API_KEY}`;
  const res = await fetch(`${BASE}${path}`, { headers, ...opts });
  const data = await res.json();
  return { status: res.status, data, ok: res.ok };
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function ensureRegistered() {
  if (existsSync(KEY_FILE)) {
    API_KEY = readFileSync(KEY_FILE, "utf8").trim();
    log(`Loaded API key from ${KEY_FILE}`);

    const { ok } = await api("/api/games", { method: "GET" });
    if (ok) {
      log("API key is valid.");
      return;
    }
    log("Saved API key is invalid, re-registering...");
  }

  log("Registering CaptainAhab...");
  const { status, data } = await api("/api/agents", {
    method: "POST",
    body: JSON.stringify({ name: "CaptainAhab", walletAddress: WALLET }),
  });

  if (status === 409) {
    log("ERROR: CaptainAhab name is taken but no saved key. Delete .captainahab-key and flush agents to reset.");
    process.exit(1);
  }

  if (status !== 201) {
    log(`ERROR: Registration failed: ${data.error}`);
    process.exit(1);
  }

  API_KEY = data.apiKey;
  writeFileSync(KEY_FILE, API_KEY);
  log(`Registered! ID: ${data.id}`);
  log(`API Key saved to ${KEY_FILE}`);
}

async function getActiveBattleshipGame() {
  const { data: games } = await api("/api/battleship");
  return games.find((g) => g.agentName === "CaptainAhab" && g.status === "active") || null;
}

function buildStrategy(previousShots) {
  const fired = new Set();
  const hitQueue = [];
  const unsunkHits = new Set();

  // Rebuild state from previous shots
  for (const s of previousShots) {
    fired.add(`${s.row},${s.col}`);
    if (s.result === "hit") {
      unsunkHits.add(`${s.row},${s.col}`);
    } else if (s.result === "sunk") {
      // When a ship sinks, its cells are no longer "unsunk hits"
      // But we don't have shipCells here, so just don't add to unsunkHits
    }
  }

  // Queue adjacents for any remaining hits (unsunk)
  for (const key of unsunkHits) {
    const [r, c] = key.split(",").map(Number);
    addAdjacent(r, c, fired, hitQueue);
  }

  // Checkerboard hunt targets
  const huntTargets = [];
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 10; c++) {
      if ((r + c) % 2 === 0) huntTargets.push({ row: r, col: c });
    }
  }
  // Shuffle
  for (let i = huntTargets.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [huntTargets[i], huntTargets[j]] = [huntTargets[j], huntTargets[i]];
  }

  return { fired, hitQueue, huntTargets, huntIndex: 0 };
}

function addAdjacent(r, c, fired, hitQueue) {
  const neighbors = [
    [r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1],
  ];
  for (const [nr, nc] of neighbors) {
    const key = `${nr},${nc}`;
    if (nr >= 0 && nr <= 9 && nc >= 0 && nc <= 9 && !fired.has(key)) {
      hitQueue.push({ row: nr, col: nc });
    }
  }
}

function pickTarget(strategy) {
  const { fired, hitQueue, huntTargets } = strategy;

  // Try hit queue first (target mode)
  while (hitQueue.length > 0) {
    const candidate = hitQueue.shift();
    const key = `${candidate.row},${candidate.col}`;
    if (!fired.has(key)) return candidate;
  }

  // Checkerboard hunt mode
  while (strategy.huntIndex < huntTargets.length) {
    const candidate = huntTargets[strategy.huntIndex++];
    const key = `${candidate.row},${candidate.col}`;
    if (!fired.has(key)) return candidate;
  }

  // Last resort: any unfired cell
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 10; c++) {
      if (!fired.has(`${r},${c}`)) return { row: r, col: c };
    }
  }

  return null;
}

async function playGame() {
  let game = await getActiveBattleshipGame();

  if (game) {
    log(`Resuming active game ${game.id} (${game.shotCount} shots so far)`);
  } else {
    log("Starting new Battleship game...");
    const { status, data } = await api("/api/battleship", {
      method: "POST",
      body: JSON.stringify({}),
    });
    if (!status || status !== 201) {
      log(`Failed to start game: ${data.error || JSON.stringify(data)}`);
      return;
    }
    game = data;
    log(`Game started! ID: ${game.id}`);
  }

  log("Ships: Carrier(5), Battleship(4), Cruiser(3), Submarine(3), Destroyer(2)");

  const strategy = buildStrategy(game.shots || []);

  while (true) {
    const target = pickTarget(strategy);
    if (!target) {
      log("No more cells to fire at!");
      break;
    }

    strategy.fired.add(`${target.row},${target.col}`);

    const { status, data } = await api(`/api/battleship/${game.id}/fire`, {
      method: "POST",
      body: JSON.stringify({ row: target.row, col: target.col }),
    });

    if (status === 429) {
      const wait = (data.retryAfter || 1) + 1;
      log(`  Rate limited, waiting ${wait}s...`);
      strategy.fired.delete(`${target.row},${target.col}`);
      await sleep(wait * 1000);
      continue;
    }

    if (status !== 200) {
      log(`  Shot failed: ${data.error}`);
      break;
    }

    const coord = `(${target.row},${target.col})`;
    if (data.result === "miss") {
      log(`  Shot #${data.shotCount}: ${coord} ~ miss`);
    } else if (data.result === "hit") {
      log(`  Shot #${data.shotCount}: ${coord} X HIT!`);
      addAdjacent(target.row, target.col, strategy.fired, strategy.hitQueue);
    } else if (data.result === "sunk") {
      log(`  Shot #${data.shotCount}: ${coord} X HIT & SUNK ${data.ship}!`);
      // Don't queue adjacents for sunk — ship is done
    }

    if (data.gameOver) {
      log(`  ALL SHIPS SUNK! ${data.totalShots} shots, +${data.points}pts`);
      return;
    }

    await sleep(SHOT_DELAY);
  }
}

async function main() {
  log("=== CaptainAhab Battleship Agent ===");
  log(`Server: ${BASE}`);
  console.log("");

  await ensureRegistered();
  console.log("");

  let round = 0;
  while (true) {
    round++;
    log(`--- Round ${round} ---`);

    try {
      await playGame();
    } catch (err) {
      log(`Error during game: ${err.message}`);
    }

    log(`Waiting ${BETWEEN_GAMES / 1000}s before next game...\n`);
    await sleep(BETWEEN_GAMES);
  }
}

main().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
