import { NextResponse } from "next/server";
import {
  getBattleshipGame,
  saveBattleshipGame,
  getAgent,
  saveAgent,
  getLastGuessTime,
  setLastGuessTime,
  GUESS_COOLDOWN_MS,
} from "../../../../lib/store";
import {
  processShot,
  allShipsSunk,
  calculateBattleshipPoints,
} from "../../../../lib/battleship";

export async function POST(request, { params }) {
  try {
    const { gameId } = params;
    const game = await getBattleshipGame(gameId);

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 400 });
    }
    if (game.status !== "active") {
      return NextResponse.json(
        { error: "Game is already finished" },
        { status: 400 }
      );
    }

    // Rate limit: shared 30s cooldown per agent
    const now = Date.now();
    const lastTime = await getLastGuessTime(game.agentId);
    const elapsed = now - lastTime;
    if (elapsed < GUESS_COOLDOWN_MS) {
      const waitSec = Math.ceil((GUESS_COOLDOWN_MS - elapsed) / 1000);
      return NextResponse.json(
        { error: `Rate limited. Try again in ${waitSec}s.`, retryAfter: waitSec },
        { status: 429 }
      );
    }

    const { row, col } = await request.json();
    const r = Number(row);
    const c = Number(col);

    if (
      !Number.isInteger(r) || !Number.isInteger(c) ||
      r < 0 || r > 9 || c < 0 || c > 9
    ) {
      return NextResponse.json(
        { error: "row and col must be integers 0-9" },
        { status: 400 }
      );
    }

    // Check for duplicate shot
    if (game.shots.some((s) => s.row === r && s.col === c)) {
      return NextResponse.json(
        { error: "Already fired at this coordinate" },
        { status: 400 }
      );
    }

    await setLastGuessTime(game.agentId, Date.now());

    const shotResult = processShot(game.board, r, c);
    const shot = { row: r, col: c, result: shotResult.result };
    game.shots.push(shot);

    const response = {
      result: shotResult.result,
      shotCount: game.shots.length,
    };

    if (shotResult.result === "sunk") {
      response.ship = shotResult.ship;
      response.shipCells = shotResult.shipCells;
    }

    // Check if all ships sunk
    if (allShipsSunk(game.board)) {
      const points = calculateBattleshipPoints(game.shots.length);
      game.status = "won";
      game.points = points;
      game.finishedAt = new Date().toISOString();
      await saveBattleshipGame(game);

      const agent = await getAgent(game.agentId);
      if (agent) {
        agent.points += points;
        agent.gamesPlayed += 1;
        agent.gamesWon += 1;
        await saveAgent(agent);
      }

      response.gameOver = true;
      response.points = points;
      response.totalShots = game.shots.length;
    } else {
      await saveBattleshipGame(game);
    }

    return NextResponse.json(response);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}
