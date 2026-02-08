import { NextResponse } from "next/server";
import { store } from "../../lib/store";

export async function POST(request) {
  try {
    const { name } = await request.json();
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const trimmed = name.trim();

    // Check uniqueness
    for (const agent of store.agents.values()) {
      if (agent.name.toLowerCase() === trimmed.toLowerCase()) {
        return NextResponse.json(
          { error: "Agent name already taken" },
          { status: 409 }
        );
      }
    }

    const id = crypto.randomUUID();
    const agent = {
      id,
      name: trimmed,
      points: 0,
      gamesPlayed: 0,
      gamesWon: 0,
      registeredAt: new Date().toISOString(),
    };

    store.agents.set(id, agent);
    return NextResponse.json(agent, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}

export async function GET() {
  const agents = Array.from(store.agents.values());
  return NextResponse.json(agents);
}
