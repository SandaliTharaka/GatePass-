const Notification = require("../models/Notification");
const Status = require("../models/Status");
const { getUserWithERPData } = require("../utils/userHelpers");
const { getAzureUserData } = require("../utils/azureUserCache");

const normalizeString = (value) => String(value || "").trim();

const serviceNoVariants = (serviceNo) => {
  const raw = normalizeString(serviceNo);
  if (!raw) return [];

  const upper = raw.toUpperCase();
  const noLeadingZeros = upper.replace(/^0+/, "") || upper;
  const variants = new Set([upper, noLeadingZeros]);

  if (/^\d+$/.test(noLeadingZeros)) {
    [4, 5, 6, 7, 8].forEach((length) => {
      variants.add(noLeadingZeros.padStart(length, "0"));
    });
  }

  return Array.from(variants);
};

const buildAudienceFilter = (user = {}) => {
  const serviceNo = normalizeString(user.serviceNo || user.userId);
  const serviceVariants = serviceNoVariants(serviceNo);
  const role = normalizeString(user.role);
  const branches = Array.isArray(user.branches)
    ? user.branches.map(normalizeString).filter(Boolean)
    : [];

  const audience = [];
  if (serviceVariants.length) {
    audience.push({ recipientServiceNo: { $in: serviceVariants } });
  }
  if (role) audience.push({ recipientRole: role });
  if (branches.length) audience.push({ branch: { $in: branches } });

  if (!audience.length) return null;

  return {
    $and: [
      { $or: audience },
      serviceNo ? { deletedBy: { $ne: serviceNo } } : {},
    ],
  };
};

const getActionPath = (type) => {
  const paths = {
    approval: "/executiveApproval",
    rejected: "/myrequests",
    completed: "/myrequests",
    warning: "/myrequests",
    info: "/myrequests",
  };

  return paths[type] || "/myrequests";
};

const getPersonSummary = async (serviceNo) => {
  const fallback = {
    serviceNo: normalizeString(serviceNo) || "-",
    name: "Unknown employee",
    department: "-",
  };

  if (!serviceNo) return fallback;

  const user = await getUserWithERPData(serviceNo, true);
  if (!user) {
    try {
      const azureUser = await getAzureUserData(serviceNo, true);
      if (!azureUser) return fallback;

      return {
        serviceNo,
        name:
          azureUser.name ||
          azureUser.displayName ||
          azureUser.employeeName ||
          "Unknown employee",
        department:
          azureUser.department ||
          azureUser.section ||
          azureUser.officeLocation ||
          azureUser.jobTitle ||
          "-",
      };
    } catch (error) {
      return fallback;
    }
  }

  return {
    serviceNo: user.serviceNo || serviceNo,
    name: user.name || user.displayName || user.fullName || "Unknown employee",
    department:
      user.department ||
      user.section ||
      user.group ||
      user.costCenter ||
      user.designation ||
      "-",
  };
};

const getLatestStatus = async (request) => {
  const referenceNumber = request.referenceNumber || request.refNo;
  if (!referenceNumber) return null;

  return await Status.findOne({ referenceNumber })
    .sort({ updatedAt: -1, createdAt: -1 })
    .lean();
};

const uniqueAudiences = (audiences) => {
  const seen = new Set();
  return audiences.filter((audience) => {
    const key = [
      audience.recipientServiceNo || "",
      audience.recipientRole || "",
      audience.branch || "",
    ].join("|");
    if (!key.replace(/\|/g, "")) return false;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const serviceNoAudiences = (serviceNumbers = []) =>
  serviceNumbers.filter(Boolean).map((serviceNo) => ({
    recipientServiceNo: normalizeString(serviceNo),
  }));

const buildRequestDetails = async (request) => {
  const referenceNumber = request.referenceNumber || request.refNo;
  const requester = await getPersonSummary(request.employeeServiceNo);
  const from = request.outLocation || "-";
  const to = request.isNonSltPlace
    ? request.companyName || "External organization"
    : request.inLocation || "-";

  const itemCount = Array.isArray(request.items) ? request.items.length : 0;
  const itemText = itemCount === 1 ? "1 item" : `${itemCount} items`;

  return {
    referenceNumber,
    requester,
    from,
    to,
    itemText,
  };
};

const formatMessage = (details, actionText) =>
  `${actionText}. Ref: ${details.referenceNumber}. Requester: ${details.requester.serviceNo} - ${details.requester.name}. Department: ${details.requester.department}. From: ${details.from}. To: ${details.to}. Items: ${details.itemText}.`;

const buildRequestNotification = async (
  request,
  eventType = "request-updated",
  actorRole = "",
) => {
  const details = await buildRequestDetails(request);

  const templates = {
    "new-request": {
      title: "New gate pass request",
      message: formatMessage(details, "A new request needs your approval"),
      type: "approval",
      actionPath: "/executiveApproval",
    },
    "request-approved": {
      title:
        actorRole === "Verifier"
          ? "Request ready for dispatch"
          : actorRole === "Pleader"
            ? "Request ready to receive"
            : "Request ready for verification",
      message: formatMessage(
        details,
        actorRole === "Verifier"
          ? "A verified request needs dispatch approval"
          : actorRole === "Pleader"
            ? "A dispatched request is ready for receiving"
            : "An executive approved request needs verification",
      ),
      type: "approval",
      actionPath:
        actorRole === "Verifier"
          ? "/dispatch"
          : actorRole === "Pleader"
            ? "/receive"
            : "/verify",
    },
    "request-rejected": {
      title: "Gate pass rejected",
      message: formatMessage(details, "Your request was rejected"),
      type: "rejected",
      actionPath: "/myrequests",
    },
    "request-completed": {
      title: "Gate pass completed",
      message: formatMessage(details, "Your request has been completed"),
      type: "completed",
      actionPath: "/myrequests",
    },
    "ready-for-receiving": {
      title: "Request ready to receive",
      message: formatMessage(details, "A dispatched request is ready for receiving"),
      type: "approval",
      actionPath: "/receive",
    },
    "request-updated": {
      title: "Gate pass updated",
      message: formatMessage(details, "A request has been updated"),
      type: "info",
      actionPath: "/myrequests",
    },
  };

  const template = templates[eventType] || templates["request-updated"];

  return {
    ...template,
    referenceNumber: details.referenceNumber,
    requestId: request._id,
    eventKey: `${eventType}-${details.referenceNumber}-${Date.now()}`,
  };
};

const buildWorkflowNotificationPlan = async (
  request,
  eventType = "request-updated",
  actorRole = "",
) => {
  const notification = await buildRequestNotification(
    request,
    eventType,
    actorRole,
  );
  const latestStatus = await getLatestStatus(request);
  const audiences = [];

  if (eventType === "new-request") {
    audiences.push({ recipientServiceNo: request.executiveOfficerServiceNo });
    // --- ADDITION FOR TESTING & BROADCASTING ---
    // 1. Send it to the original creator so they see it successfully created
    if (request.employeeServiceNo) {
      audiences.push({ recipientServiceNo: request.employeeServiceNo });
    }
    // 2. Send it to all users with "Approver" role (in case the specific service No is missed)
    audiences.push({ recipientRole: "Approver" });
    // -------------------------------------------
  } else if (eventType === "request-approved") {
    if (actorRole === "Approver") {
      audiences.push(
        ...serviceNoAudiences([
          ...(latestStatus?.outPLeaders || []),
          ...(latestStatus?.outSecurity || []),
        ]),
      );
    } else if (actorRole === "Verifier") {
      audiences.push(
        ...serviceNoAudiences([
          ...(latestStatus?.inPLeaders || []),
          ...(latestStatus?.inSecurity || []),
        ]),
      );
    } else if (actorRole === "Pleader") {
      if (request.receiverServiceNo) {
        audiences.push({ recipientServiceNo: request.receiverServiceNo });
      } else if (request.inLocation) {
        audiences.push({ branch: request.inLocation });
      }
    } else {
      audiences.push({ recipientServiceNo: request.employeeServiceNo });
    }
  } else if (eventType === "ready-for-receiving") {
    if (request.receiverServiceNo) {
      audiences.push({ recipientServiceNo: request.receiverServiceNo });
    } else if (request.inLocation) {
      audiences.push({ branch: request.inLocation });
    }
  } else if (
    eventType === "request-rejected" ||
    eventType === "request-completed"
  ) {
    audiences.push({ recipientServiceNo: request.employeeServiceNo });
  } else {
    audiences.push({ recipientServiceNo: request.employeeServiceNo });
  }

  return {
    notification,
    audiences: uniqueAudiences(audiences),
  };
};

const createNotification = async (notification) => {
  const doc = await Notification.create({
    ...notification,
    actionPath: notification.actionPath || getActionPath(notification.type),
  });

  return doc.toObject();
};

const createAudienceNotification = async (io, audience, notification) => {
  const target = normalizeString(
    audience.recipientServiceNo || audience.recipientRole || audience.branch,
  );
  if (!target) return null;

  const doc = await createNotification({
    ...notification,
    recipientServiceNo: audience.recipientServiceNo,
    recipientRole: audience.recipientRole,
    branch: audience.branch,
  });

  const payload = {
    ...doc,
    id: doc._id,
    createdAt: doc.createdAt,
  };

  if (io) {
    if (audience.recipientServiceNo) {
      serviceNoVariants(audience.recipientServiceNo).forEach((serviceNo) => {
        io.to(`user-${serviceNo}`).emit("notification", payload);
      });
    }
    if (audience.recipientRole) {
      io.to(`role-${audience.recipientRole}`).emit("notification", payload);
    }
    if (audience.branch) {
      io.to(`branch-${audience.branch}`).emit("notification", payload);
    }
  }

  return doc;
};

const getNotificationsForUser = async (user, { limit = 30 } = {}) => {
  const filter = buildAudienceFilter(user);
  if (!filter) return [];

  const serviceNo = normalizeString(user.serviceNo);
  const notifications = await Notification.find(filter)
    .sort({ createdAt: -1 })
    .limit(Number(limit) || 30)
    .lean();

  const deduped = [];
  const seen = new Set();

  notifications.forEach((notification) => {
    const key =
      notification.eventKey ||
      `${notification.referenceNumber}-${notification.title}-${notification.message}`;
    if (seen.has(key)) return;
    seen.add(key);
    deduped.push(notification);
  });

  return deduped.map((notification) => ({
    ...notification,
    id: notification._id,
    isRead:
      notification.isRead ||
      (serviceNo && notification.readBy?.includes(serviceNo)),
  }));
};

const countUnreadForUser = async (user) => {
  const notifications = await getNotificationsForUser(user, { limit: 100 });
  return notifications.filter((notification) => !notification.isRead).length;
};

const markNotificationAsRead = async (notificationId, user) => {
  const serviceNo = normalizeString(user.serviceNo);
  const filter = buildAudienceFilter(user);
  if (!serviceNo) return null;

  return await Notification.findOneAndUpdate(
    { _id: notificationId, ...(filter || {}) },
    { $addToSet: { readBy: serviceNo } },
    { new: true },
  ).lean();
};

const markAllNotificationsAsRead = async (user) => {
  const filter = buildAudienceFilter(user);
  const serviceNo = normalizeString(user.serviceNo);
  if (!filter || !serviceNo) return { modifiedCount: 0 };

  return await Notification.updateMany(filter, {
    $addToSet: { readBy: serviceNo },
  });
};

const deleteNotificationForUser = async (notificationId, user) => {
  const serviceNo = normalizeString(user.serviceNo);
  const filter = buildAudienceFilter(user);
  if (!serviceNo) return null;

  return await Notification.findOneAndUpdate(
    { _id: notificationId, ...(filter || {}) },
    { $addToSet: { deletedBy: serviceNo } },
    { new: true },
  ).lean();
};

module.exports = {
  buildRequestNotification,
  buildWorkflowNotificationPlan,
  createAudienceNotification,
  createNotification,
  getNotificationsForUser,
  countUnreadForUser,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotificationForUser,
};
