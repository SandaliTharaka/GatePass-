const Request = require("../models/Request");
const Status = require("../models/Status");
const User = require("../models/User");

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

const normalizeServiceNo = (value) => String(value || "").trim();

const buildChangedBy = (serviceNo, usersMap, fallbackName = "") => {
  const normalizedServiceNo = normalizeServiceNo(serviceNo);
  if (!normalizedServiceNo || normalizedServiceNo.toLowerCase() === "system") {
    return {
      serviceNo: "System",
      name: "System",
      department: "-",
      designation: "-",
    };
  }

  const user = usersMap.get(normalizedServiceNo);
  return {
    serviceNo: normalizedServiceNo,
    name: user?.name || fallbackName || normalizedServiceNo,
    department: user?.section || user?.group || "-",
    designation: user?.designation || "-",
  };
};

const buildTimelineEntry = ({ statusCode, changedBy, reason, previousStatus, createdAt }) => ({
  statusCode,
  changedBy: changedBy || {
    serviceNo: "System",
    name: "System",
    department: "-",
    designation: "-",
  },
  reason: reason || "Status updated",
  previousStatus: previousStatus ?? null,
  createdAt: createdAt || new Date(),
  label: getStatusLabel(statusCode),
});

const toNumber = (value) => {
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
};

const buildReasonForAfterStatus = (statusCode, statusDoc, request, usersMap) => {
  if (statusDoc?.comment) return statusDoc.comment;

  if (statusCode === 10) {
    const receiverSvc = normalizeServiceNo(
      request?.receiverServiceNo || statusDoc?.recieveOfficerServiceNumber,
    );
    if (receiverSvc) {
      const receiverUser = usersMap.get(receiverSvc);
      const receiverName = receiverUser?.name || receiverSvc;
      return `Routed to receiver: ${receiverName} (${receiverSvc})`;
    }
    return "Routed to receiver";
  }

  if (statusCode === 7) return "Moved to Dispatch pending";
  if (statusCode === 8) return "Approved at Dispatch stage";
  if (statusCode === 9) return "Rejected at Dispatch stage";
  if (statusCode === 11) return "Receiver approved completion";
  if (statusCode === 12) return "Receiver rejected request";
  if (statusCode === 13) return "Request canceled";

  return `Status changed to ${getStatusLabel(statusCode)}`;
};

const getStatusTimeline = async (req, res) => {
  try {
    const { referenceNumber } = req.params;

    const request = await Request.findOne({ referenceNumber }).lean();
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    const allStatuses = await Status.find({ referenceNumber })
      .sort({ createdAt: 1, updatedAt: 1 })
      .lean();

    const serviceNos = new Set();
    serviceNos.add(normalizeServiceNo(request.employeeServiceNo));
    serviceNos.add(normalizeServiceNo(request.receiverServiceNo));
    serviceNos.add(normalizeServiceNo(request.executiveOfficerServiceNo));

    allStatuses.forEach((s) => {
      serviceNos.add(normalizeServiceNo(s.executiveOfficerServiceNo));
      serviceNos.add(normalizeServiceNo(s.verifyOfficerServiceNumber));
      serviceNos.add(normalizeServiceNo(s.pleaderServiceNo));
      serviceNos.add(normalizeServiceNo(s.recieveOfficerServiceNumber));
      serviceNos.add(normalizeServiceNo(s.rejectedByServiceNo));
    });

    const serviceNoList = Array.from(serviceNos).filter(Boolean);
    const users = await User.find({ serviceNo: { $in: serviceNoList } })
      .select("serviceNo name designation section group")
      .lean();
    const usersMap = new Map(users.map((u) => [normalizeServiceNo(u.serviceNo), u]));

    const timeline = [];
    const seenStatusCodes = new Set();

    const pushEntry = ({
      statusCode,
      serviceNo,
      fallbackName,
      reason,
      previousStatus,
      createdAt,
    }) => {
      const code = toNumber(statusCode);
      if (!code || seenStatusCodes.has(code)) return;
      seenStatusCodes.add(code);

      timeline.push(
        buildTimelineEntry({
          statusCode: code,
          changedBy: buildChangedBy(serviceNo, usersMap, fallbackName),
          reason: reason || `Moved to ${getStatusLabel(code)}`,
          previousStatus: toNumber(previousStatus),
          createdAt: createdAt || new Date(),
        }),
      );
    };

    // Requester -> Executive Pending (initial trace)
    pushEntry({
      statusCode: 1,
      serviceNo: request.employeeServiceNo,
      fallbackName: "Requester",
      reason: "Request created and sent to Executive",
      previousStatus: null,
      createdAt: request.createdAt,
    });

    allStatuses.forEach((s) => {
      const eventAt = s.updatedAt || s.createdAt || request.updatedAt || request.createdAt;

      if (toNumber(s.executiveOfficerStatus) === 2) {
        pushEntry({
          statusCode: 2,
          serviceNo: s.executiveOfficerServiceNo || request.executiveOfficerServiceNo,
          reason: s.executiveOfficerComment || "Approved by Executive",
          previousStatus: 1,
          createdAt: eventAt,
        });
      }

      if (toNumber(s.executiveOfficerStatus) === 3) {
        pushEntry({
          statusCode: 3,
          serviceNo: s.rejectedByServiceNo || s.executiveOfficerServiceNo,
          reason: s.executiveOfficerComment || "Rejected by Executive",
          previousStatus: 1,
          createdAt: eventAt,
        });
      }

      if (toNumber(s.verifyOfficerStatus) === 1) {
        pushEntry({
          statusCode: 4,
          serviceNo: s.verifyOfficerServiceNumber,
          fallbackName: "Verifier",
          reason: "Sent to Verify stage",
          previousStatus: 2,
          createdAt: eventAt,
        });
      }

      if (toNumber(s.verifyOfficerStatus) === 2) {
        pushEntry({
          statusCode: 5,
          serviceNo: s.verifyOfficerServiceNumber,
          reason: s.verifyOfficerComment || "Approved by Verifier",
          previousStatus: 4,
          createdAt: eventAt,
        });
      }

      if (toNumber(s.verifyOfficerStatus) === 3) {
        pushEntry({
          statusCode: 6,
          serviceNo: s.rejectedByServiceNo || s.verifyOfficerServiceNumber,
          reason: s.verifyOfficerComment || "Rejected by Verifier",
          previousStatus: 4,
          createdAt: eventAt,
        });
      }

      const afterStatusCode = toNumber(s.afterStatus);
      if (afterStatusCode && [7, 8, 9, 10, 11, 12, 13].includes(afterStatusCode)) {
        let serviceNoForAfter = s.rejectedByServiceNo || s.pleaderServiceNo;

        if (afterStatusCode === 7) serviceNoForAfter = s.verifyOfficerServiceNumber;
        if (afterStatusCode === 10) {
          serviceNoForAfter =
            request.receiverServiceNo || s.recieveOfficerServiceNumber || s.pleaderServiceNo;
        }
        if (afterStatusCode === 11 || afterStatusCode === 12) {
          serviceNoForAfter =
            s.recieveOfficerServiceNumber || s.rejectedByServiceNo || request.receiverServiceNo;
        }
        if (afterStatusCode === 13) {
          serviceNoForAfter = s.rejectedByServiceNo || request.employeeServiceNo;
        }

        pushEntry({
          statusCode: afterStatusCode,
          serviceNo: serviceNoForAfter,
          reason: buildReasonForAfterStatus(afterStatusCode, s, request, usersMap),
          previousStatus: s.beforeStatus,
          createdAt: eventAt,
        });
      }
    });

    // Ensure current request status is present (in case older statuses are incomplete)
    pushEntry({
      statusCode: request.status,
      serviceNo: request.receiverServiceNo || request.executiveOfficerServiceNo,
      reason: `Current request status: ${getStatusLabel(request.status)}`,
      previousStatus: null,
      createdAt: request.updatedAt || request.createdAt,
    });

    timeline.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    return res.json({
      referenceNumber,
      timeline,
    });
  } catch (error) {
    console.error("Error fetching status timeline:", error);
    return res.status(500).json({
      message: "Failed to fetch timeline",
      error: error.message,
    });
  }
};

module.exports = {
  getStatusTimeline,
};
