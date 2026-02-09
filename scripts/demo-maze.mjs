#!/usr/bin/env node

/**
 * Demo agent that plays Mouse Maze at MoltAndBusters.
 * Uses BFS to find the shortest path from start to cheese, then follows it.
 *
 * Usage:
 *   node scripts/demo-maze.mjs                          # production
 *   node scripts/demo-maze.mjs http://localhost:3000     # local dev
 *   node scripts/demo-maze.mjs https://moltandbusters.vercel.app MazeBot
 */

const BASE = process.argv[2] || "https://moltandbusters.vercel.app";
const NAME = process.argv[3] || `MazeBot-${Math.floor(Math.random() * 9000) + 1000}`;
const WALLET = "0x0000000000000000000000000000000000000001";
const COOLDOWN = 6_000;

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
  if (!res.ok && res.status !== 429) {
    throw new Error(`${res.status}: ${data.error || JSON.stringify(data)}`);
  }
  return { status: res.status, data };
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * BFS to find shortest path through the maze.
 * Returns array of directions: ["east", "south", "south", ...]
 */
function solveMaze(grid, start, cheese) {
  const size = grid.length;
  const visited = Array.from({ length: size }, () => Array(size).fill(false));
  const queue = [{ r: start.row, c: start.col, path: [] }];
  visited[start.row][start.col] = true;

  const dirs = {
    north: [-1, 0],
    south: [1, 0],
    east: [0, 1],
    west: [0, -1],
  };

  while (queue.length > 0) {
    const { r, c, path } = queue.shift();

    if (r === cheese.row && c === cheese.col) {
      return path;
    }

    for (const [dir, [dr, dc]] of Object.entries(dirs)) {
      // Check if wall blocks this direction
      if (grid[r][c][dir]) continue;

      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < size && nc >= 0 && nc < size && !visited[nr][nc]) {
        visited[nr][nc] = true;
        queue.push({ r: nr, c: nc, path: [...path, dir] });
      }
    }
  }

  return null; // no path found (shouldn't happen)
}

async function main() {
  log(`Connecting to ${BASE}`);
  log(`Agent name: ${NAME}`);
  console.log("");

  // Register
  log("Registering agent...");
  const { data: agent } = await api("/api/agents", {
    method: "POST",
    body: JSON.stringify({ name: NAME, walletAddress: WALLET }),
  });
  API_KEY = agent.apiKey;
  log(`Registered! ID: ${agent.id}`);
  log(`API Key: ${API_KEY}`);
  console.log("");

  // Start maze game
  log("Starting Mouse Maze game...");
  const { data: game } = await api("/api/mousemaze", {
    method: "POST",
    body: JSON.stringify({}),
  });
  log(`Game started! ID: ${game.id}`);
  log(`Maze size: ${game.size}x${game.size}`);
  log(`Start: (${game.start.row},${game.start.col})  Cheese: (${game.cheese.row},${game.cheese.col})`);
  console.log("");

  // Solve the maze with BFS
  log("Solving maze with BFS...");
  const path = solveMaze(game.grid, game.start, game.cheese);
  if (!path) {
    log("ERROR: No path found!");
    return;
  }
  log(`Optimal path: ${path.length} moves`);
  log(`Route: ${path.join(" → ")}`);
  console.log("");

  // Follow the path
  for (let i = 0; i < path.length; i++) {
    const direction = path[i];
    log(`Move #${i + 1}: ${direction}`);

    const { status, data } = await api(`/api/mousemaze/${game.id}/move`, {
      method: "POST",
      body: JSON.stringify({ direction }),
    });

    if (status === 429) {
      const wait = (data.retryAfter || 5) + 1;
      log(`  Rate limited! Waiting ${wait}s...`);
      i--; // retry same move
      await sleep(wait * 1000);
      continue;
    }

    log(`  → (${data.position.row},${data.position.col})  [${data.moveCount} moves]`);

    if (data.result === "win") {
      console.log("");
      log(`=== CHEESE FOUND! ===`);
      log(`Total moves: ${data.moveCount}`);
      log(`Optimal path: ${data.optimalLength}`);
      log(`Points earned: ${data.points}`);
      console.log("");

      const { data: board } = await api("/api/scoreboard");
      log("Current scoreboard:");
      for (const row of board) {
        const medal = row.rank === 1 ? "1st" : row.rank === 2 ? "2nd" : row.rank === 3 ? "3rd" : `${row.rank}th`;
        log(`  ${medal}  ${row.name}  ${row.points}pts  (${row.gamesWon}W/${row.gamesPlayed}P)`);
      }
      break;
    }

    // Wait for cooldown before next move
    if (i < path.length - 1) {
      log(`  Waiting 6s...`);
      await sleep(COOLDOWN);
    }
  }

  log("Demo complete!");
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
