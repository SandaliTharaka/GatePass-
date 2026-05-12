import React, { useEffect, useState } from "react";
import { FaTimes, FaHistory } from "react-icons/fa";
import timelineService from "../services/timelineService";

const STATUS_LABELS = {
  0: "Request creating stage",
  1: "Executive Pending",
  2: "Executive Approved",
  3: "Executive Rejected",
  4: "Verify Pending",
  5: "Verify Approved",
  6: "Verify Rejected",
  7: "Dispatch Pending",
  8: "Dispatch Approved",
  9: "Dispatch Rejected",
  10: "Receive Pending",
  11: "Received Approved",
  12: "Received Rejected",
  13: "Canceled",
};

const getStatusLabel = (code) => STATUS_LABELS[code] || `Unknown (${code})`;

const StatusTimelineModal = ({ isOpen, onClose, referenceNumber }) => {
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const getStatusBadgeClass = (code) => {
    const label = getStatusLabel(code);
    if (label.includes("Pending")) return "bg-amber-100 text-amber-800 border-amber-300";
    if (label.includes("Approved") || label.includes("Received")) return "bg-emerald-100 text-emerald-800 border-emerald-300";
    if (label.includes("Rejected")) return "bg-rose-100 text-rose-800 border-rose-300";
    if (label === "Canceled") return "bg-rose-100 text-rose-800 border-rose-300";
    return "bg-gray-100 text-gray-800 border-gray-300";
  };

  const getBorderClass = (code) => {
    const label = getStatusLabel(code);
    if (label.includes("Pending")) return "border-amber-300";
    if (label.includes("Approved") || label.includes("Received")) return "border-emerald-300";
    if (label.includes("Rejected")) return "border-rose-300";
    if (label === "Canceled") return "border-rose-300";
    return "border-gray-300";
  };

  useEffect(() => {
    if (!isOpen || !referenceNumber) return;

    const loadTimeline = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await timelineService.getStatusTimeline(referenceNumber);
        const raw = Array.isArray(data?.timeline) ? data.timeline : [];
        const filtered = raw.filter((entry) => {
          const reason = (entry?.reason || "").toString();
          const changedByName = (entry?.changedBy?.name || "").toString().toLowerCase();
          const changedByService = (entry?.changedBy?.serviceNo || "").toString().toLowerCase();
          // Exclude explicit system entries or auto-resolve reasons
          if (!reason && !changedByName && !changedByService) return true;
          if (changedByName === "system" || changedByService === "system") return false;
          if (reason.includes("auto-resolved") || reason.startsWith("[system]:") || reason.startsWith("[system]")) return false;
          return true;
        });
        setTimeline(filtered);
      } catch (err) {
        setError(
          err?.response?.data?.message || err?.message || "Failed to load timeline",
        );
      } finally {
        setLoading(false);
      }
    };

    loadTimeline();
  }, [isOpen, referenceNumber]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <FaHistory /> Status Timeline
              </h2>
              <p className="mt-1 text-blue-100">Reference: {referenceNumber}</p>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white">
              <FaTimes className="text-xl" />
            </button>
          </div>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-8">
          {loading ? (
            <p className="text-gray-600">Loading timeline...</p>
          ) : error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
              {error}
            </div>
          ) : timeline.length === 0 ? (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-blue-800">
              No status history available yet.
            </div>
          ) : (
            <div className="space-y-4">
              {timeline.map((entry, index) => (
                <div key={entry._id || index}>
                  {/* Content Card */}
                  <div className={`rounded-xl border-2 ${getBorderClass(entry.statusCode)} p-5 shadow-lg hover:shadow-xl transition-shadow bg-white`}>
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div>
                          <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold border ${getStatusBadgeClass(entry.statusCode)}`}>
                            {getStatusLabel(entry.statusCode)}
                          </span>
                          <p className="mt-2 text-xs text-gray-500 font-medium">
                            {new Date(entry.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mb-3 border-t border-gray-100 pt-3">
                        <div className="grid gap-3 text-sm text-gray-700 md:grid-cols-2">
                          <div className="rounded-lg bg-gray-50 p-2">
                            <div className="text-xs text-gray-500 font-semibold uppercase">Changed By</div>
                            <div><strong>{entry.changedBy?.name || entry.changedBy?.serviceNo || "N/A"}</strong></div>
                            <div className="text-xs text-gray-600">{entry.changedBy?.serviceNo || "N/A"}</div>
                          </div>
                          <div className="rounded-lg bg-gray-50 p-2">
                            <div className="text-xs text-gray-500 font-semibold uppercase">Role & Department</div>
                            <div><strong>{entry.changedBy?.designation || "-"}</strong></div>
                            <div className="text-xs text-gray-600">{entry.changedBy?.department || "-"}</div>
                          </div>
                        </div>
                      </div>
                      
                      {entry.reason ? (
                        <div className="mb-2 rounded-lg bg-blue-50 border border-blue-100 p-3 text-sm text-blue-900">
                          <strong className="text-blue-700">Reason/Comment:</strong>
                          <p className="mt-1">{entry.reason}</p>
                        </div>
                      ) : null}
                      
                      {/* Previous status removed to simplify timeline view */}
                      
                      <div className="mt-3 text-xs text-gray-600 font-medium italic">Timeline entry</div>
                    </div>
                  </div>
                ))}
              </div>
          )}
        </div>

        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 text-right">
          <button
            onClick={onClose}
            className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatusTimelineModal;
