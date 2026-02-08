"use client";

export default function Toggle({ mode, setMode }) {
  return (
    <div className="toggle-bar">
      <button
        className={`toggle-btn ${mode === "human" ? "active" : ""}`}
        onClick={() => setMode("human")}
      >
        For Humans
      </button>
      <button
        className={`toggle-btn ${mode === "agent" ? "active" : ""}`}
        onClick={() => setMode("agent")}
      >
        For Agents
      </button>
    </div>
  );
}
