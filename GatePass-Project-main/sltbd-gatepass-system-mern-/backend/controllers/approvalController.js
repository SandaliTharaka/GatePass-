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
  const serviceNo = req.params.id;

  try {
    const pendingStatuses = await Status.find({ executiveOfficerStatus: 1 })
      .populate('request')
      .exec();

    const filteredPending = pendingStatuses.filter(status => status.request?.executiveOfficerServiceNo === serviceNo &&
      status.request?.show === true);


    res.status(200).json(filteredPending);
  } catch (error) {
    console.error("Error fetching pending statuses:", error);
    res.status(500).json({ message: "Server error" });
  }
};


const getApproved = async (req, res) => {
  try {
    const approvedRequests = await Status.find({ executiveOfficerStatus: 2 })
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
    const rejectedRequests = await Status.find({ executiveOfficerStatus: 3 })
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
    const { comment, branches, loadingDetails} = req.body;
    const { referenceNumber } = req.params;
    console.log("loadingDetails:", loadingDetails);
    console.log("Branches:", branches);
    // Determine status updates based on branch
    let statusUpdate = {
      executiveOfficerStatus: 2,
      executiveOfficerComment: comment,
    };

    // Check if user branch is NOT "Colombo - Head Office"
    if (branches && !branches.includes("Colombo - Head Office")) {
      statusUpdate = {
        ...statusUpdate,
        verifyOfficerStatus: 2,
        receiveOfficerStatus: 1,
      };
    } else {
      // For "Colombo - Head Office" branch
      statusUpdate = {
        ...statusUpdate,
        verifyOfficerStatus: 1,
      };
    }

    // Update existing status
    const updatedStatus = await Status.findOneAndUpdate(
      { referenceNumber, executiveOfficerStatus: 1 },
      statusUpdate,
      { new: true }
    ).populate("request");

    if (!updatedStatus)
      return res.status(404).json({ message: "Status not found" });

    if (updatedStatus.request) {
      // Set different request status based on branch
      if (branches && !branches.includes("Colombo - Head Office")) {
        updatedStatus.request.status = 10;// Skip verification, go directly to receive
        if (loadingDetails) {
          updatedStatus.request.loading = loadingDetails;
        } 
      } else {
        updatedStatus.request.status = 4; // Go to verification
      }
      await updatedStatus.request.save();
    }

    res.status(200).json({ updatedStatus });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};



const updateRejected = async (req, res) => {
  try {
    const { comment } = req.body;
    const updatedStatus = await Status.findOneAndUpdate(
      { referenceNumber: req.params.referenceNumber, executiveOfficerStatus: 1 },
      {
        // afterStatus: 3,
        // comment: comment,
        executiveOfficerStatus: 3,
        executiveOfficerComment: comment,
      },
      { new: true }
    ).populate("request");
    if (!updatedStatus)
      return res.status(404).json({ message: "Status not found" });

    if (updatedStatus.request) {
      updatedStatus.request.status = 3;
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