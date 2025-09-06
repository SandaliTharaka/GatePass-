const Status = require("../models/Status");

// Create a new status
const createStatus = async (req, res) => {
  try {
    const { referenceNumber, comment, beforeStatus, afterStatus, request } = req.body;
    const newStatus = new Status({
      referenceNumber,
      comment,
      beforeStatus,
      afterStatus,
      request,
    });

    await newStatus.save();
    res
      .status(201)
      .json({ message: "Status created successfully", status: newStatus });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};


const getPending = async (req, res) => {
  try {
    const pendingStatuses = await Status.find({ verifyOfficerStatus: 1 })
      .populate('request')
      .exec();
    const filteredPending = pendingStatuses.filter(status =>
      status.request?.show === true
    );
    res.status(200).json(filteredPending);
  } catch (error) {
    console.error("Error fetching pending statuses:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getApproved = async (req, res) => {
  try {
    const approvedRequests = await Status.find({ verifyOfficerStatus: 2 })
      .populate('request')
      .exec();
    const filteredApproved = approvedRequests.filter(status =>
      status.request?.show === true
    );
    res.status(200).json(filteredApproved);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getRejected = async (req, res) => {
  try {
    const rejectedRequests = await Status.find({ verifyOfficerStatus: 3 })
      .populate('request')
      .exec();
    const filteredRejected = rejectedRequests.filter(status =>
      status.request?.show === true
    );
    res.status(200).json(filteredRejected);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const updateApproved = async (req, res) => {
  try {
    const { comment, loadingDetails, userServiceNumber } = req.body;
    const { referenceNumber } = req.params;
    //console.log("loding details:",req.body.loadingDetails);
    //console.log("userDetails:", userServiceNumber);

    // Update existing status
    const updatedStatus = await Status.findOneAndUpdate(
      { referenceNumber },
      {
        verifyOfficerStatus: 2,
        verifyOfficerComment: comment,
        verifyOfficerServiceNumber: userServiceNumber,
        recieveOfficerStatus: 1,
      },
      { new: true }
    ).populate("request");

    if (!updatedStatus)
      return res.status(404).json({ message: "Status not found" });

    if (updatedStatus.request) {
      if (loadingDetails) {
        updatedStatus.request.loading = {
          loadingType: 'Loading',
          loadingLocation: loadingDetails.loadingLocation || updatedStatus.request.outLocation,
          loadingTime: new Date(),
          staffType: loadingDetails.staffType,
          staffServiceNo: loadingDetails.staffServiceNo,
          nonSLTStaffName: loadingDetails.nonSLTStaffName,
          nonSLTStaffCompany: loadingDetails.nonSLTStaffCompany,
          nonSLTStaffNIC: loadingDetails.nonSLTStaffNIC,
          nonSLTStaffContact: loadingDetails.nonSLTStaffContact,
          nonSLTStaffEmail: loadingDetails.nonSLTStaffEmail
        };
      }

      updatedStatus.request.status = 10;
      await updatedStatus.request.save();
    }

    // const newStatus = new Status({
    //   referenceNumber,
    //   request: updatedStatus.request._id,
    //   beforeStatus: 10,
    // });
    // await newStatus.save();


    res.status(200).json({ updatedStatus });
  } catch (error) {
    console.error("Error updating status:", error);
    res.status(400).json({ error: error.message });
  }
};


const updateRejected = async (req, res) => {
  try {
    const { comment } = req.body;
    const updatedStatus = await Status.findOneAndUpdate(
      { referenceNumber: req.params.referenceNumber },
      {
        verifyOfficerStatus: 3,
        verifyOfficerComment: comment,
      },
      { new: true }
    ).populate("request");
    if (!updatedStatus)
      return res.status(404).json({ message: "Status not found" });

    if (updatedStatus.request) {
      updatedStatus.request.status = 6;
      await updatedStatus.request.save();
    }

    res.status(200).json(updatedStatus);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};


module.exports = {
  createStatus,
  getPending,
  getApproved,
  getRejected,
  updateApproved,
  updateRejected,
};