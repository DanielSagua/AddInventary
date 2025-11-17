// controllers/bodegaController.js
const { sql, poolPromise } = require('../models/db');

// =======================================================
// BODEGAS
// =======================================================

// LISTAR TODAS LAS BODEGAS
exports.listarBodegas = async (req, res) => {
    try {
        const pool = await poolPromise;

        const result = await pool.request().query(`
            SELECT 
                id_bodega,
                nombre_bodega,
                direccion,
                comuna,
                ciudad,
                responsable
            FROM Bodegas
            ORDER BY nombre_bodega
        `);

        res.json({ ok: true, bodegas: result.recordset });

    } catch (err) {
        console.error("Error listarBodegas:", err);
        res.json({ ok: false, msg: 'Error al obtener bodegas' });
    }
};


// OBTENER BODEGA POR ID
exports.obtenerBodega = async (req, res) => {
    const { id_bodega } = req.params;

    try {
        const pool = await poolPromise;

        const result = await pool.request()
            .input('id_bodega', sql.Int, id_bodega)
            .query(`
                SELECT 
                    id_bodega,
                    nombre_bodega,
                    direccion,
                    comuna,
                    ciudad,
                    responsable
                FROM Bodegas
                WHERE id_bodega = @id_bodega
            `);

        if (result.recordset.length === 0) {
            return res.json({ ok: false, msg: 'Bodega no encontrada' });
        }

        res.json({ ok: true, bodega: result.recordset[0] });

    } catch (err) {
        console.error("Error obtenerBodega:", err);
        res.json({ ok: false, msg: 'Error al obtener bodega' });
    }
};


// CREAR BODEGA
exports.crearBodega = async (req, res) => {

    const { nombre_bodega, direccion, comuna, ciudad, responsable } = req.body;

    if (!nombre_bodega) {
        return res.json({ ok: false, msg: 'El nombre de la bodega es obligatorio' });
    }

    try {
        const pool = await poolPromise;

        await pool.request()
            .input('nombre_bodega', sql.VarChar(100), nombre_bodega)
            .input('direccion', sql.VarChar(200), direccion)
            .input('comuna', sql.VarChar(100), comuna)
            .input('ciudad', sql.VarChar(100), ciudad)
            .input('responsable', sql.VarChar(100), responsable)
            .query(`
                INSERT INTO Bodegas (nombre_bodega, direccion, comuna, ciudad, responsable)
                VALUES (@nombre_bodega, @direccion, @comuna, @ciudad, @responsable)
            `);

        res.json({ ok: true });

    } catch (err) {
        console.error("Error crearBodega:", err);
        res.json({ ok: false, msg: 'Error al crear bodega' });
    }
};


// ACTUALIZAR BODEGA
exports.actualizarBodega = async (req, res) => {

    const { id_bodega } = req.params;
    const { nombre_bodega, direccion, comuna, ciudad, responsable } = req.body;

    if (!nombre_bodega) {
        return res.json({ ok: false, msg: 'El nombre de la bodega es obligatorio' });
    }

    try {
        const pool = await poolPromise;

        await pool.request()
            .input('id_bodega', sql.Int, id_bodega)
            .input('nombre_bodega', sql.VarChar(100), nombre_bodega)
            .input('direccion', sql.VarChar(200), direccion)
            .input('comuna', sql.VarChar(100), comuna)
            .input('ciudad', sql.VarChar(100), ciudad)
            .input('responsable', sql.VarChar(100), responsable)
            .query(`
                UPDATE Bodegas
                SET nombre_bodega = @nombre_bodega,
                    direccion = @direccion,
                    comuna = @comuna,
                    ciudad = @ciudad,
                    responsable = @responsable
                WHERE id_bodega = @id_bodega
            `);

        res.json({ ok: true });

    } catch (err) {
        console.error("Error actualizarBodega:", err);
        res.json({ ok: false, msg: 'Error al actualizar bodega' });
    }
};


// =======================================================
// UBICACIONES
// =======================================================

// LISTAR UBICACIONES POR BODEGA
exports.listarUbicaciones = async (req, res) => {
    const { id_bodega } = req.params;

    try {
        const pool = await poolPromise;

        const result = await pool.request()
            .input('id_bodega', sql.Int, id_bodega)
            .query(`
                SELECT 
                    id_ubicacion,
                    id_bodega,
                    pasillo,
                    rack,
                    nivel,
                    descripcion
                FROM Ubicaciones
                WHERE id_bodega = @id_bodega
                ORDER BY pasillo, rack, nivel
            `);

        res.json({ ok: true, ubicaciones: result.recordset });

    } catch (err) {
        console.error("Error listarUbicaciones:", err);
        res.json({ ok: false, msg: 'Error al cargar ubicaciones' });
    }
};


// CREAR UBICACIÓN
exports.crearUbicacion = async (req, res) => {

    const { id_bodega } = req.params;
    const { pasillo, rack, nivel, descripcion } = req.body;

    if (!descripcion) {
        return res.json({ ok: false, msg: 'La descripción es obligatoria' });
    }

    try {
        const pool = await poolPromise;

        await pool.request()
            .input('id_bodega', sql.Int, id_bodega)
            .input('pasillo', sql.VarChar(50), pasillo)
            .input('rack', sql.VarChar(50), rack)
            .input('nivel', sql.VarChar(50), nivel)
            .input('descripcion', sql.VarChar(150), descripcion)
            .query(`
                INSERT INTO Ubicaciones (id_bodega, pasillo, rack, nivel, descripcion)
                VALUES (@id_bodega, @pasillo, @rack, @nivel, @descripcion)
            `);

        res.json({ ok: true });

    } catch (err) {
        console.error("Error crearUbicacion:", err);
        res.json({ ok: false, msg: 'Error al crear ubicación' });
    }
};


// OBTENER UBICACIÓN POR ID
exports.obtenerUbicacion = async (req, res) => {
    const { id_ubicacion } = req.params;

    try {
        const pool = await poolPromise;

        const result = await pool.request()
            .input('id_ubicacion', sql.Int, id_ubicacion)
            .query(`
                SELECT 
                    id_ubicacion,
                    id_bodega,
                    pasillo,
                    rack,
                    nivel,
                    descripcion
                FROM Ubicaciones
                WHERE id_ubicacion = @id_ubicacion
            `);

        if (result.recordset.length === 0) {
            return res.json({ ok: false, msg: 'Ubicación no encontrada' });
        }

        res.json({ ok: true, ubicacion: result.recordset[0] });

    } catch (err) {
        console.error("Error obtenerUbicacion:", err);
        res.json({ ok: false, msg: 'Error al obtener ubicación' });
    }
};


// ACTUALIZAR UBICACIÓN
exports.actualizarUbicacion = async (req, res) => {

    const { id_ubicacion } = req.params;
    const { pasillo, rack, nivel, descripcion } = req.body;

    if (!descripcion) {
        return res.json({ ok: false, msg: 'La descripción es obligatoria' });
    }

    try {
        const pool = await poolPromise;

        await pool.request()
            .input('id_ubicacion', sql.Int, id_ubicacion)
            .input('pasillo', sql.VarChar(50), pasillo)
            .input('rack', sql.VarChar(50), rack)
            .input('nivel', sql.VarChar(50), nivel)
            .input('descripcion', sql.VarChar(150), descripcion)
            .query(`
                UPDATE Ubicaciones
                SET pasillo = @pasillo,
                    rack = @rack,
                    nivel = @nivel,
                    descripcion = @descripcion
                WHERE id_ubicacion = @id_ubicacion
            `);

        res.json({ ok: true });

    } catch (err) {
        console.error("Error actualizarUbicacion:", err);
        res.json({ ok: false, msg: 'Error al actualizar ubicación' });
    }
};
