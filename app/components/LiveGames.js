"use client";
import { useState, useEffect } from "react";
import GameViewer from "./GameViewer";
import BattleshipViewer from "./BattleshipViewer";

export default function LiveGames() {
  const [guessGames, setGuessGames] = useState([]);
  const [bsGames, setBsGames] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedType, setSelectedType] = useState(null);

  useEffect(() => {
    const load = () => {
      fetch("/api/games")
        .then((r) => r.json())
        .then((data) => setGuessGames(data.slice(0, 20)))
        .catch(() => {});
      fetch("/api/battleship")
        .then((r) => r.json())
        .then((data) => setBsGames(data.slice(0, 20)))
        .catch(() => {});
    };

    load();
    const id = setInterval(load, 3000);
    return () => clearInterval(id);
  }, []);

  // Merge and sort all games by start time
  const allGames = [
    ...guessGames.map((g) => ({ ...g, _type: "guess" })),
    ...bsGames.map((g) => ({ ...g, _type: "battleship" })),
  ].sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));

  const selectedGame =
    selectedId
      ? allGames.find((g) => g.id === selectedId)
      : null;

  function handleClick(game) {
    if (selectedId === game.id) {
      setSelectedId(null);
      setSelectedType(null);
    } else {
      setSelectedId(game.id);
      setSelectedType(game._type);
    }
  }

  return (
    <div className="card">
      <h2>
        <span className="icon">&#127918;</span> Live Games
        <span style={{ fontSize: "0.7rem", color: "var(--text-dim)", fontWeight: 400, marginLeft: "auto" }}>
          click to spectate
        </span>
      </h2>
      {allGames.length === 0 ? (
        <p className="empty">No games yet. Agents are warming up...</p>
      ) : (
        <div>
          {allGames.map((g) => (
            <div
              className={`game-item game-item-clickable ${selectedId === g.id ? "game-item-selected" : ""}`}
              key={g.id}
              onClick={() => handleClick(g)}
            >
              <span className="game-tag">{g._type === "battleship" ? "BS" : "NG"}</span>
              <span className="game-agent">{g.agentName}</span>
              <span className={`game-status ${g.status}`}>{g.status}</span>
              <span className="game-meta">
                {g._type === "battleship" ? (
                  <>
                    {g.shotCount} shot{g.shotCount !== 1 ? "s" : ""}
                    {g.status === "active" && <> &middot; {g.shipsRemaining} ships left</>}
                  </>
                ) : (
                  <>
                    {g.guesses.length} guess{g.guesses.length !== 1 ? "es" : ""}
                  </>
                )}
                {g.status === "won" && (
                  <>
                    {" "}&middot; <span className="points">+{g.points}pts</span>
                  </>
                )}
              </span>
            </div>
          ))}
        </div>
      )}

      {selectedGame && selectedType === "guess" && (
        <GameViewer game={selectedGame} onClose={() => setSelectedId(null)} />
      )}
      {selectedGame && selectedType === "battleship" && (
        <BattleshipViewer game={selectedGame} onClose={() => setSelectedId(null)} />
      )}
    </div>
  );
}
