"use client";
import { useState, useEffect } from "react";
import GameViewer from "./GameViewer";
import BattleshipViewer from "./BattleshipViewer";
import MazeViewer from "./MazeViewer";

export default function LiveGames() {
  const [guessGames, setGuessGames] = useState([]);
  const [bsGames, setBsGames] = useState([]);
  const [mazeGames, setMazeGames] = useState([]);
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
      fetch("/api/mousemaze")
        .then((r) => r.json())
        .then((data) => setMazeGames(data.slice(0, 20)))
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
    ...mazeGames.map((g) => ({ ...g, _type: "mousemaze" })),
  ].sort((a, b) => {
    // Active games first, then by most recent
    if (a.status === "active" && b.status !== "active") return -1;
    if (a.status !== "active" && b.status === "active") return 1;
    return new Date(b.startedAt) - new Date(a.startedAt);
  });

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

  function getTag(type) {
    if (type === "battleship") return { label: "BS", cls: "game-tag-bs" };
    if (type === "mousemaze") return { label: "MM", cls: "game-tag-mm" };
    return { label: "NG", cls: "game-tag-ng" };
  }

  function getMeta(g) {
    if (g._type === "battleship") {
      return (
        <>
          {g.shotCount} shot{g.shotCount !== 1 ? "s" : ""}
          {g.status === "active" && <> &middot; {g.shipsRemaining} ships left</>}
        </>
      );
    }
    if (g._type === "mousemaze") {
      return (
        <>
          {g.moveCount} move{g.moveCount !== 1 ? "s" : ""}
        </>
      );
    }
    return (
      <>
        {g.guesses.length} guess{g.guesses.length !== 1 ? "es" : ""}
      </>
    );
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
          {allGames.map((g) => {
            const tag = getTag(g._type);
            return (
              <div
                className={`game-item game-item-clickable ${selectedId === g.id ? "game-item-selected" : ""}`}
                key={g.id}
                onClick={() => handleClick(g)}
              >
                <span className={`game-tag ${tag.cls}`}>{tag.label}</span>
                <span className="game-agent">{g.agentName}</span>
                <span className={`game-status ${g.status}`}>{g.status}</span>
                <span className="game-meta">
                  {getMeta(g)}
                  {g.status === "won" && (
                    <>
                      {" "}&middot; <span className="points">+{g.points}pts</span>
                    </>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {selectedGame && selectedType === "guess" && (
        <GameViewer game={selectedGame} onClose={() => setSelectedId(null)} />
      )}
      {selectedGame && selectedType === "battleship" && (
        <BattleshipViewer game={selectedGame} onClose={() => setSelectedId(null)} />
      )}
      {selectedGame && selectedType === "mousemaze" && (
        <MazeViewer game={selectedGame} onClose={() => setSelectedId(null)} />
      )}
    </div>
  );
}
