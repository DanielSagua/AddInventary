// middleware/authMiddleware.js

function ensureAuthenticated(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    }
    return res.redirect('/login');
}

function ensureAdmin(req, res, next) {
    if (req.session && req.session.user && req.session.user.rol === 'ADMIN') {
        return next();
    }
    return res.status(403).send('Acceso denegado');
}

module.exports = {
    ensureAuthenticated,
    ensureAdmin
};
