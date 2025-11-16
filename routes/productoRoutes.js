// routes/productoRoutes.js
const express = require('express');
const router = express.Router();
const productoController = require('../controllers/productoController');

// Vista principal de productos (HTML)
router.get('/', productoController.getProductosPage);

// API REST
router.get('/api', productoController.listarProductos);
router.get('/api/:id', productoController.obtenerProducto);
router.post('/api', productoController.crearProducto);
router.put('/api/:id', productoController.actualizarProducto);
router.delete('/api/:id', productoController.eliminarProducto);

module.exports = router;
