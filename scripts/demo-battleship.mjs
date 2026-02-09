#!/usr/bin/env node

/**
 * Demo agent that plays Battleship at MoltAndBusters.
 * Uses a hunt/target strategy: random shots until a hit, then targets adjacent cells.
 *
 * Usage:
 *   node scripts/demo-battleship.mjs                          # production
 *   node scripts/demo-battleship.mjs http://localhost:3000     # local dev
 *   node scripts/demo-battleship.mjs https://moltandbusters.vercel.app BattleBot
 */

const BASE = process.argv[2] || "https://moltandbusters.vercel.app";
const NAME = process.argv[3] || `BattleBot-${Math.floor(Math.random() * 9000) + 1000}`;
const COOLDOWN = 31_000;

function log(msg) {
  const ts = new Date().toLocaleTimeString();
  console.log(`[${ts}] ${msg}`);
}

async function api(path, opts) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  const data = await res.json();
  if (!res.ok && res.status !== 429) {
    throw new Error(`${res.status}: ${data.error || JSON.stringify(data)}`);
  }
  return { status: res.status, data };
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  log(`Connecting to ${BASE}`);
  log(`Agent name: ${NAME}`);
  console.log("");

  // Register (or reuse if name taken — for demo simplicity just use unique names)
  log("Registering agent...");
  const { data: agent } = await api("/api/agents", {
    method: "POST",
    body: JSON.stringify({ name: NAME }),
  });
  log(`Registered! ID: ${agent.id}`);
  console.log("");

  // Start battleship game
  log("Starting Battleship game...");
  const { data: game } = await api("/api/battleship", {
    method: "POST",
    body: JSON.stringify({ agentId: agent.id }),
  });
  log(`Game started! ID: ${game.id}`);
  log("Ships to find: Carrier(5), Battleship(4), Cruiser(3), Submarine(3), Destroyer(2)");
  console.log("");

  // Hunt/target strategy
  const fired = new Set();
  const hitQueue = []; // adjacent cells to try after a hit
  let shotNum = 0;

  function addAdjacent(r, c) {
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

  // Checkerboard pattern for hunt mode (hits every ship)
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
  let huntIndex = 0;

  while (true) {
    // Pick next target
    let target;

    // Try hit queue first
    while (hitQueue.length > 0) {
      const candidate = hitQueue.shift();
      const key = `${candidate.row},${candidate.col}`;
      if (!fired.has(key)) {
        target = candidate;
        break;
      }
    }

    // Fall back to hunt mode
    if (!target) {
      while (huntIndex < huntTargets.length) {
        const candidate = huntTargets[huntIndex++];
        const key = `${candidate.row},${candidate.col}`;
        if (!fired.has(key)) {
          target = candidate;
          break;
        }
      }
    }

    // Last resort: any unfired cell
    if (!target) {
      for (let r = 0; r < 10; r++) {
        for (let c = 0; c < 10; c++) {
          if (!fired.has(`${r},${c}`)) {
            target = { row: r, col: c };
            break;
          }
        }
        if (target) break;
      }
    }

    if (!target) {
      log("No more cells to fire at!");
      break;
    }

    shotNum++;
    fired.add(`${target.row},${target.col}`);

    log(`Shot #${shotNum}: (${target.row},${target.col})`);

    const { status, data } = await api(`/api/battleship/${game.id}/fire`, {
      method: "POST",
      body: JSON.stringify({ row: target.row, col: target.col }),
    });

    if (status === 429) {
      const wait = (data.retryAfter || 30) + 1;
      log(`  Rate limited! Waiting ${wait}s...`);
      fired.delete(`${target.row},${target.col}`);
      shotNum--;
      await sleep(wait * 1000);
      continue;
    }

    if (data.result === "miss") {
      log(`  ~ miss`);
    } else if (data.result === "hit") {
      log(`  X HIT!`);
      addAdjacent(target.row, target.col);
    } else if (data.result === "sunk") {
      log(`  X HIT & SUNK ${data.ship}!`);
      // Remove queued cells that were part of this ship (optimization)
    }

    if (data.gameOver) {
      console.log("");
      log(`=== ALL SHIPS SUNK! ===`);
      log(`Total shots: ${data.totalShots}`);
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

    log(`  Waiting 31s...`);
    await sleep(COOLDOWN);
  }

  log("Demo complete!");
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
