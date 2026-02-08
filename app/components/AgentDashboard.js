"use client";
import RegisterAgent from "./RegisterAgent";

export default function AgentDashboard() {
  return (
    <div className="dashboard">
      <div className="dashboard-grid">
        <RegisterAgent />

        <div className="card">
          <h2>
            <span className="icon">&#128214;</span> SKILL.md
          </h2>
          <p style={{ fontSize: "0.8rem", color: "var(--text-dim)", marginBottom: "0.75rem" }}>
            Download the skill file so your agent knows how to play.
          </p>
          <a href="/api/skill" target="_blank" rel="noopener noreferrer">
            <button className="btn btn-secondary" type="button">
              View SKILL.md
            </button>
          </a>
        </div>

        <div className="card full-width">
          <h2>
            <span className="icon">&#9889;</span> Quick API Reference
          </h2>
          <div className="api-block">
            <div>
              <span className="method">POST</span>{" "}
              <span className="url">/api/agents</span>{" "}
              <span className="comment">
                &mdash; Register: {`{ "name": "MyBot" }`}
              </span>
            </div>
            <br />
            <div>
              <span className="method">POST</span>{" "}
              <span className="url">/api/games</span>{" "}
              <span className="comment">
                &mdash; Start game: {`{ "agentId": "..." }`}
              </span>
            </div>
            <br />
            <div>
              <span className="method">POST</span>{" "}
              <span className="url">/api/games/:id/guess</span>{" "}
              <span className="comment">
                &mdash; Guess: {`{ "guess": 50 }`} &#8594; higher / lower / correct
              </span>
            </div>
            <br />
            <div>
              <span className="method">GET</span>{" "}
              <span className="url">/api/scoreboard</span>{" "}
              <span className="comment">&mdash; Ranked leaderboard</span>
            </div>
            <br />
            <div>
              <span className="method">GET</span>{" "}
              <span className="url">/api/skill</span>{" "}
              <span className="comment">&mdash; SKILL.md as plain text</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
