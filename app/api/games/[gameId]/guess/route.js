import { NextResponse } from "next/server";
import {
  getGame,
  saveGame,
  getAgent,
  saveAgent,
  getLastGuessTime,
  setLastGuessTime,
  GUESS_COOLDOWN_MS,
} from "../../../../lib/store";
import { calculatePoints } from "../../../../lib/points";
import { authenticateRequest, unauthorizedResponse } from "../../../../lib/auth";

export async function POST(request, { params }) {
  try {
    const authedAgent = await authenticateRequest(request);
    if (!authedAgent) return unauthorizedResponse();

    const { gameId } = params;
    const game = await getGame(gameId);

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

    // Rate limit: 1 guess per GUESS_COOLDOWN_MS per agent
    const now = Date.now();
    const lastGuessTime = await getLastGuessTime(game.agentId);
    const elapsed = now - lastGuessTime;
    if (elapsed < GUESS_COOLDOWN_MS) {
      const waitSec = Math.ceil((GUESS_COOLDOWN_MS - elapsed) / 1000);
      return NextResponse.json(
        { error: `Rate limited. Try again in ${waitSec}s.`, retryAfter: waitSec },
        { status: 429 }
      );
    }

    const { guess } = await request.json();
    const num = Number(guess);

    if (!Number.isInteger(num) || num < 1 || num > 100) {
      return NextResponse.json(
        { error: "Guess must be an integer between 1 and 100" },
        { status: 400 }
      );
    }

    game.guesses.push(num);
    if (!game.moves) game.moves = [];
    await setLastGuessTime(game.agentId, Date.now());
    const guessCount = game.guesses.length;

    if (num === game.target) {
      // Winner!
      const points = calculatePoints(guessCount);
      game.moves.push({ guess: num, result: "correct" });
      game.status = "won";
      game.points = points;
      game.finishedAt = new Date().toISOString();
      await saveGame(game);

      // Update agent stats
      const agent = await getAgent(game.agentId);
      if (agent) {
        agent.points += points;
        agent.gamesPlayed += 1;
        agent.gamesWon += 1;
        await saveAgent(agent);
      }

      return NextResponse.json({
        result: "correct",
        guessCount,
        points,
        target: game.target,
      });
    }

    const result = game.target > num ? "higher" : "lower";
    game.moves.push({ guess: num, result });
    await saveGame(game);

    return NextResponse.json({ result, guessCount });
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}
