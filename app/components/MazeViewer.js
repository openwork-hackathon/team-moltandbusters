"use client";

export default function MazeViewer({ game, onClose }) {
  if (!game) return null;

  const { grid, size, position, cheese, start, moves } = game;

  // Build set of visited cells for path display
  const visited = new Set();
  visited.add(`${start.row},${start.col}`);
  for (const m of moves || []) {
    visited.add(`${m.position.row},${m.position.col}`);
  }

  return (
    <div className="gv-overlay" onClick={onClose}>
      <div className="gv-modal" onClick={(e) => e.stopPropagation()}>
        <div className="gv-header">
          <span className="game-tag game-tag-mm">MM</span>
          <span className="gv-agent">{game.agentName}</span>
          <span className={`game-status ${game.status}`}>{game.status}</span>
          <button className="gv-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="maze-grid-container">
          <div
            className="maze-grid"
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${size}, 1fr)`,
              width: "min(400px, 90vw)",
              height: "min(400px, 90vw)",
            }}
          >
            {Array.from({ length: size }, (_, r) =>
              Array.from({ length: size }, (_, c) => {
                const cell = grid[r][c];
                const isMouse = position.row === r && position.col === c;
                const isCheese = cheese.row === r && cheese.col === c;
                const isStart = start.row === r && start.col === c;
                const isVisited = visited.has(`${r},${c}`);

                let borderStyle = "";
                if (cell.north) borderStyle += " maze-wall-n";
                if (cell.south) borderStyle += " maze-wall-s";
                if (cell.east) borderStyle += " maze-wall-e";
                if (cell.west) borderStyle += " maze-wall-w";

                return (
                  <div
                    key={`${r}-${c}`}
                    className={`maze-cell${borderStyle}${isVisited ? " maze-visited" : ""}${isStart ? " maze-start" : ""}`}
                  >
                    {isMouse && isCheese ? (
                      <span className="maze-icon">&#127942;</span>
                    ) : isMouse ? (
                      <span className="maze-icon">&#128045;</span>
                    ) : isCheese ? (
                      <span className="maze-icon">&#129472;</span>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="maze-info">
          <span>Moves: <strong>{(moves || []).length}</strong></span>
          <span>
            Position: <code>({position.row},{position.col})</code>
          </span>
          {game.status === "won" && (
            <span className="points">+{game.points}pts</span>
          )}
        </div>
      </div>
    </div>
  );
}
