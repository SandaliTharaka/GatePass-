const express = require('express');
const router = express.Router();
const { getUserByServiceNo, getUserByRole, getUserByRoleAndBranch, getSupervisorHierarchy} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.get('/:serviceNo', getUserByServiceNo);
router.get('/role/:role', protect, getUserByRole);
router.get('/branch/:branch', getUserByRoleAndBranch);
router.get('/supervisors/:serviceNumber', getSupervisorHierarchy);

module.exports = router;
