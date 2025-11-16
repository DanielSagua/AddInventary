// controllers/usuarioController.js

const { sql, poolPromise } = require('../models/db');
const bcrypt = require('bcryptjs');

// =================================================
// 1) LISTAR USUARIOS
// =================================================
exports.listarUsuarios = async (req, res) => {
    try {
        const pool = await poolPromise;

        const result = await pool.request().query(`
            SELECT 
                id_usuario,
                nombre,
                usuario,
                rol,
                estado
            FROM Usuarios
            ORDER BY nombre
        `);

        res.json({ ok: true, usuarios: result.recordset });

    } catch (err) {
        console.error('Error listarUsuarios:', err);
        res.json({ ok: false, msg: 'Error al obtener usuarios' });
    }
};



// =================================================
// 2) OBTENER USUARIO POR ID
// =================================================
exports.obtenerUsuario = async (req, res) => {

    const { id } = req.params;

    try {
        const pool = await poolPromise;

        const result = await pool.request()
            .input('id_usuario', sql.Int, id)
            .query(`
                SELECT 
                    id_usuario,
                    nombre,
                    usuario,
                    rol,
                    estado
                FROM Usuarios
                WHERE id_usuario = @id_usuario
            `);

        if (result.recordset.length === 0) {
            return res.json({ ok: false, msg: 'Usuario no encontrado' });
        }

        res.json({ ok: true, usuario: result.recordset[0] });

    } catch (err) {
        console.error('Error obtenerUsuario:', err);
        res.json({ ok: false, msg: 'Error al obtener usuario' });
    }
};



// =================================================
// 3) CREAR USUARIO
// =================================================
exports.crearUsuario = async (req, res) => {

    const { nombre, usuario, clave, rol } = req.body;

    if (!nombre || !usuario || !clave || !rol) {
        return res.json({ ok: false, msg: 'Faltan datos obligatorios' });
    }

    try {
        const pool = await poolPromise;

        // Validar usuario único
        const existe = await pool.request()
            .input('usuario', sql.VarChar(50), usuario)
            .query(`
                SELECT id_usuario FROM Usuarios WHERE usuario = @usuario
            `);

        if (existe.recordset.length > 0) {
            return res.json({ ok: false, msg: 'El usuario ya existe' });
        }

        // Hash de contraseña
        const hash = await bcrypt.hash(clave, 10);

        await pool.request()
            .input('nombre', sql.VarChar(150), nombre)
            .input('usuario', sql.VarChar(50), usuario)
            .input('clave_hash', sql.VarChar(255), hash)
            .input('rol', sql.VarChar(30), rol)
            .query(`
                INSERT INTO Usuarios (nombre, usuario, clave_hash, rol, estado)
                VALUES (@nombre, @usuario, @clave_hash, @rol, 'activo')
            `);

        res.json({ ok: true });

    } catch (err) {
        console.error('Error crearUsuario:', err);
        res.json({ ok: false, msg: 'Error al crear usuario' });
    }
};



// =================================================
// 4) ACTUALIZAR USUARIO
// =================================================
exports.actualizarUsuario = async (req, res) => {

    const { id_usuario, nombre, rol, estado, clave } = req.body;

    if (!id_usuario || !nombre || !rol || !estado) {
        return res.json({ ok: false, msg: 'Datos incompletos' });
    }

    try {
        const pool = await poolPromise;

        // Si viene clave nueva → encriptar
        if (clave && clave.trim() !== "") {

            const hash = await bcrypt.hash(clave, 10);

            await pool.request()
                .input('id_usuario', sql.Int, id_usuario)
                .input('nombre', sql.VarChar(150), nombre)
                .input('rol', sql.VarChar(30), rol)
                .input('estado', sql.VarChar(20), estado)
                .input('clave_hash', sql.VarChar(255), hash)
                .query(`
                    UPDATE Usuarios
                    SET nombre = @nombre,
                        rol = @rol,
                        estado = @estado,
                        clave_hash = @clave_hash
                    WHERE id_usuario = @id_usuario
                `);

        } else {

            // Sin cambiar contraseña
            await pool.request()
                .input('id_usuario', sql.Int, id_usuario)
                .input('nombre', sql.VarChar(150), nombre)
                .input('rol', sql.VarChar(30), rol)
                .input('estado', sql.VarChar(20), estado)
                .query(`
                    UPDATE Usuarios
                    SET nombre = @nombre,
                        rol = @rol,
                        estado = @estado
                    WHERE id_usuario = @id_usuario
                `);
        }

        res.json({ ok: true });

    } catch (err) {
        console.error("Error actualizarUsuario:", err);
        res.json({ ok: false, msg: "Error al actualizar usuario" });
    }
};




// =================================================
// 5) RESETEAR CONTRASEÑA
// =================================================
exports.resetearClave = async (req, res) => {

    const { id_usuario, clave } = req.body;

    if (!id_usuario || !clave) {
        return res.json({ ok: false, msg: 'Datos incompletos' });
    }

    try {
        const pool = await poolPromise;

        const hash = await bcrypt.hash(clave, 10);

        await pool.request()
            .input('id_usuario', sql.Int, id_usuario)
            .input('clave_hash', sql.VarChar(255), hash)
            .query(`
                UPDATE Usuarios
                SET clave_hash = @clave_hash
                WHERE id_usuario = @id_usuario
            `);

        res.json({ ok: true });

    } catch (err) {
        console.error('Error resetearClave:', err);
        res.json({ ok: false, msg: 'Error al resetear contraseña' });
    }
};
