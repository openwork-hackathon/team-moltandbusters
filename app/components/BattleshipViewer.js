"use client";
import { useMemo } from "react";

export default function BattleshipViewer({ game, onClose }) {
  const { shots = [], sunkShips = [], status, points, shotCount } = game;
  const shipsRemaining = game.shipsRemaining ?? 5;

  // Build 10x10 grid state
  const grid = useMemo(() => {
    const cells = Array.from({ length: 10 }, () =>
      Array.from({ length: 10 }, () => ({ state: "unknown" }))
    );

    // Mark sunk ship cells
    const sunkSet = new Set();
    for (const ship of sunkShips) {
      for (const cell of ship.cells) {
        sunkSet.add(`${cell.row},${cell.col}`);
        cells[cell.row][cell.col] = { state: "sunk", ship: ship.name };
      }
    }

    // Mark shots
    for (const shot of shots) {
      if (sunkSet.has(`${shot.row},${shot.col}`)) continue; // already marked sunk
      if (shot.result === "hit" || shot.result === "sunk") {
        cells[shot.row][shot.col] = { state: "hit" };
      } else {
        cells[shot.row][shot.col] = { state: "miss" };
      }
    }

    return cells;
  }, [shots, sunkShips]);

  const hits = shots.filter((s) => s.result === "hit" || s.result === "sunk").length;
  const misses = shots.filter((s) => s.result === "miss").length;

  return (
    <div className="gv-overlay" onClick={onClose}>
      <div className="gv-modal bs-modal" onClick={(e) => e.stopPropagation()}>
        <button className="gv-close" onClick={onClose}>&#10005;</button>

        <div className="gv-title">
          <span className="game-agent">{game.agentName}</span>
          <span className={`game-status ${status}`}>{status}</span>
          <span className="gv-info">
            {shotCount} shots &middot; {hits} hits &middot; {misses} misses
            {status === "won" && (
              <> &middot; <span className="points">+{points}pts</span></>
            )}
            {status === "active" && (
              <> &middot; {shipsRemaining} ships left</>
            )}
          </span>
        </div>

        {/* Column headers */}
        <div className="bs-grid-wrap">
          <div className="bs-grid">
            <div className="bs-corner"></div>
            {Array.from({ length: 10 }, (_, i) => (
              <div key={i} className="bs-col-header">{i}</div>
            ))}
            {grid.map((row, r) => (
              <div key={r} className="bs-row" style={{ display: "contents" }}>
                <div className="bs-row-header">{r}</div>
                {row.map((cell, c) => (
                  <div
                    key={c}
                    className={`bs-cell bs-${cell.state}`}
                    title={
                      cell.state === "sunk"
                        ? cell.ship
                        : cell.state === "hit"
                        ? "Hit!"
                        : cell.state === "miss"
                        ? "Miss"
                        : ""
                    }
                  >
                    {cell.state === "hit" && <span className="bs-marker">&#10006;</span>}
                    {cell.state === "miss" && <span className="bs-marker">&middot;</span>}
                    {cell.state === "sunk" && <span className="bs-marker">&#10006;</span>}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Sunk ships list */}
        {sunkShips.length > 0 && (
          <div className="bs-sunk-list">
            <div className="gv-timeline-label">Sunk:</div>
            <div className="bs-sunk-chips">
              {sunkShips.map((s) => (
                <span key={s.name} className="bs-sunk-chip">
                  {s.name} ({s.size})
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Recent shots timeline */}
        {shots.length > 0 && (
          <div className="gv-timeline">
            <div className="gv-timeline-label">
              Last {Math.min(shots.length, 10)} shots:
            </div>
            {shots.slice(-10).reverse().map((s, i) => (
              <div key={i} className={`gv-move gv-move-${s.result === "miss" ? "lower" : "correct"}`}>
                <span className="gv-move-num">#{shots.length - i}</span>
                <span className="gv-move-guess">({s.row},{s.col})</span>
                <span className="gv-move-dir">
                  {s.result === "miss" && "~ miss"}
                  {s.result === "hit" && "&#10006; hit!"}
                  {s.result === "sunk" && "&#128165; sunk!"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
