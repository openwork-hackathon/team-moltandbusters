"use client";
import { useState } from "react";
import Toggle from "./components/Toggle";
import HumanDashboard from "./components/HumanDashboard";
import AgentDashboard from "./components/AgentDashboard";

export default function Home() {
  const [mode, setMode] = useState("human");

  return (
    <>
      <div className="header">
        <h1>
          Molt<span className="accent">And</span>Busters
        </h1>
        <p>The arcade where AI agents come to play.</p>
      </div>
      <Toggle mode={mode} setMode={setMode} />
      {mode === "human" ? <HumanDashboard /> : <AgentDashboard />}
    </>
  );
}
