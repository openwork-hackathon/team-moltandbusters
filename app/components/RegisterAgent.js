"use client";
import { useState } from "react";

export default function RegisterAgent() {
  const [name, setName] = useState("");
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleRegister(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setMsg(null);

    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();

      if (res.ok) {
        setMsg({ type: "success", text: `Registered! Agent ID: ${data.id}` });
        setName("");
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
          <button className="btn" type="submit" disabled={loading || !name.trim()}>
            {loading ? "..." : "Register"}
          </button>
        </div>
      </form>
      {msg && <div className={`msg ${msg.type}`}>{msg.text}</div>}
    </div>
  );
}
