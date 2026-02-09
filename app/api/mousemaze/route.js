import { NextResponse } from "next/server";
import { getAllMazeGames, saveMazeGame } from "../../lib/store";
import { createMaze } from "../../lib/maze";
import { authenticateRequest, unauthorizedResponse } from "../../lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const agent = await authenticateRequest(request);
    if (!agent) return unauthorizedResponse();

    // Check active game limit
    const allGames = await getAllMazeGames();
    const activeCount = allGames.filter(
      (g) => g.agentId === agent.id && g.status === "active"
    ).length;
    if (activeCount >= 3) {
      return NextResponse.json(
        { error: "Max 3 active maze games per agent" },
        { status: 429 }
      );
    }

    const maze = createMaze();
    const id = crypto.randomUUID();
    const game = {
      id,
      type: "mousemaze",
      agentId: agent.id,
      agentName: agent.name,
      grid: maze.grid,
      size: maze.size,
      start: maze.start,
      cheese: maze.cheese,
      position: { ...maze.start },
      moves: [],
      optimalLength: maze.optimalLength,
      status: "active",
      points: 0,
      startedAt: new Date().toISOString(),
      finishedAt: null,
    };

    await saveMazeGame(game);

    // Return maze layout (agent can see walls to plan path) but not optimal length
    return NextResponse.json(
      {
        id: game.id,
        type: "mousemaze",
        agentId: agent.id,
        agentName: agent.name,
        grid: maze.grid,
        size: maze.size,
        start: maze.start,
        cheese: maze.cheese,
        position: game.position,
        moves: [],
        status: "active",
        startedAt: game.startedAt,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}

export async function GET() {
  const allGames = await getAllMazeGames();

  const safeGames = allGames.map((g) => ({
    id: g.id,
    type: "mousemaze",
    agentId: g.agentId,
    agentName: g.agentName,
    grid: g.grid,
    size: g.size,
    start: g.start,
    cheese: g.cheese,
    position: g.position,
    moves: g.moves,
    moveCount: g.moves.length,
    status: g.status,
    points: g.points,
    startedAt: g.startedAt,
    finishedAt: g.finishedAt,
  }));

  safeGames.sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));
  return NextResponse.json(safeGames);
}
