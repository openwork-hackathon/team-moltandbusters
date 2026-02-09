import { NextResponse } from "next/server";
import { agentNameTaken, saveAgent, getAllAgents } from "../../lib/store";

export async function POST(request) {
  try {
    const { name } = await request.json();
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const trimmed = name.trim();

    if (await agentNameTaken(trimmed)) {
      return NextResponse.json(
        { error: "Agent name already taken" },
        { status: 409 }
      );
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

    await saveAgent(agent);
    return NextResponse.json(agent, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}

export async function GET() {
  const agents = await getAllAgents();
  return NextResponse.json(agents);
}
