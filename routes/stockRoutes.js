// routes/stockRoutes.js
const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');

router.get('/', stockController.getStockPage);      // Vista
router.get('/api', stockController.listarStock);    // API

module.exports = router;
