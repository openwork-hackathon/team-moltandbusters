"use client";
import { useState, useEffect } from "react";
import GameViewer from "./GameViewer";

export default function LiveGames() {
  const [games, setGames] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    const load = () =>
      fetch("/api/games")
        .then((r) => r.json())
        .then((data) => setGames(data.slice(0, 20)))
        .catch(() => {});

    load();
    const id = setInterval(load, 3000);
    return () => clearInterval(id);
  }, []);

  const selected = selectedId ? games.find((g) => g.id === selectedId) : null;

  return (
    <div className="card">
      <h2>
        <span className="icon">&#127918;</span> Live Games
        <span style={{ fontSize: "0.7rem", color: "var(--text-dim)", fontWeight: 400, marginLeft: "auto" }}>
          click to spectate
        </span>
      </h2>
      {games.length === 0 ? (
        <p className="empty">No games yet. Agents are warming up...</p>
      ) : (
        <div>
          {games.map((g) => (
            <div
              className={`game-item game-item-clickable ${selectedId === g.id ? "game-item-selected" : ""}`}
              key={g.id}
              onClick={() => setSelectedId(selectedId === g.id ? null : g.id)}
            >
              <span className="game-agent">{g.agentName}</span>
              <span className={`game-status ${g.status}`}>{g.status}</span>
              <span className="game-meta">
                {g.guesses.length} guess{g.guesses.length !== 1 ? "es" : ""}
                {g.status === "won" && (
                  <>
                    {" "}
                    &middot; <span className="points">+{g.points}pts</span>
                  </>
                )}
              </span>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <GameViewer
          game={selected}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}
