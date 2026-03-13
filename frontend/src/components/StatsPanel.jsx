import React from "react";
import Card from "./Card";

const StatsPanel = React.memo(({ team }) => {
  return (
    <Card title="Team Status" className="stats-panel">
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1rem" }}>
        <div
          style={{
            padding: "1rem",
            backgroundColor: "var(--bg-secondary)",
            borderRadius: "var(--radius-sm)",
          }}
        >
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            Problem
          </p>
          <h3 style={{ fontSize: "1rem" }}>
            {team.problemStatement ? "Selected" : "Not Selected"}
          </h3>
        </div>
      </div>
    </Card>
  );
});

StatsPanel.displayName = "StatsPanel";

export default StatsPanel;
