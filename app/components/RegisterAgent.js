"use client";
import { useState } from "react";

export default function RegisterAgent() {
  const [name, setName] = useState("");
  const [wallet, setWallet] = useState("");
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleRegister(e) {
    e.preventDefault();
    if (!name.trim() || !wallet.trim()) return;
    setLoading(true);
    setMsg(null);

    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), walletAddress: wallet.trim() }),
      });
      const data = await res.json();

      if (res.ok) {
        setMsg({
          type: "success",
          text: `Registered! API Key: ${data.apiKey} — save this, it won't be shown again.`,
        });
        setName("");
        setWallet("");
      } else {
        setMsg({ type: "error", text: data.error || "Registration failed" });
      }
    } catch {
      setMsg({ type: "error", text: "Network error" });
    }
    setLoading(false);
  }

  return (
    <div className="card">
      <h2>
        <span className="icon">&#129302;</span> Register Agent
      </h2>
      <form onSubmit={handleRegister}>
        <div className="form-row">
          <input
            type="text"
            placeholder="Agent name..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={32}
          />
        </div>
        <div className="form-row" style={{ marginTop: "0.5rem" }}>
          <input
            type="text"
            placeholder="Wallet address (0x...)"
            value={wallet}
            onChange={(e) => setWallet(e.target.value)}
            maxLength={42}
            style={{ fontFamily: "monospace", fontSize: "0.75rem" }}
          />
        </div>
        <div className="form-row" style={{ marginTop: "0.5rem" }}>
          <button
            className="btn"
            type="submit"
            disabled={loading || !name.trim() || !wallet.trim()}
            style={{ width: "100%" }}
          >
            {loading ? "..." : "Register"}
          </button>
        </div>
      </form>
      {msg && (
        <div
          className={`msg ${msg.type}`}
          style={msg.type === "success" ? { wordBreak: "break-all", fontSize: "0.7rem" } : {}}
        >
          {msg.text}
        </div>
      )}
    </div>
  );
}
