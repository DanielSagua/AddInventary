const express = require('express');
const router = express.Router();
const bodegaController = require('../controllers/bodegaController');

function ensureAuthenticated(req, res, next) {
    if (req.session && req.session.user) return next();
    return res.redirect('/');
}

function ensureAdmin(req, res, next) {
    if (req.session?.user?.rol === 'admin') return next();
    return res.status(403).json({ ok: false, msg: 'Acceso solo para administradores' });
}

// ===============================
// VISTA
// ===============================
router.get('/', ensureAuthenticated, ensureAdmin, (req, res) => {
    res.sendFile(require('path').join(__dirname, '..', 'views', 'bodegas.html'));
});

// ===============================
// API BODEGAS
// ===============================
router.get('/api', ensureAuthenticated, ensureAdmin, bodegaController.listarBodegas);
router.get('/api/:id_bodega', ensureAuthenticated, ensureAdmin, bodegaController.obtenerBodega);
router.post('/api', ensureAuthenticated, ensureAdmin, bodegaController.crearBodega);
router.put('/api/:id_bodega', ensureAuthenticated, ensureAdmin, bodegaController.actualizarBodega);

// ===============================
// API UBICACIONES
// ===============================
router.get('/:id_bodega/ubicaciones/api', ensureAuthenticated, ensureAdmin, bodegaController.listarUbicaciones);
router.post('/:id_bodega/ubicaciones/api', ensureAuthenticated, ensureAdmin, bodegaController.crearUbicacion);
router.get('/ubicaciones/api/:id_ubicacion', ensureAuthenticated, ensureAdmin, bodegaController.obtenerUbicacion);
router.put('/ubicaciones/api/:id_ubicacion', ensureAuthenticated, ensureAdmin, bodegaController.actualizarUbicacion);

module.exports = router;
