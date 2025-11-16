// routes/movimientoRoutes.js
const express = require('express');
const router = express.Router();
const movimientoController = require('../controllers/movimientoController');

router.get('/', movimientoController.getMovimientosPage);

// API
router.get('/api', movimientoController.listarMovimientos);
router.post('/api', movimientoController.crearMovimiento);

// NUEVO: listar ubicaciones por bodega
router.get('/api/ubicaciones/:id_bodega', movimientoController.listarUbicacionesPorBodega);

//Filtros
router.get('/api/filtrar', movimientoController.filtrarMovimientos);


module.exports = router;
