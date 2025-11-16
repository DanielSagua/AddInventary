const bcrypt = require('bcryptjs');
const { sql, poolPromise } = require('../models/db');
const path = require('path');

const showLogin = (req, res) => {
    if (req.session && req.session.user) {
        return res.redirect('/home');
    }
    res.sendFile(path.join(__dirname, '..', 'views', 'login.html'));
};

const login = async (req, res) => {
    const { usuario, password } = req.body;

    try {
        const pool = await poolPromise;
        const request = pool.request();
        request.input('usuario', sql.VarChar, usuario);

        const result = await request.query(`
      SELECT TOP 1 
        id_usuario,
        nombre,
        usuario,
        clave_hash,
        rol,
        estado
      FROM Usuarios
      WHERE usuario = @usuario AND estado = 'activo'
    `);

        if (result.recordset.length === 0) {
            req.flash('error_msg', 'Usuario o contraseña inválidos.');
            return res.redirect('/login');
        }

        const user = result.recordset[0];

        const passOK = await bcrypt.compare(password, user.clave_hash);
        if (!passOK) {
            req.flash('error_msg', 'Usuario o contraseña inválidos.');
            return res.redirect('/login');
        }

        // Guardar sesión
        req.session.user = {
            id: user.id_usuario,
            nombre: user.nombre,
            usuario: user.usuario,
            rol: user.rol
        };

        return res.redirect('/home');

    } catch (error) {
        console.error("Error en login:", error);
        req.flash('error_msg', 'Error interno.');
        return res.redirect('/login');
    }
};

const logout = (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
};

module.exports = {
    showLogin,
    login,
    logout
};
