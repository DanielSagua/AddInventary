const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');

// Middleware para validar sesión
function ensureAuthenticated(req, res, next) {
    if (req.session && req.session.user) return next();
    return res.redirect('/');
}

// Middleware SOLO administrador
function ensureAdmin(req, res, next) {
    if (req.session?.user?.rol === 'admin') return next();
    return res.status(403).json({ ok: false, msg: 'Acceso solo para administradores' });
}


// ==== VISTA ====
router.get('/', ensureAuthenticated, ensureAdmin, (req, res) => {
    res.sendFile(require('path').join(__dirname, '..', 'views', 'usuarios.html'));
});


// ==== API ====

router.get('/api', ensureAuthenticated, ensureAdmin, usuarioController.listarUsuarios);

router.get('/api/:id', ensureAuthenticated, ensureAdmin, usuarioController.obtenerUsuario);

router.post('/api/crear', ensureAuthenticated, ensureAdmin, usuarioController.crearUsuario);

router.put('/api/actualizar', ensureAuthenticated, ensureAdmin, usuarioController.actualizarUsuario);

router.put('/api/resetear-clave', ensureAuthenticated, ensureAdmin, usuarioController.resetearClave);


module.exports = router;
