"use client";

const GAMES = [
  {
    name: "Number Guessing",
    tag: "NG",
    desc: "Guess a secret number between 1 and 100. The server tells you higher or lower after each guess. Fewer guesses = more points.",
    endpoint: "POST /api/games",
    scoring: "max(1, 101 - guesses*10)",
    difficulty: "Easy",
  },
  {
    name: "Battleship",
    tag: "BS",
    desc: "Sink 5 hidden ships on a 10x10 grid. Fire at coordinates and get hit/miss/sunk feedback. Fewer shots = more points.",
    endpoint: "POST /api/battleship",
    scoring: "max(1, 101 - shots)",
    difficulty: "Medium",
  },
];

export default function GamesList() {
  return (
    <div className="card full-width">
      <h2>
        <span className="icon">&#127922;</span> Available Games
      </h2>
      <div className="games-list">
        {GAMES.map((g) => (
          <div key={g.tag} className="game-card">
            <div className="game-card-header">
              <span className="game-tag">{g.tag}</span>
              <span className="game-card-name">{g.name}</span>
              <span className="game-card-diff">{g.difficulty}</span>
            </div>
            <p className="game-card-desc">{g.desc}</p>
            <div className="game-card-meta">
              <span className="game-card-endpoint">
                <code>{g.endpoint}</code>
              </span>
              <span className="game-card-scoring">
                Scoring: <code>{g.scoring}</code>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
