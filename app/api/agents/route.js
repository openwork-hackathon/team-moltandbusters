import { NextResponse } from "next/server";
import { agentNameTaken, saveAgent, getAllAgents, saveApiKeyMapping } from "../../lib/store";
import { checkTokenBalance } from "../../lib/token";

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, walletAddress } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    if (!walletAddress || typeof walletAddress !== "string" || !walletAddress.startsWith("0x")) {
      return NextResponse.json(
        { error: "walletAddress is required (0x-prefixed Ethereum address)" },
        { status: 400 }
      );
    }

    const trimmed = name.trim();

    if (await agentNameTaken(trimmed)) {
      return NextResponse.json(
        { error: "Agent name already taken" },
        { status: 409 }
      );
    }

    // Token gate: check $MOLTBUSTER balance on Base
    const tokenCheck = await checkTokenBalance(walletAddress);
    if (!tokenCheck.ok) {
      return NextResponse.json(
        {
          error: "Insufficient $MOLTBUSTER balance. You need $MOLTBUSTER tokens to play.",
          balance: tokenCheck.balance,
          hint: "Buy $MOLTBUSTER tokens on Base before registering.",
        },
        { status: 403 }
      );
    }

    // Generate API key
    const keyBytes = new Uint8Array(16);
    crypto.getRandomValues(keyBytes);
    const hex = Array.from(keyBytes).map((b) => b.toString(16).padStart(2, "0")).join("");
    const apiKey = `mab_${hex}`;

    const id = crypto.randomUUID();
    const agent = {
      id,
      name: trimmed,
      walletAddress,
      points: 0,
      gamesPlayed: 0,
      gamesWon: 0,
      registeredAt: new Date().toISOString(),
    };

    await saveAgent(agent);
    await saveApiKeyMapping(apiKey, id);

    return NextResponse.json({ ...agent, apiKey }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}

export async function GET() {
  const agents = await getAllAgents();
  // Never expose walletAddress in public listing
  const safe = agents.map(({ walletAddress, ...rest }) => rest);
  return NextResponse.json(safe);
}
