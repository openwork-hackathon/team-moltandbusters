#!/usr/bin/env node

/**
 * Demo agent that plays the MoltAndBusters Number Guessing Game.
 * Uses binary search, respects the 5s rate limit between guesses.
 *
 * Usage:
 *   node scripts/demo-agent.mjs                          # against production
 *   node scripts/demo-agent.mjs http://localhost:3000     # against local dev
 *   node scripts/demo-agent.mjs https://moltandbusters.vercel.app DemoBot
 */

const BASE = process.argv[2] || "https://moltandbusters.vercel.app";
const NAME = process.argv[3] || `DemoBot-${Math.floor(Math.random() * 9000) + 1000}`;
const WALLET = "0x0000000000000000000000000000000000000001"; // dummy wallet for demo
const COOLDOWN = 6_000; // 6s to stay safely above the 5s rate limit

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

async function main() {
  log(`Connecting to ${BASE}`);
  log(`Agent name: ${NAME}`);
  console.log("");

  // 1. Register
  log("Registering agent...");
  const { data: agent } = await api("/api/agents", {
    method: "POST",
    body: JSON.stringify({ name: NAME, walletAddress: WALLET }),
  });
  API_KEY = agent.apiKey;
  log(`Registered! ID: ${agent.id}`);
  log(`API Key: ${API_KEY}`);
  console.log("");

  // 2. Start game
  log("Starting a new game...");
  const { data: game } = await api("/api/games", {
    method: "POST",
    body: JSON.stringify({}),
  });
  log(`Game started! ID: ${game.id}`);
  log("Guessing a number between 1 and 100...");
  console.log("");

  // 3. Binary search with rate-limit waits
  let low = 1;
  let high = 100;
  let round = 0;

  while (true) {
    const guess = Math.floor((low + high) / 2);
    round++;

    log(`Guess #${round}: ${guess}  (range ${low}-${high})`);

    const { status, data } = await api(`/api/games/${game.id}/guess`, {
      method: "POST",
      body: JSON.stringify({ guess }),
    });

    // Handle rate limit (shouldn't happen with our sleep, but just in case)
    if (status === 429) {
      const wait = (data.retryAfter || 5) + 1;
      log(`Rate limited! Waiting ${wait}s...`);
      await sleep(wait * 1000);
      round--; // retry same guess
      continue;
    }

    if (data.result === "correct") {
      console.log("");
      log(`=== CORRECT! Target was ${data.target} ===`);
      log(`Solved in ${data.guessCount} guesses`);
      log(`Points earned: ${data.points}`);
      console.log("");

      // Show final scoreboard
      const { data: board } = await api("/api/scoreboard");
      log("Current scoreboard:");
      if (board.length === 0) {
        log("  (empty)");
      } else {
        for (const row of board) {
          const medal = row.rank === 1 ? "1st" : row.rank === 2 ? "2nd" : row.rank === 3 ? "3rd" : `${row.rank}th`;
          log(`  ${medal}  ${row.name}  ${row.points}pts  (${row.gamesWon}W/${row.gamesPlayed}P)`);
        }
      }
      break;
    }

    log(`  -> ${data.result} (guess count: ${data.guessCount})`);

    if (data.result === "higher") {
      low = guess + 1;
    } else {
      high = guess - 1;
    }

    // Wait for cooldown before next guess
    const remaining = high - low;
    if (remaining >= 0) {
      log(`  Waiting 6s before next guess... (${remaining + 1} numbers left in range)`);
      await sleep(COOLDOWN);
    }
  }

  log("Demo complete!");
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
