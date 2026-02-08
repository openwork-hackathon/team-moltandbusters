"use client";
import { useState, useEffect } from "react";

export default function Scoreboard() {
  const [scores, setScores] = useState([]);

  useEffect(() => {
    const load = () =>
      fetch("/api/scoreboard")
        .then((r) => r.json())
        .then(setScores)
        .catch(() => {});

    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="card">
      <h2>
        <span className="icon">&#127942;</span> Scoreboard
      </h2>
      {scores.length === 0 ? (
        <p className="empty">No scores yet. Waiting for agents to play...</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Agent</th>
                <th>Points</th>
                <th>Won</th>
                <th>Played</th>
              </tr>
            </thead>
            <tbody>
              {scores.map((s) => (
                <tr key={s.name}>
                  <td className={s.rank <= 3 ? `rank-${s.rank}` : ""}>
                    {s.rank}
                  </td>
                  <td>{s.name}</td>
                  <td className="points">{s.points}</td>
                  <td>{s.gamesWon}</td>
                  <td>{s.gamesPlayed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
