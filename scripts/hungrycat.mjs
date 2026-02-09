#!/usr/bin/env node

/**
 * HungryCat — a continuously running Mouse Maze agent.
 * Registers once, persists API key to disk, then loops forever:
 *   1. Check if there's an active maze game
 *   2. If not, start one and solve it with BFS
 *   3. Wait, repeat
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const KEY_FILE = resolve(__dirname, ".hungrycat-key");
const BASE = process.argv[2] || "https://moltandbusters.vercel.app";
const WALLET = "0xa21ae264F20347EcF0fc6e26e331b33bC3C15Cf3"; // Jupiter's wallet (holds $MOLTBUSTER)
const MOVE_DELAY = 2_000;
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

function solveMaze(grid, start, cheese) {
  const size = grid.length;
  const visited = Array.from({ length: size }, () => Array(size).fill(false));
  const queue = [{ r: start.row, c: start.col, path: [] }];
  visited[start.row][start.col] = true;
  const dirs = { north: [-1, 0], south: [1, 0], east: [0, 1], west: [0, -1] };

  while (queue.length > 0) {
    const { r, c, path } = queue.shift();
    if (r === cheese.row && c === cheese.col) return path;
    for (const [dir, [dr, dc]] of Object.entries(dirs)) {
      if (grid[r][c][dir]) continue;
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < size && nc >= 0 && nc < size && !visited[nr][nc]) {
        visited[nr][nc] = true;
        queue.push({ r: nr, c: nc, path: [...path, dir] });
      }
    }
  }
  return null;
}

async function ensureRegistered() {
  // Try loading saved key
  if (existsSync(KEY_FILE)) {
    API_KEY = readFileSync(KEY_FILE, "utf8").trim();
    log(`Loaded API key from ${KEY_FILE}`);

    // Verify key still works
    const { ok } = await api("/api/games", { method: "GET" });
    if (ok) {
      log("API key is valid.");
      return;
    }
    log("Saved API key is invalid, re-registering...");
  }

  // Register
  log("Registering HungryCat...");
  const { status, data } = await api("/api/agents", {
    method: "POST",
    body: JSON.stringify({ name: "HungryCat", walletAddress: WALLET }),
  });

  if (status === 409) {
    // Name taken but we lost the key — can't recover
    log("ERROR: HungryCat name is taken but no saved key. Delete .hungrycat-key and flush agents to reset.");
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

async function getActiveMazeGame() {
  const { data: games } = await api("/api/mousemaze");
  // Find active game belonging to us (by agent name since we can't filter by key)
  return games.find((g) => g.agentName === "HungryCat" && g.status === "active") || null;
}

async function playGame() {
  // Check for existing active game
  let game = await getActiveMazeGame();

  if (game) {
    log(`Resuming active game ${game.id} (${game.moveCount} moves so far)`);
  } else {
    log("Starting new Mouse Maze game...");
    const { status, data } = await api("/api/mousemaze", {
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

  log(`Maze: (${game.start.row},${game.start.col}) → (${game.cheese.row},${game.cheese.col})`);

  // Solve from current position
  const path = solveMaze(game.grid, game.position, game.cheese);
  if (!path) {
    log("ERROR: No path found from current position!");
    return;
  }
  log(`Path from current position: ${path.length} moves`);

  // Follow the path
  for (let i = 0; i < path.length; i++) {
    const dir = path[i];

    const { status, data } = await api(`/api/mousemaze/${game.id}/move`, {
      method: "POST",
      body: JSON.stringify({ direction: dir }),
    });

    if (status === 429) {
      const wait = (data.retryAfter || 1) + 1;
      log(`  Rate limited, waiting ${wait}s...`);
      i--;
      await sleep(wait * 1000);
      continue;
    }

    if (status !== 200) {
      log(`  Move failed: ${data.error}`);
      break;
    }

    const pos = `(${data.position.row},${data.position.col})`;
    if (data.result === "win") {
      log(`  Move #${data.moveCount}: ${dir} → ${pos} — CHEESE FOUND! +${data.points}pts`);
      return;
    }

    log(`  Move #${data.moveCount}: ${dir} → ${pos}`);

    if (i < path.length - 1) {
      await sleep(MOVE_DELAY);
    }
  }
}

async function main() {
  log("=== HungryCat Mouse Maze Agent ===");
  log(`Server: ${BASE}`);
  console.log("");

  await ensureRegistered();
  console.log("");

  // Loop forever
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
