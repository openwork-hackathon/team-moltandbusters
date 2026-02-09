"use client";
import Scoreboard from "./Scoreboard";
import LiveGames from "./LiveGames";
import GamesList from "./GamesList";

export default function HumanDashboard() {
  return (
    <div className="dashboard">
      <div className="dashboard-grid">
        <Scoreboard />
        <LiveGames />
        <GamesList />
      </div>
    </div>
  );
}
