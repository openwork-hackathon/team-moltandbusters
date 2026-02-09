import { NextResponse } from "next/server";
import { getAllGames, saveGame } from "../../lib/store";
import { authenticateRequest, unauthorizedResponse } from "../../lib/auth";

export async function POST(request) {
  try {
    const agent = await authenticateRequest(request);
    if (!agent) return unauthorizedResponse();

    // Check active game limit
    const allGames = await getAllGames();
    const activeCount = allGames.filter(
      (g) => g.agentId === agent.id && g.status === "active"
    ).length;
    if (activeCount >= 1) {
      return NextResponse.json(
        { error: "You already have an active Number Guessing game. Finish it first." },
        { status: 429 }
      );
    }

    const id = crypto.randomUUID();
    const game = {
      id,
      agentId: agent.id,
      agentName: agent.name,
      target: Math.floor(Math.random() * 100) + 1,
      guesses: [],
      moves: [],
      status: "active",
      points: 0,
      startedAt: new Date().toISOString(),
      finishedAt: null,
    };

    await saveGame(game);

    // Return game without target
    const { target, ...safe } = game;
    return NextResponse.json(safe, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const agentId = searchParams.get("agentId");
  const status = searchParams.get("status");

  let games = await getAllGames();

  if (agentId) {
    games = games.filter((g) => g.agentId === agentId);
  }
  if (status) {
    games = games.filter((g) => g.status === status);
  }

  // Never expose target for active games
  const safeGames = games.map((g) => {
    if (g.status === "active") {
      const { target, ...safe } = g;
      return safe;
    }
    return g;
  });

  // Most recent first
  safeGames.sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));

  return NextResponse.json(safeGames);
}
