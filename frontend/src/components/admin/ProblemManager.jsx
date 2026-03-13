import React, { useState } from "react";
import api from "../../services/api";
import Card from "../Card";
import Button from "../Button";
import Input from "../Input";
import Swal from "sweetalert2";

const ProblemManager = () => {
  const [formData, setFormData] = useState({
    title: "",
    domain: "",
    difficulty: "Medium",
    description: "",
  });
  const [problemStatementsOpen, setProblemStatementsOpen] = useState(true);
  const [accessLoading, setAccessLoading] = useState(true);
  const [savingAccess, setSavingAccess] = useState(false);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get("/settings");
        if (mounted) {
          setProblemStatementsOpen(res.data?.problemStatementsOpen !== false);
        }
      } catch (error) {
        // no-op
      } finally {
        if (mounted) setAccessLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/problems", formData);
      Swal.fire({
        icon: "success",
        title: "Problem Deployed",
        text: "The problem statement is now live.",
        background: "var(--bg-secondary)",
        color: "#fff",
      });
      setFormData({
        title: "",
        domain: "",
        difficulty: "Medium",
        description: "",
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Deployment Failed",
        text: "Could not add problem.",
        background: "var(--bg-secondary)",
        color: "#fff",
      });
    }
  };

  const toggleProblemStatementsAccess = async () => {
    const nextState = !problemStatementsOpen;
    const result = await Swal.fire({
      icon: "warning",
      title: nextState
        ? "Open Problem Statements?"
        : "Close Problem Statements?",
      text: nextState
        ? "Teams will be able to view and select problem statements."
        : "Teams will no longer be able to view or select problem statements.",
      showCancelButton: true,
      confirmButtonText: nextState ? "Open" : "Close",
      background: "var(--bg-secondary)",
      color: "#fff",
    });

    if (!result.isConfirmed) return;

    setSavingAccess(true);
    try {
      const res = await api.put("/settings/problem-statements-access", {
        isOpen: nextState,
      });
      setProblemStatementsOpen(res.data?.problemStatementsOpen !== false);
      Swal.fire({
        icon: "success",
        title: nextState
          ? "Problem Statements Opened"
          : "Problem Statements Closed",
        background: "var(--bg-secondary)",
        color: "#fff",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: "Could not change problem statement access.",
        background: "var(--bg-secondary)",
        color: "#fff",
      });
    } finally {
      setSavingAccess(false);
    }
  };

  return (
    <Card title="Add Problem Statement">
      <div
        style={{
          marginBottom: "1.5rem",
          padding: "1rem",
          borderRadius: "8px",
          border: `1px solid ${problemStatementsOpen ? "rgba(76,175,80,0.4)" : "rgba(244,67,54,0.4)"}`,
          background: problemStatementsOpen
            ? "rgba(76,175,80,0.08)"
            : "rgba(244,67,54,0.08)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          <div>
            <p style={{ margin: 0, color: "#fff", fontWeight: 700 }}>
              Problem Statements: {problemStatementsOpen ? "OPEN" : "CLOSED"}
            </p>
            <p
              style={{
                margin: "0.3rem 0 0 0",
                color: "var(--text-muted)",
                fontSize: "0.85rem",
              }}
            >
              {problemStatementsOpen
                ? "Teams can currently view and select objectives."
                : "Teams cannot view or select objectives right now."}
            </p>
          </div>
          <Button
            type="button"
            onClick={toggleProblemStatementsAccess}
            disabled={accessLoading || savingAccess}
            variant={problemStatementsOpen ? "secondary" : "primary"}
          >
            {savingAccess
              ? "Updating..."
              : problemStatementsOpen
                ? "Close Problem Statements"
                : "Open Problem Statements"}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Input
          label="Title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
        />
        <Input
          label="Domain"
          name="domain"
          value={formData.domain}
          onChange={handleChange}
          required
          placeholder="e.g. AI/ML, Web3"
        />

        <div style={{ marginBottom: "1rem" }}>
          <label
            style={{
              display: "block",
              marginBottom: "0.5rem",
              color: "var(--text-secondary)",
            }}
          >
            Difficulty
          </label>
          <select
            name="difficulty"
            value={formData.difficulty}
            onChange={handleChange}
            style={{
              width: "100%",
              padding: "0.75rem",
              borderRadius: "4px",
              backgroundColor: "var(--bg-secondary)",
              color: "white",
              border: "1px solid var(--border-color)",
            }}
          >
            <option>Easy</option>
            <option>Medium</option>
            <option>Hard</option>
          </select>
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label
            style={{
              display: "block",
              marginBottom: "0.5rem",
              color: "var(--text-secondary)",
            }}
          >
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows="4"
            style={{
              width: "100%",
              padding: "0.75rem",
              borderRadius: "4px",
              backgroundColor: "var(--bg-secondary)",
              color: "white",
              border: "1px solid var(--border-color)",
            }}
          />
        </div>

        <Button type="submit">Add Problem</Button>
      </form>
    </Card>
  );
};

export default ProblemManager;
