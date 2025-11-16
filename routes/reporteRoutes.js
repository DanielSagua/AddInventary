const express = require('express');
const router = express.Router();
const reporteController = require('../controllers/reporteController');

// === RUTAS DE REPORTES ===

// STOCK
router.get('/stock', reporteController.reporteStock);

// MOVIMIENTOS
router.get('/movimientos', reporteController.reporteMovimientos);

// DIFERENCIAS DE CONTEOS
router.get('/diferencias', reporteController.reporteDiferencias);

// VISTA PRINCIPAL
router.get('/', (req, res) => {
    res.sendFile(require('path').join(__dirname, '..', 'views', 'reportes.html'));
});

module.exports = router;
