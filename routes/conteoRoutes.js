const express = require('express');
const router = express.Router();
const conteoController = require('../controllers/conteoController');

router.get('/', conteoController.getConteosPage);

router.get('/api', conteoController.listarConteos);
router.post('/api', conteoController.crearConteo);

router.get('/api/:id/detalle', conteoController.listarDetalleConteo);
router.post('/api/:id/detalle', conteoController.registrarLineaConteo);

router.post('/api/:id/cerrar', conteoController.cerrarConteo);

router.get('/api/bodegas', conteoController.listarBodegas);
router.get('/api/ubicaciones/:id_bodega', conteoController.listarUbicaciones);

router.get('/api/productos', conteoController.listarProductos);

module.exports = router;
