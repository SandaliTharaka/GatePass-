const express = require('express');
const router = express.Router();
// const { getRequestForItemTracking } = require('../controllers/Itemtracking');
const { protect } = require('../middleware/authMiddleware');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const {
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
} = require('../controllers/requestController');

router.post('/', protect, upload.array('itemPhotos'), createRequest);
router.get('/', protect, getRequests);
router.get('/image/:path', protect, getRequestImage);
router.get('/:serviceNo', protect, getRequestByEmployeeServiceNo);
router.put('/:id', protect, upload.array('itemPhotos'), updateRequest);
router.delete('/:id', protect, deleteRequest);
router.patch('/:id/status', protect, updateRequestStatus);
router.get('/status/:status', protect, getRequestsByStatus);
router.get('/filter/returnable/:returnable', protect, getRequestsByItemReturnable);
router.get('/filter/receiver/:available', protect, getRequestsByReceiverAvailable);
router.patch('/:id/executive', protect, updateExecutiveOfficer);
router.patch('/:referenceNumber/cancel', cancelRequest);
// router.get('/itemTracking', getRequestForItemTracking);


module.exports = router;
