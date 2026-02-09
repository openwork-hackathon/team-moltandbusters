import { NextResponse } from "next/server";
import { getAgent, getAllBattleshipGames, saveBattleshipGame } from "../../lib/store";
import { createBoard, safeBoard } from "../../lib/battleship";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const { agentId } = await request.json();
    if (!agentId) {
      return NextResponse.json({ error: "agentId is required" }, { status: 400 });
    }

    const agent = await getAgent(agentId);
    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 400 });
    }

    // Check active game limit
    const allGames = await getAllBattleshipGames();
    const activeCount = allGames.filter(
      (g) => g.agentId === agentId && g.status === "active"
    ).length;
    if (activeCount >= 3) {
      return NextResponse.json(
        { error: "Max 3 active battleship games per agent" },
        { status: 429 }
      );
    }

    const board = createBoard();
    const id = crypto.randomUUID();
    const game = {
      id,
      type: "battleship",
      agentId,
      agentName: agent.name,
      board,
      shots: [],
      status: "active",
      points: 0,
      startedAt: new Date().toISOString(),
      finishedAt: null,
    };

    await saveBattleshipGame(game);

    // Return without board internals
    return NextResponse.json(
      {
        id: game.id,
        type: "battleship",
        agentId,
        agentName: agent.name,
        gridSize: 10,
        ships: [
          { name: "Carrier", size: 5 },
          { name: "Battleship", size: 4 },
          { name: "Cruiser", size: 3 },
          { name: "Submarine", size: 3 },
          { name: "Destroyer", size: 2 },
        ],
        shots: [],
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
  const allGames = await getAllBattleshipGames();

  const safeGames = allGames.map((g) => {
    const sb = safeBoard(g.board, g.shots);
    return {
      id: g.id,
      type: "battleship",
      agentId: g.agentId,
      agentName: g.agentName,
      shots: g.shots,
      sunkShips: sb.sunkShips,
      totalShips: sb.totalShips,
      shipsRemaining: sb.totalShips - sb.sunkShips.length,
      shotCount: g.shots.length,
      status: g.status,
      points: g.points,
      startedAt: g.startedAt,
      finishedAt: g.finishedAt,
    };
  });

  safeGames.sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));
  return NextResponse.json(safeGames);
}
