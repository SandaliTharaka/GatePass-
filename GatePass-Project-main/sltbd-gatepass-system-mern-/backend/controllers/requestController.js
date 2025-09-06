const Request = require('../models/Request');
const Status = require('../models/Status');
const { uploadImage, getImage } = require('../utils/imageUpload');

const createRequest = async (req, res) => {
    try {
        const { items, outLocation, inLocation, executiveOfficerServiceNo, receiverAvailable, receiverServiceNo, transportMethod,
            transporterType,
            transporterServiceNo,
            nonSLTTransporterName,
            nonSLTTransporterNIC,
            nonSLTTransporterPhone,
            nonSLTTransporterEmail,
            vehicleNumber,
            vehicleModel } = req.body;




        const referenceNumber = `REQ-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const parsedItems = JSON.parse(items);

        // Create a map to group files by their original names
        // const fileMap = {};
        // req.files.forEach(file => {
        //     fileMap[file.originalname] = file;
        // });

        // Process items (works for both regular and CSV-imported items)
        const processedItems = await processCSVItems(parsedItems, req.files);

        // const processedItems = await Promise.all(parsedItems.map(async (item) => {
        //     const itemPhotos = [];


        //     // Process photos for this specific item only
        //     for (const fileName of item.originalFileNames) {
        //         const file = fileMap[fileName];
        //         if (file) {
        //             const uploadedImage = await uploadImage(file, 'items');
        //             itemPhotos.push(uploadedImage);
        //         }
        //     }

        //     return {
        //         itemName: item.itemName,
        //         serialNo: item.serialNo,
        //         itemCategory: item.itemCategory,
        //         itemReturnable: item.itemReturnable,
        //         itemQuantity: item.qty,
        //         itemPhotos: itemPhotos
        //     };
        // }));

        const requestData = {
            referenceNumber,
            employeeServiceNo: req.user.serviceNo,
            items: processedItems,
            outLocation,
            inLocation,
            executiveOfficerServiceNo,
            receiverAvailable,
            receiverServiceNo: receiverServiceNo || null
        };

        // Add transport details if provided
        if (transportMethod) {
            const transportData = {
                transportMethod
            };





            if (transportMethod === 'Vehicle') {
                transportData.transporterType = transporterType;

                if (transporterType === 'SLT') {
                    transportData.transporterServiceNo = transporterServiceNo;
                } else {
                    transportData.nonSLTTransporterName = nonSLTTransporterName;
                    transportData.nonSLTTransporterNIC = nonSLTTransporterNIC;
                    transportData.nonSLTTransporterPhone = nonSLTTransporterPhone;
                    transportData.nonSLTTransporterEmail = nonSLTTransporterEmail;
                }

                transportData.vehicleNumber = vehicleNumber;
                transportData.vehicleModel = vehicleModel;
            }
            if (transportMethod === 'By Hand') {
                transportData.transporterType = transporterType;

                if (transporterType === 'SLT') {
                    transportData.transporterServiceNo = transporterServiceNo;
                } else {
                    transportData.nonSLTTransporterName = nonSLTTransporterName;
                    transportData.nonSLTTransporterNIC = nonSLTTransporterNIC;
                    transportData.nonSLTTransporterPhone = nonSLTTransporterPhone;
                    transportData.nonSLTTransporterEmail = nonSLTTransporterEmail;
                }

                transportData.vehicleNumber = vehicleNumber;
                transportData.vehicleModel = vehicleModel;
            }
            requestData.transport = transportData;
        }




        const request = await Request.create(requestData);

        // Create pending status for the new request
        const newStatus = new Status({
            referenceNumber,
            executiveOfficerServiceNo,
            executiveOfficerStatus: 1,
            // beforeStatus: 1,
            request: request._id,
        });

        await newStatus.save();

        res.status(201).json({
            referenceNumber,
            request,
            status: newStatus
        });
    } catch (error) {
        console.error('Create request error:', error);
        res.status(400).json({ message: error.message });
    }
};

const processCSVItems = async (csvItems, files) => {
    // Create a map to group files by their original names if files exist
    const fileMap = {};
    if (files && files.length > 0) {
        files.forEach(file => {
            fileMap[file.originalname] = file;
        });
    }

    return Promise.all(csvItems.map(async (item) => {
        const itemPhotos = [];

        // Process photos for this specific item if they exist
        if (item.originalFileNames && item.originalFileNames.length > 0) {
            for (const fileName of item.originalFileNames) {
                const file = fileMap[fileName];
                if (file) {
                    const uploadedImage = await uploadImage(file, 'items');
                    itemPhotos.push(uploadedImage);
                }
            }
        }

        return {
            itemName: item.itemName,
            serialNo: item.serialNo,
            itemCategory: item.itemCategory,
            itemReturnable: item.itemReturnable === true ||
                item.itemReturnable === 'true' ||
                item.itemReturnable === 'Yes' ||
                item.itemReturnable === 'yes',
            itemQuantity: parseInt(item.itemQuantity || item.qty) || 1,
            itemModel: item.itemModel,
            itemPhotos: itemPhotos
        };
    }));
};


const getRequests = async (req, res) => {
    try {
        const requests = await Request.find();
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get Request by EmployeeServiceNo
const getRequestByEmployeeServiceNo = async (req, res) => {
    try {
        const requests = await Request.find({ employeeServiceNo: req.params.serviceNo });
        if (!requests.length) {
            return res.status(404).json({ message: 'No requests found' });
        }
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update Request
const updateRequest = async (req, res) => {
    try {
        const { items, outLocation, inLocation, executiveOfficerName, receiverAvailable, receiverServiceNo } = req.body;

        // Handle item photos upload for updated items
        const parsedItems = JSON.parse(items);
        const processedItems = await Promise.all(parsedItems.map(async (item, index) => {
            const photos = [...(item.itemPhotos || [])];
            if (req.files && req.files.length > 0) {
                const itemFiles = req.files.filter(file => file.fieldname === `itemPhotos_${index}`);
                for (const file of itemFiles) {
                    const uploadedImage = await uploadImage(file, 'items');
                    photos.push(uploadedImage);
                }
            }
            return { ...item, itemPhotos: photos };
        }));

        const updatedRequest = await Request.findByIdAndUpdate(
            req.params.id,
            {
                items: processedItems,
                outLocation,
                inLocation,
                executiveOfficerName,
                receiverAvailable,
                receiverServiceNo
            },
            { new: true }
        );

        if (!updatedRequest) {
            return res.status(404).json({ message: 'Request not found' });
        }
        res.json(updatedRequest);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete Request
const deleteRequest = async (req, res) => {
    try {
        const request = await Request.findByIdAndDelete(req.params.id);
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }
        res.json({ message: 'Request deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update Request Status
const updateRequestStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const updatedRequest = await Request.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!updatedRequest) {
            return res.status(404).json({ message: 'Request not found' });
        }
        res.json(updatedRequest);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Get Requests by Status
const getRequestsByStatus = async (req, res) => {
    try {
        const { status } = req.params;
        const requests = await Request.find({ status: parseInt(status) });
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get Requests by Item Returnable Status
const getRequestsByItemReturnable = async (req, res) => {
    try {
        const { returnable } = req.params;
        const requests = await Request.find({
            'items.itemReturnable': returnable === 'true'
        });
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get Requests by Receiver Available Status
const getRequestsByReceiverAvailable = async (req, res) => {
    try {
        const { available } = req.params;
        const requests = await Request.find({
            receiverAvailable: available === 'true'
        });
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getRequestImage = async (req, res) => {
    try {
        const { path } = req.params;
        const imageUrl = await getImage(decodeURIComponent(path));
        res.json({ url: imageUrl });
    } catch (error) {
        res.status(500).json({ message: 'Failed to get image URL' });
    }
};

const updateExecutiveOfficer = async (req, res) => {
    try {
        const { executiveOfficerServiceNo } = req.body;
        const updatedRequest = await Request.findByIdAndUpdate(
            req.params.id,
            { executiveOfficerServiceNo },
            { new: true }
        );

        if (!updatedRequest) {
            return res.status(404).json({ message: 'Request not found' });
        }

        const updateExServiceNo = await Status.findOneAndUpdate(
            { request: req.params.id },  // Search condition
            { executiveOfficerServiceNo: executiveOfficerServiceNo },  // Update
            { new: true }  // Return the updated document
        );


        res.json({ updatedRequest, updateExServiceNo });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const cancelRequest = async (req, res) => {
    try {
        const { referenceNumber } = req.params;

        const request = await Request.findOneAndUpdate(
            { referenceNumber, status: 1 },
            { status: 13, show: false },
            { new: true }
        );

        if (!request) {
            return res.status(404).json({ message: 'Request not found or cannot be canceled' });
        }

        res.json({ message: 'Request canceled successfully', request });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createRequest,
    getRequests,
    getRequestImage,
    getRequestByEmployeeServiceNo,
    updateRequest,
    deleteRequest,
    updateRequestStatus,
    getRequestsByStatus,
    getRequestsByItemReturnable,
    getRequestsByReceiverAvailable,
    updateExecutiveOfficer,
    cancelRequest
};
