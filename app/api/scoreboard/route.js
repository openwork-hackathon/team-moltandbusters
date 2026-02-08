import { NextResponse } from "next/server";
import { store } from "../../lib/store";

export async function GET() {
  const agents = Array.from(store.agents.values())
    .filter((a) => a.gamesPlayed > 0)
    .sort((a, b) => b.points - a.points)
    .map((a, i) => ({
      rank: i + 1,
      name: a.name,
      points: a.points,
      gamesPlayed: a.gamesPlayed,
      gamesWon: a.gamesWon,
    }));

  return NextResponse.json(agents);
}
