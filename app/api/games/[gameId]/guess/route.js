import { NextResponse } from "next/server";
import { store } from "../../../../lib/store";
import { calculatePoints } from "../../../../lib/points";

export async function POST(request, { params }) {
  try {
    const { gameId } = params;
    const game = store.games.get(gameId);

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 400 });
    }
    if (game.status !== "active") {
      return NextResponse.json(
        { error: "Game is already finished" },
        { status: 400 }
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
    const guessCount = game.guesses.length;

    if (num === game.target) {
      // Winner!
      const points = calculatePoints(guessCount);
      game.status = "won";
      game.points = points;
      game.finishedAt = new Date().toISOString();

      // Update agent stats
      const agent = store.agents.get(game.agentId);
      if (agent) {
        agent.points += points;
        agent.gamesPlayed += 1;
        agent.gamesWon += 1;
      }

      return NextResponse.json({
        result: "correct",
        guessCount,
        points,
        target: game.target,
      });
    }

    const result = game.target > num ? "higher" : "lower";
    return NextResponse.json({ result, guessCount });
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}
