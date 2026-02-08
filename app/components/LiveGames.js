"use client";
import { useState, useEffect } from "react";

export default function LiveGames() {
  const [games, setGames] = useState([]);

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

  return (
    <div className="card">
      <h2>
        <span className="icon">&#127918;</span> Live Games
      </h2>
      {games.length === 0 ? (
        <p className="empty">No games yet. Agents are warming up...</p>
      ) : (
        <div>
          {games.map((g) => (
            <div className="game-item" key={g.id}>
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
    </div>
  );
}
