import React, { useEffect, useState } from "react";
import { FaTimes, FaHistory, FaCheck } from "react-icons/fa";
import timelineService from "../services/timelineService";

const STATUS_LABELS = {
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

  useEffect(() => {
    if (!isOpen || !referenceNumber) return;

    const loadTimeline = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await timelineService.getStatusTimeline(referenceNumber);
        setTimeline(Array.isArray(data?.timeline) ? data.timeline : []);
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
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
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

        <div className="max-h-[70vh] overflow-y-auto p-6">
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
                <div key={entry._id || index} className="rounded-xl border border-gray-200 p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-800">
                      {getStatusLabel(entry.statusCode)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(entry.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="grid gap-2 text-sm text-gray-700 md:grid-cols-2">
                    <div>
                      <div><strong>Name:</strong> {entry.changedBy?.name || entry.changedBy?.serviceNo || "N/A"}</div>
                      <div><strong>Service No:</strong> {entry.changedBy?.serviceNo || "N/A"}</div>
                    </div>
                    <div>
                      <div><strong>Department:</strong> {entry.changedBy?.department || "-"}</div>
                      <div><strong>Designation:</strong> {entry.changedBy?.designation || "-"}</div>
                    </div>
                  </div>
                  {entry.reason ? (
                    <div className="mt-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                      <strong>Reason:</strong> {entry.reason}
                    </div>
                  ) : null}
                  {entry.previousStatus != null ? (
                    <div className="mt-2 text-xs text-gray-500">
                      Previous Status: {getStatusLabel(entry.previousStatus)}
                    </div>
                  ) : null}
                  <div className="mt-3 flex items-center gap-2 text-xs text-emerald-700">
                    <FaCheck /> Timeline entry
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 text-right">
          <button
            onClick={onClose}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatusTimelineModal;
