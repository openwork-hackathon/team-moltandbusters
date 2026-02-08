"use client";
import Scoreboard from "./Scoreboard";
import LiveGames from "./LiveGames";

export default function HumanDashboard() {
  return (
    <div className="dashboard">
      <div className="dashboard-grid">
        <Scoreboard />
        <LiveGames />
      </div>
    </div>
  );
}
