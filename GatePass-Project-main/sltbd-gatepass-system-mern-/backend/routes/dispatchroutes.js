const express = require('express');
const router = express.Router();
const {createStatus, getPending, getApproved, getRejected, updateApproved, updateRejected} = require('../controllers/dispatchController');

// Status routes
router.post('/create', createStatus);   
router.get('/pending', getPending);
router.get('/approved', getApproved);
router.get('/rejected', getRejected);
router.put('/:referenceNumber/approve', updateApproved);
router.put('/:referenceNumber/reject', updateRejected);



module.exports = router;
