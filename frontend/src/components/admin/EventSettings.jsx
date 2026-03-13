import React from "react";
import api from "../../services/api";
import Button from "../Button";
import { FaCog, FaSave } from "react-icons/fa";
import AdminMembers from "./AdminMembers";

const EventSettings = () => {
  const [eventName, setEventName] = React.useState("");
  const [registrationOpen, setRegistrationOpen] = React.useState(true);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [savingRegistration, setSavingRegistration] = React.useState(false);
  const [message, setMessage] = React.useState("");

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get("/settings");
        if (mounted) {
          setEventName(res.data?.eventName || "");
          setRegistrationOpen(res.data?.registrationOpen !== false);
        }
      } catch (e) {
        // no-op
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const onSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      await api.put("/settings/event-name", { eventName });
      setMessage("Event name updated successfully.");
    } catch (e) {
      setMessage("Failed to update.");
    } finally {
      setSaving(false);
    }
  };

  const toggleRegistrationAccess = async () => {
    setSavingRegistration(true);
    setMessage("");
    const nextState = !registrationOpen;
    try {
      const res = await api.put("/settings/registration-access", {
        isOpen: nextState,
      });
      setRegistrationOpen(res.data?.registrationOpen !== false);
      setMessage(
        nextState
          ? "Registration portal opened successfully."
          : "Registration portal closed successfully.",
      );
    } catch (e) {
      setMessage("Failed to update registration portal status.");
    } finally {
      setSavingRegistration(false);
    }
  };

  return (
    <div className="card">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.6rem",
          marginBottom: "1rem",
        }}
      >
        <FaCog style={{ color: "var(--accent-red)" }} />
        <h3 style={{ margin: 0 }}>Event Settings</h3>
      </div>
      {loading ? (
        <p style={{ color: "var(--text-muted)" }}>Loading...</p>
      ) : (
        <>
          <div
            style={{
              display: "flex",
              gap: "1rem",
              alignItems: "center",
              flexWrap: "wrap",
              marginBottom: "1rem",
            }}
          >
            <input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="Enter event name (e.g., Hackathon 2026)"
              style={{
                padding: "0.8rem 1rem",
                minWidth: "320px",
                borderRadius: "8px",
              }}
            />
            <Button
              onClick={onSave}
              disabled={saving}
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <FaSave /> {saving ? "Saving..." : "Save"}
            </Button>
            {message && (
              <span style={{ color: "var(--text-muted)" }}>{message}</span>
            )}
          </div>

          <div
            style={{
              display: "flex",
              gap: "1rem",
              alignItems: "center",
              flexWrap: "wrap",
              marginBottom: "1.5rem",
              padding: "1rem",
              borderRadius: "10px",
              border: `1px solid ${registrationOpen ? "rgba(76,175,80,0.35)" : "rgba(244,67,54,0.35)"}`,
              background: registrationOpen
                ? "rgba(76,175,80,0.08)"
                : "rgba(244,67,54,0.08)",
            }}
          >
            <div style={{ minWidth: "260px" }}>
              <p style={{ margin: 0, fontWeight: 700, color: "#fff" }}>
                Registration Portal: {registrationOpen ? "OPEN" : "CLOSED"}
              </p>
              <p
                style={{
                  margin: "0.35rem 0 0 0",
                  color: "var(--text-muted)",
                  fontSize: "0.85rem",
                }}
              >
                {registrationOpen
                  ? "Teams can submit new registrations now."
                  : "New team registrations are blocked."}
              </p>
            </div>
            <Button
              onClick={toggleRegistrationAccess}
              disabled={savingRegistration}
              variant={registrationOpen ? "secondary" : "primary"}
            >
              {savingRegistration
                ? "Updating..."
                : registrationOpen
                  ? "Close Registration"
                  : "Open Registration"}
            </Button>
          </div>

          {/* Admin Members Management */}
          <AdminMembers />
        </>
      )}
    </div>
  );
};

export default EventSettings;
