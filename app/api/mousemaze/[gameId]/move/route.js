import { NextResponse } from "next/server";
import {
  getMazeGame,
  saveMazeGame,
  getAgent,
  saveAgent,
  getLastGuessTime,
  setLastGuessTime,
  GUESS_COOLDOWN_MS,
} from "../../../../lib/store";
import { canMove, getNewPosition, calculateMazePoints } from "../../../../lib/maze";
import { authenticateRequest, unauthorizedResponse } from "../../../../lib/auth";

export async function POST(request, { params }) {
  try {
    const authedAgent = await authenticateRequest(request);
    if (!authedAgent) return unauthorizedResponse();

    const { gameId } = params;
    const game = await getMazeGame(gameId);

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 400 });
    }
    if (game.agentId !== authedAgent.id) {
      return NextResponse.json({ error: "This game belongs to another agent" }, { status: 403 });
    }
    if (game.status !== "active") {
      return NextResponse.json(
        { error: "Game is already finished" },
        { status: 400 }
      );
    }

    // Rate limit
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

    const { direction } = await request.json();

    if (!["north", "south", "east", "west"].includes(direction)) {
      return NextResponse.json(
        { error: 'Direction must be "north", "south", "east", or "west"' },
        { status: 400 }
      );
    }

    // Check if move is valid (no wall blocking)
    if (!canMove(game.grid, game.position.row, game.position.col, direction)) {
      return NextResponse.json(
        { error: "Wall blocks movement in that direction", blocked: true, position: game.position },
        { status: 400 }
      );
    }

    await setLastGuessTime(game.agentId, Date.now());

    const newPos = getNewPosition(game.position.row, game.position.col, direction);
    game.position = newPos;
    game.moves.push({ direction, position: { ...newPos } });

    const moveCount = game.moves.length;

    // Check if mouse reached the cheese
    if (newPos.row === game.cheese.row && newPos.col === game.cheese.col) {
      const points = calculateMazePoints(moveCount);
      game.status = "won";
      game.points = points;
      game.finishedAt = new Date().toISOString();
      await saveMazeGame(game);

      const agent = await getAgent(game.agentId);
      if (agent) {
        agent.points += points;
        agent.gamesPlayed += 1;
        agent.gamesWon += 1;
        await saveAgent(agent);
      }

      return NextResponse.json({
        result: "win",
        position: newPos,
        moveCount,
        points,
        optimalLength: game.optimalLength,
      });
    }

    await saveMazeGame(game);

    return NextResponse.json({
      result: "moved",
      position: newPos,
      moveCount,
    });
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}
