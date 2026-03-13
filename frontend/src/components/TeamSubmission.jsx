import React, { useState, useEffect } from "react";
import api from "../services/api";
import Card from "./Card";
import Button from "./Button";
import Swal from "sweetalert2";
import {
  FaCloudUploadAlt,
  FaFileUpload,
  FaFile,
  FaExternalLinkAlt,
  FaShieldAlt,
  FaCheckCircle,
  FaLock,
  FaLink,
} from "react-icons/fa";

const TeamSubmission = ({ team, refreshUser }) => {
  const [portals, setPortals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState({});
  const [selectedLinks, setSelectedLinks] = useState({});

  const getSubmissionType = (portal) =>
    portal?.submissionType === "link" ? "link" : "file";

  useEffect(() => {
    fetchPortals();
  }, []);

  const fetchPortals = async () => {
    try {
      const res = await api.get("/submissions/portals");
      setPortals(res.data);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (portalId) => {
    if (submitting) return;

    const portal = portals.find((item) => item._id === portalId);
    const submissionType = getSubmissionType(portal);
    const file = selectedFiles[portalId];
    const link = (selectedLinks[portalId] || "").trim();

    if (submissionType === "file" && !file) {
      return Swal.fire({
        icon: "warning",
        title: "No Data Detected",
        text: "Please select a file before submitting.",
        background: "var(--bg-secondary)",
        color: "#fff",
      });
    }

    if (submissionType === "link" && !link) {
      return Swal.fire({
        icon: "warning",
        title: "No Data Detected",
        text: "Please enter a link before submitting.",
        background: "var(--bg-secondary)",
        color: "#fff",
      });
    }

    const confirmed = await Swal.fire({
      title: "SEAL ENTRY?",
      text: "Once transmitted, this data will be locked in the encrypted vault and cannot be modified.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "TRANSMIT & LOCK",
      confirmButtonColor: "var(--accent-cyan)",
      background: "var(--bg-secondary)",
      color: "#fff",
    });

    if (!confirmed.isConfirmed) return;

    setSubmitting(true);
    try {
      if (submissionType === "file") {
        const payload = new FormData();
        payload.append("portalId", portalId);
        payload.append("file", file);

        await api.post("/submissions/submit", payload, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      } else {
        await api.post("/submissions/submit", { portalId, link });
      }

      await refreshUser();
      Swal.fire({
        icon: "success",
        title: "CONNECTION SECURED",
        text:
          submissionType === "link"
            ? "Link submitted successfully and locked."
            : "File transmitted successfully and locked.",
        background: "var(--bg-secondary)",
        color: "#fff",
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "LINK FAILURE",
        text: error.response?.data?.message || "Transmission failed.",
        background: "var(--bg-secondary)",
        color: "#fff",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const toPublicFileUrl = (rawUrl) => {
    if (!rawUrl) return null;
    if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
      return rawUrl;
    }

    const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    const origin = apiBase.replace(/\/api\/?$/, "");
    return `${origin}${rawUrl.startsWith("/") ? "" : "/"}${rawUrl}`;
  };

  const formatFileSize = (size = 0) => {
    if (!size) return "Size unavailable";
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading)
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "200px",
        }}
      >
        <div
          className="loader"
          style={{
            border: "3px solid rgba(69, 162, 158, 0.1)",
            borderTop: "3px solid var(--accent-cyan)",
            borderRadius: "50%",
            width: "40px",
            height: "40px",
            animation: "spin 1s linear infinite",
          }}
        ></div>
      </div>
    );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "2.5rem",
        maxWidth: "900px",
        margin: "0 auto",
        padding: "1rem",
      }}
    >
      {portals.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "5rem",
            background: "rgba(255,255,255,0.02)",
            borderRadius: "20px",
            border: "1px dashed rgba(255,255,255,0.1)",
          }}
        >
          <FaCloudUploadAlt
            size={70}
            style={{
              opacity: 0.1,
              marginBottom: "1.5rem",
              color: "var(--accent-cyan)",
            }}
          />
          <p style={{ color: "var(--text-muted)", letterSpacing: "2px" }}>
            NO ACTIVE UPLOAD CHANNELS DETECTED
          </p>
        </div>
      )}

      {portals.map((portal) => {
        const submission = team.submissions?.find(
          (s) => s.portalId._id === portal._id || s.portalId === portal._id,
        );
        const submissionType = getSubmissionType(portal);
        const selectedFile = selectedFiles[portal._id];
        const selectedLink = selectedLinks[portal._id] || "";
        const isDeadlinePassed = new Date() > new Date(portal.deadline);
        const isLocked = !!submission || isDeadlinePassed;

        return (
          <Card
            key={portal._id}
            style={{
              position: "relative",
              overflow: "hidden",
              background: isLocked
                ? "rgba(0, 255, 136, 0.02)"
                : "rgba(212, 175, 55, 0.02)",
              border: isLocked
                ? "1px solid rgba(0, 255, 136, 0.2)"
                : "1px solid rgba(212, 175, 55, 0.2)",
            }}
          >
            {isLocked && (
              <div
                style={{
                  position: "absolute",
                  top: "1rem",
                  right: "1rem",
                  color:
                    isDeadlinePassed && !submission
                      ? "var(--accent-danger)"
                      : "var(--accent-success)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  fontSize: "0.8rem",
                  fontWeight: 800,
                }}
              >
                {isDeadlinePassed && !submission ? <FaLock /> : <FaShieldAlt />}{" "}
                {isDeadlinePassed && !submission
                  ? "SUBMISSION LOCKED"
                  : "ENCRYPTED & SEALED"}
              </div>
            )}

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem",
              }}
            >
              <div>
                <h3
                  style={{
                    margin: 0,
                    color: isLocked
                      ? "var(--accent-success)"
                      : "var(--accent-cyan)",
                    fontSize: "1.4rem",
                    letterSpacing: "1px",
                  }}
                >
                  {portal.title.toUpperCase()}
                </h3>
                <p
                  style={{
                    color: "var(--text-muted)",
                    marginTop: "0.8rem",
                    fontSize: "1rem",
                    lineHeight: "1.6",
                  }}
                >
                  {portal.description}
                </p>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.6rem",
                    color: "var(--accent-cyan)",
                    fontSize: "0.8rem",
                    background: "rgba(69, 162, 158, 0.05)",
                    padding: "0.4rem 0.8rem",
                    borderRadius: "4px",
                    border: "1px solid rgba(69, 162, 158, 0.1)",
                  }}
                >
                  {submissionType === "link" ? <FaLink /> : <FaFileUpload />}{" "}
                  TYPE: {submissionType === "link" ? "LINK" : "FILE"}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.6rem",
                    color: isDeadlinePassed
                      ? "var(--accent-danger)"
                      : "var(--accent-cyan)",
                    fontSize: "0.8rem",
                    background: isDeadlinePassed
                      ? "rgba(255, 0, 0, 0.05)"
                      : "rgba(69, 162, 158, 0.05)",
                    padding: "0.4rem 0.8rem",
                    borderRadius: "4px",
                    border: isDeadlinePassed
                      ? "1px solid rgba(255, 0, 0, 0.1)"
                      : "1px solid rgba(69, 162, 158, 0.1)",
                  }}
                >
                  <FaFileUpload /> DEADLINE:{" "}
                  {new Date(portal.deadline).toLocaleString()}{" "}
                  {isDeadlinePassed && " - EXPIRED"}
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr",
                  gap: "1rem",
                  marginTop: "1rem",
                }}
              >
                <div
                  style={{
                    position: "relative",
                    borderRadius: "16px",
                    border: isLocked
                      ? "1px solid rgba(76, 175, 80, 0.18)"
                      : submissionType === "link"
                        ? "1px solid rgba(102, 252, 241, 0.18)"
                        : "1px dashed rgba(255, 215, 0, 0.28)",
                    background: isLocked
                      ? "linear-gradient(135deg, rgba(76, 175, 80, 0.08), rgba(255,255,255,0.02))"
                      : submissionType === "link"
                        ? "linear-gradient(135deg, rgba(69, 162, 158, 0.12), rgba(255,255,255,0.02))"
                        : "linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255,255,255,0.02))",
                    padding: "1.2rem",
                    boxShadow: isLocked
                      ? "0 10px 24px rgba(76, 175, 80, 0.08)"
                      : "0 10px 24px rgba(0, 0, 0, 0.18)",
                  }}
                >
                  <label
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--text-secondary)",
                      marginBottom: "0.6rem",
                      display: "block",
                      letterSpacing: "1px",
                    }}
                  >
                    {submissionType === "link"
                      ? isLocked
                        ? "SUBMITTED LINK"
                        : "ENTER SUBMISSION LINK"
                      : isLocked
                        ? "UPLOADED FILE"
                        : "SELECT FILE TO UPLOAD"}
                  </label>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.8rem",
                      flexWrap: "wrap",
                    }}
                  >
                    {!isLocked && submissionType === "file" && (
                      <div
                        style={{
                          width: "100%",
                          display: "grid",
                          gap: "0.9rem",
                        }}
                      >
                        <input
                          id={`submission-file-${portal._id}`}
                          type="file"
                          onChange={(e) =>
                            setSelectedFiles({
                              ...selectedFiles,
                              [portal._id]: e.target.files?.[0] || null,
                            })
                          }
                          style={{ display: "none" }}
                        />
                        <label
                          htmlFor={`submission-file-${portal._id}`}
                          style={{
                            width: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "1rem",
                            padding: "1rem 1.1rem",
                            borderRadius: "14px",
                            background: "rgba(11, 12, 16, 0.35)",
                            border: selectedFile
                              ? "1px solid rgba(255, 215, 0, 0.35)"
                              : "1px dashed rgba(255, 255, 255, 0.18)",
                            cursor: "pointer",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.9rem",
                              minWidth: 0,
                            }}
                          >
                            <div
                              style={{
                                width: "44px",
                                height: "44px",
                                borderRadius: "12px",
                                display: "grid",
                                placeItems: "center",
                                background: "rgba(255, 215, 0, 0.12)",
                                color: "var(--accent-gold)",
                                flexShrink: 0,
                              }}
                            >
                              <FaFileUpload size={18} />
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div
                                style={{
                                  color: "#fff",
                                  fontWeight: 700,
                                  letterSpacing: "0.5px",
                                  fontSize: "0.95rem",
                                }}
                              >
                                {selectedFile
                                  ? "FILE READY FOR TRANSMISSION"
                                  : "CHOOSE FILE TO UPLOAD"}
                              </div>
                              <div
                                style={{
                                  color: "var(--text-muted)",
                                  fontSize: "0.78rem",
                                  marginTop: "0.15rem",
                                }}
                              >
                                {selectedFile
                                  ? `${selectedFile.name} • ${formatFileSize(selectedFile.size)}`
                                  : "Tap here to browse and attach your final file"}
                              </div>
                            </div>
                          </div>
                          <span
                            style={{
                              color: "var(--accent-gold)",
                              fontSize: "0.75rem",
                              fontWeight: 800,
                              whiteSpace: "nowrap",
                            }}
                          >
                            BROWSE
                          </span>
                        </label>

                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: "0.8rem",
                            flexWrap: "wrap",
                            alignItems: "center",
                          }}
                        >
                          <span
                            style={{
                              color: selectedFile
                                ? "var(--accent-success)"
                                : "var(--text-muted)",
                              fontSize: "0.78rem",
                              letterSpacing: "0.5px",
                            }}
                          >
                            {selectedFile
                              ? "Selected file is staged. Submission will lock after upload."
                              : "No file selected yet."}
                          </span>
                          {selectedFile && (
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedFiles({
                                  ...selectedFiles,
                                  [portal._id]: null,
                                })
                              }
                              style={{
                                padding: "0.45rem 0.75rem",
                                fontSize: "0.72rem",
                                letterSpacing: "1px",
                                background: "rgba(255,255,255,0.04)",
                                color: "var(--text-muted)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                borderRadius: "999px",
                              }}
                            >
                              CLEAR FILE
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {!isLocked && submissionType === "link" && (
                      <div
                        style={{
                          width: "100%",
                          display: "grid",
                          gap: "0.8rem",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.8rem",
                            width: "100%",
                            background: "rgba(11, 12, 16, 0.35)",
                            border: "1px solid rgba(102, 252, 241, 0.16)",
                            padding: "0.85rem 1rem",
                            borderRadius: "14px",
                          }}
                        >
                          <FaLink
                            style={{
                              color: "var(--accent-cyan)",
                              flexShrink: 0,
                            }}
                          />
                          <input
                            type="url"
                            value={selectedLink}
                            onChange={(e) =>
                              setSelectedLinks({
                                ...selectedLinks,
                                [portal._id]: e.target.value,
                              })
                            }
                            placeholder="https://example.com/submission"
                            style={{
                              width: "100%",
                              background: "transparent",
                              color: "#fff",
                              border: "none",
                              padding: 0,
                              borderRadius: 0,
                              boxShadow: "none",
                            }}
                          />
                        </div>
                        <span
                          style={{
                            color: "var(--text-muted)",
                            fontSize: "0.78rem",
                            letterSpacing: "0.4px",
                          }}
                        >
                          Paste the final public link. It will be locked after
                          submission.
                        </span>
                      </div>
                    )}

                    {isLocked && (
                      <>
                        <div
                          style={{
                            width: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "1rem",
                            flexWrap: "wrap",
                            padding: "0.95rem 1rem",
                            borderRadius: "14px",
                            background: "rgba(0, 0, 0, 0.22)",
                            border: "1px solid rgba(76, 175, 80, 0.18)",
                          }}
                        >
                          {submissionType === "file" ? (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.75rem",
                                color: "var(--accent-success)",
                                minWidth: 0,
                              }}
                            >
                              <div
                                style={{
                                  width: "40px",
                                  height: "40px",
                                  borderRadius: "12px",
                                  display: "grid",
                                  placeItems: "center",
                                  background: "rgba(76, 175, 80, 0.12)",
                                  flexShrink: 0,
                                }}
                              >
                                <FaFile />
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <div
                                  style={{
                                    color: "#fff",
                                    fontWeight: 700,
                                    fontSize: "0.92rem",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                    maxWidth: "100%",
                                  }}
                                >
                                  {submission?.originalFileName ||
                                    "Uploaded file"}
                                </div>
                                <div
                                  style={{
                                    color: "var(--text-muted)",
                                    fontSize: "0.76rem",
                                  }}
                                >
                                  File archived and locked for this round
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.75rem",
                                color: "var(--accent-success)",
                                minWidth: 0,
                              }}
                            >
                              <div
                                style={{
                                  width: "40px",
                                  height: "40px",
                                  borderRadius: "12px",
                                  display: "grid",
                                  placeItems: "center",
                                  background: "rgba(76, 175, 80, 0.12)",
                                  flexShrink: 0,
                                }}
                              >
                                <FaLink />
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <div
                                  style={{
                                    color: "#fff",
                                    fontWeight: 700,
                                    fontSize: "0.92rem",
                                  }}
                                >
                                  Link submitted and locked
                                </div>
                                <div
                                  style={{
                                    color: "var(--text-muted)",
                                    fontSize: "0.76rem",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                    maxWidth: "100%",
                                  }}
                                >
                                  {submission?.link || "Stored submission link"}
                                </div>
                              </div>
                            </div>
                          )}
                          {(submission?.fileUrl || submission?.link) && (
                            <a
                              href={toPublicFileUrl(
                                submission.fileUrl || submission.link,
                              )}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.4rem",
                                color: "var(--accent-gold)",
                                textDecoration: "none",
                                fontWeight: 700,
                                padding: "0.55rem 0.9rem",
                                borderRadius: "999px",
                                border: "1px solid rgba(255, 215, 0, 0.2)",
                                background: "rgba(255, 215, 0, 0.08)",
                              }}
                            >
                              <FaExternalLinkAlt size={12} />
                              {submissionType === "link"
                                ? " Open Link"
                                : " View File"}
                            </a>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div style={{ marginTop: "0.5rem" }}>
                  {isDeadlinePassed && !submission ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "1rem",
                        padding: "1.5rem",
                        background: "rgba(255, 0, 0, 0.05)",
                        borderRadius: "8px",
                        border: "1px solid rgba(255, 0, 0, 0.1)",
                        color: "var(--accent-danger)",
                      }}
                    >
                      <FaLock size={24} />
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span
                          style={{
                            fontWeight: 800,
                            letterSpacing: "2px",
                            fontSize: "1rem",
                          }}
                        >
                          SUBMISSION LOCKED
                        </span>
                        <span style={{ fontSize: "0.7rem", opacity: 0.8 }}>
                          DEADLINE HAS EXPIRED - NO MORE SUBMISSIONS ALLOWED
                        </span>
                      </div>
                    </div>
                  ) : submission ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "1rem",
                        padding: "1.5rem",
                        background: "rgba(0, 255, 136, 0.05)",
                        borderRadius: "8px",
                        border: "1px solid rgba(0, 255, 136, 0.1)",
                        color: "var(--accent-success)",
                      }}
                    >
                      <FaCheckCircle size={24} />
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span
                          style={{
                            fontWeight: 800,
                            letterSpacing: "2px",
                            fontSize: "1rem",
                          }}
                        >
                          SYNCHRONIZATION COMPLETE
                        </span>
                        <span style={{ fontSize: "0.7rem", opacity: 0.8 }}>
                          {submissionType === "link"
                            ? "LINK HAS BEEN COMMITTED TO THE MAINFRAME"
                            : "FILE HAS BEEN COMMITTED TO THE MAINFRAME"}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <Button
                      onClick={() => handleSubmit(portal._id)}
                      disabled={
                        submitting ||
                        (submissionType === "file"
                          ? !selectedFiles[portal._id]
                          : !(selectedLinks[portal._id] || "").trim())
                      }
                      style={{
                        width: "100%",
                        padding: "1.2rem",
                        fontSize: "1rem",
                        fontWeight: 800,
                        letterSpacing: "3px",
                      }}
                    >
                      {submitting
                        ? "TRANSMITTING..."
                        : submissionType === "link"
                          ? "INITIATE LINK SUBMISSION"
                          : "INTIATE FILE SUBMISSION"}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default TeamSubmission;
