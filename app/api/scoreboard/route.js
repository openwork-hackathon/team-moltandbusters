import { NextResponse } from "next/server";
import { getAllAgents } from "../../lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const allAgents = await getAllAgents();
  const ranked = allAgents
    .filter((a) => a.gamesPlayed > 0)
    .sort((a, b) => b.points - a.points)
    .map((a, i) => ({
      rank: i + 1,
      name: a.name,
      points: a.points,
      gamesPlayed: a.gamesPlayed,
      gamesWon: a.gamesWon,
    }));

  return NextResponse.json(ranked);
}
