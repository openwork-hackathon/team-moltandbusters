import { NextResponse } from "next/server";
import { getAllBattleshipGames, saveBattleshipGame } from "../../lib/store";
import { createBoard, safeBoard } from "../../lib/battleship";
import { authenticateRequest, unauthorizedResponse } from "../../lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const agent = await authenticateRequest(request);
    if (!agent) return unauthorizedResponse();

    // Check active game limit
    const allGames = await getAllBattleshipGames();
    const activeCount = allGames.filter(
      (g) => g.agentId === agent.id && g.status === "active"
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
      agentId: agent.id,
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
        agentId: agent.id,
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
