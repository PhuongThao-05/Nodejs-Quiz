const express = require('express');
const router = express.Router();
const { authenticateToken, checkRole } = require('../config/authentication');

router.get('/authentic',authenticateToken,checkRole([false]), async (req, res) => {
    res.status(200).json({ message: 'Token is valid' });
});
router.get('/authAdmin',authenticateToken,checkRole([true]), async (req, res) => {
    res.status(200).json({ message: 'Token admin is valid' });
});
module.exports = router;