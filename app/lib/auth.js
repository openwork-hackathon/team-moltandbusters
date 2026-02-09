import { NextResponse } from "next/server";
import { getAgentByApiKey } from "./store";

/**
 * Extracts and validates API key from request.
 * Returns the agent object or null.
 */
export async function authenticateRequest(request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const apiKey = authHeader.slice(7).trim();
  if (!apiKey || !apiKey.startsWith("mab_")) {
    return null;
  }
  return getAgentByApiKey(apiKey);
}

/**
 * Returns a 401 JSON response.
 */
export function unauthorizedResponse(msg) {
  return NextResponse.json(
    { error: msg || "Missing or invalid API key. Include Authorization: Bearer mab_xxx" },
    { status: 401 }
  );
}
