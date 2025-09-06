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
    const pendingStatuses = await Status.find({ 
      $or: [
        { verifyOfficerStatus: 2 },
        { executiveOfficerStatus: 2 }
      ]
    })
      .populate('request')
      .exec();
    
    res.status(200).json(pendingStatuses);
  } catch (error) {
    console.error("Error fetching pending statuses:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getApproved = async (req, res) => {
  try {
    const approvedRequests = await Status.find({ afterStatus: 8 })
      .populate('request')
      .exec();

    res.status(200).json(approvedRequests);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getRejected = async (req, res) => {
  try {
    const rejectedRequests = await Status.find({ afterStatus: 9 })
    .populate('request')
    .exec();
    res.status(200).json(rejectedRequests);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const updateApproved = async (req, res) => {
  try {
    const { comment } = req.body;
    const { referenceNumber } = req.params;
    
    // Update existing status
    const updatedStatus = await Status.findOneAndUpdate(
      { referenceNumber, beforeStatus: 7 },
      {
        afterStatus: 8,
        comment,
      },
      { new: true }
    ).populate("request");

    if (!updatedStatus)
      return res.status(404).json({ message: "Status not found" });
    
    
    if (updatedStatus.request) {
      updatedStatus.request.status = 10;
      await updatedStatus.request.save();
    }
    
    const newStatus = new Status({
      referenceNumber,
      request: updatedStatus.request._id,
      beforeStatus: 10,
    });
    await newStatus.save();


    res.status(200).json({ updatedStatus, newStatus });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};


const updateRejected = async (req, res) => {
  try {
    const {comment} = req.body;
    const updatedStatus = await Status.findOneAndUpdate(
      { referenceNumber: req.params.referenceNumber, beforeStatus: 7},
      {
        afterStatus: 9,
        comment: comment, 
      },
      { new: true }
    ).populate("request");
    if (!updatedStatus)
      return res.status(404).json({ message: "Status not found" }); 

    if (updatedStatus.request){
      updatedStatus.request.status = 9;
      await updatedStatus.request.save();
    }

    res.status(200).json(updatedStatus);
  }catch (error) {
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