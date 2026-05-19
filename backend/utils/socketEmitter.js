const {
  buildWorkflowNotificationPlan,
  createAudienceNotification,
} = require("../services/notificationService");

const queueAudienceNotifications = (io, request, eventType, actorRole = "") => {
  if (!io || !request) return;

  buildWorkflowNotificationPlan(request, eventType, actorRole)
    .then(({ notification, audiences }) => {
      if (!audiences.length) {
        console.warn("No notification audience resolved:", {
          eventType,
          actorRole,
          referenceNumber: request.referenceNumber || request.refNo,
          executiveOfficerServiceNo: request.executiveOfficerServiceNo,
          employeeServiceNo: request.employeeServiceNo,
          receiverServiceNo: request.receiverServiceNo,
          status: request.status,
        });
      }

      audiences.forEach((audience) => {
        createAudienceNotification(io, audience, notification).catch((error) => {
          console.error("Failed to create notification:", {
            error: error.message,
            eventType,
            actorRole,
            audience,
            referenceNumber: request.referenceNumber || request.refNo,
          });
        });
      });
    })
    .catch((error) => {
      console.error("Failed to build notification plan:", {
        error: error.message,
        eventType,
        actorRole,
        referenceNumber: request.referenceNumber || request.refNo,
      });
    });
};

const emitRequestUpdate = (io, request, eventType = "request-updated") => {
  if (!io || !request) return;

  const payload = {
    referenceNumber: request.referenceNumber || request.refNo,
    status: request.status,
    updatedAt: new Date(),
    request: request,
  };

  // Emit to requester
  if (request.employeeServiceNo) {
    io.to(`user-${request.employeeServiceNo}`).emit(eventType, payload);
  }

  // Emit to receiver if designated
  if (request.receiverServiceNo) {
    io.to(`user-${request.receiverServiceNo}`).emit(eventType, payload);
  }

  // Emit to executive officer (approver)
  if (request.executiveOfficerServiceNo) {
    io.to(`user-${request.executiveOfficerServiceNo}`).emit(eventType, payload);
  }

  // Emit to role-based rooms based on status
  const roleEmissions = getRoleEmissions(request.status);
  roleEmissions.forEach((role) => {
    io.to(`role-${role}`).emit(eventType, payload);
  });

  // Emit to branch-specific rooms
  if (request.outLocation) {
    io.to(`branch-${request.outLocation}`).emit(eventType, payload);
  }
  if (request.inLocation) {
    io.to(`branch-${request.inLocation}`).emit(eventType, payload);
  }

  if (!["request-approved", "request-rejected"].includes(eventType)) {
    queueAudienceNotifications(io, request, eventType);
  }
};

/**
 * Determine which roles should receive updates based on request status
 */
const getRoleEmissions = (status) => {
  const roleMap = {
    1: ["Approver", "Admin", "SuperAdmin"], // Pending approval
    2: ["Pleader", "Admin", "SuperAdmin"], // Approved by executive
    3: ["User", "Admin", "SuperAdmin"], // Rejected by executive
    4: ["Pleader", "Admin", "SuperAdmin"], // Verified
    5: ["User", "Admin", "SuperAdmin"], // Rejected by verifier
    6: ["Dispatcher", "Admin", "SuperAdmin"], // Approved by petrol leader
    7: ["User", "Admin", "SuperAdmin"], // Rejected by petrol leader
    11: ["User", "Dispatcher", "Admin", "SuperAdmin"], // Completed
    12: ["User", "Admin", "SuperAdmin"], // Rejected by receiver
  };

  return roleMap[status] || ["Admin", "SuperAdmin"];
};

/**
 * Emit new request creation
 */
const emitNewRequest = (io, request) => {
  emitRequestUpdate(io, request, "new-request");
};

/**
 * Emit request approval
 */
const emitRequestApproval = (io, request, approverRole) => {
  emitRequestUpdate(io, request, "request-approved");
  queueAudienceNotifications(io, request, "request-approved", approverRole);
  
  // Per user request, when sender side Patrol leader or Security Officer verifies (Verifier),
  // show notification to BOTH Security Officer (Dispatch panel) AND Receiver
  if (approverRole === "Verifier") {
    queueAudienceNotifications(io, request, "ready-for-receiving");
  }
};

/**
 * Emit request rejection
 */
const emitRequestRejection = (io, request, rejecterRole) => {
  emitRequestUpdate(io, request, "request-rejected");
  queueAudienceNotifications(io, request, "request-rejected", rejecterRole);
};

/**
 * Emit request completion (received)
 */
const emitRequestCompletion = (io, request) => {
  emitRequestUpdate(io, request, "request-completed");
};

/**
 * Emit user notification
 */
const emitNotification = (io, serviceNo, notification) => {
  if (!io || !serviceNo) return;

  createAudienceNotification(
    io,
    { recipientServiceNo: serviceNo },
    {
      ...notification,
      timestamp: new Date(),
    },
  ).catch((error) => {
    console.error("Failed to create user notification:", error);
  });
};

/**
 * Emit bulk update (for dashboard refresh)
 */
const emitBulkUpdate = (io, role, data) => {
  if (!io || !role) return;

  io.to(`role-${role}`).emit("bulk-update", {
    data,
    timestamp: new Date(),
  });
};

module.exports = {
  emitRequestUpdate,
  emitNewRequest,
  emitRequestApproval,
  emitRequestRejection,
  emitRequestCompletion,
  emitNotification,
  emitBulkUpdate,
};
