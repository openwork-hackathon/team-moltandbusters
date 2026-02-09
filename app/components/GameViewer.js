"use client";
import { useMemo } from "react";

export default function GameViewer({ game, onClose }) {
  const moves = game.moves || [];
  const status = game.status;
  const target = game.target;

  // Replay moves to reconstruct the narrowing range after each step
  const { cards, steps } = useMemo(() => {
    let low = 1;
    let high = 100;
    const stepsOut = [];

    for (const m of moves) {
      stepsOut.push({ guess: m.guess, result: m.result, low, high });
      if (m.result === "higher") low = m.guess + 1;
      else if (m.result === "lower") high = m.guess - 1;
    }

    // Build 10 card buckets (1-10, 11-20, ..., 91-100)
    const buckets = [];
    for (let i = 0; i < 10; i++) {
      const rs = i * 10 + 1;
      const re = (i + 1) * 10;

      const bucketGuesses = moves.filter(
        (m) => m.guess >= rs && m.guess <= re
      );
      const hasTarget = status === "won" && target >= rs && target <= re;
      const inRange = re >= low && rs <= high;
      const wasEliminated = !inRange && moves.length > 0;

      let cardState = "idle";
      if (hasTarget) cardState = "correct";
      else if (bucketGuesses.length > 0 && wasEliminated) cardState = "guessed-eliminated";
      else if (bucketGuesses.length > 0) cardState = "guessed";
      else if (wasEliminated) cardState = "eliminated";
      else if (inRange && moves.length > 0) cardState = "hot";

      buckets.push({ label: `${rs}-${re}`, cardState, bucketGuesses, hasTarget });
    }

    return { cards: buckets, steps: stepsOut };
  }, [moves, status, target]);

  return (
    <div className="gv-overlay" onClick={onClose}>
      <div className="gv-modal" onClick={(e) => e.stopPropagation()}>
        <button className="gv-close" onClick={onClose}>✕</button>

        <div className="gv-title">
          <span className="game-agent">{game.agentName}</span>
          <span className={`game-status ${status}`}>{status}</span>
          {status === "won" && (
            <span className="gv-info">
              Target: <strong>{target}</strong> &middot; {moves.length} guesses &middot;{" "}
              <span className="points">+{game.points}pts</span>
            </span>
          )}
          {status === "active" && (
            <span className="gv-info">
              {moves.length} guess{moves.length !== 1 ? "es" : ""} so far
            </span>
          )}
        </div>

        <div className="gv-cards">
          {cards.map((c) => (
            <div key={c.label} className={`gv-card gv-${c.cardState}`}>
              <div className="gv-card-range">{c.label}</div>
              {c.bucketGuesses.length > 0 && (
                <div className="gv-card-nums">
                  {c.bucketGuesses.map((m, i) => (
                    <span key={i} className={`gv-num gv-num-${m.result}`}>
                      {m.guess}
                      {m.result === "higher" && " ↑"}
                      {m.result === "lower" && " ↓"}
                      {m.result === "correct" && " ★"}
                    </span>
                  ))}
                </div>
              )}
              {c.hasTarget && (
                <div className="gv-card-star">★ {target}</div>
              )}
            </div>
          ))}
        </div>

        {steps.length > 0 && (
          <div className="gv-timeline">
            <div className="gv-timeline-label">Moves:</div>
            {steps.map((s, i) => (
              <div key={i} className={`gv-move gv-move-${s.result}`}>
                <span className="gv-move-num">#{i + 1}</span>
                <span className="gv-move-guess">{s.guess}</span>
                <span className="gv-move-dir">
                  {s.result === "higher" && "↑ higher"}
                  {s.result === "lower" && "↓ lower"}
                  {s.result === "correct" && "★ correct!"}
                </span>
                <span className="gv-move-range">[{s.low}–{s.high}]</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
