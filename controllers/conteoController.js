// controllers/conteoController.js
const { sql, poolPromise } = require('../models/db');
const path = require('path');

// =====================================
// 1. VISTA PRINCIPAL
// =====================================
const getConteosPage = (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'conteos.html'));
};

// =====================================
// 2. LISTAR CONTEOS (CABECERA)
// =====================================
const listarConteos = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
      SELECT 
        c.id_conteo,
        c.fecha_creacion,
        c.estado,
        c.tipo_conteo,
        c.observaciones,
        b.nombre_bodega,
        u.nombre AS usuario_crea
      FROM Conteos c
      INNER JOIN Bodegas b ON b.id_bodega = c.id_bodega
      LEFT JOIN Usuarios u ON u.id_usuario = c.usuario_crea
      ORDER BY c.fecha_creacion DESC
    `);

        res.json({ ok: true, conteos: result.recordset });

    } catch (error) {
        console.error('Error listarConteos:', error);
        res.status(500).json({ ok: false, msg: 'Error al obtener conteos' });
    }
};

// =====================================
// 3. CREAR NUEVO CONTEO
// =====================================
const crearConteo = async (req, res) => {
    const { id_bodega, tipo_conteo, observaciones } = req.body;

    if (!id_bodega || !tipo_conteo) {
        return res.status(400).json({ ok: false, msg: 'Bodega y tipo son obligatorios' });
    }

    try {
        const pool = await poolPromise;

        const result = await pool.request()
            .input('id_bodega', sql.Int, id_bodega)
            .input('tipo_conteo', sql.VarChar(20), tipo_conteo)
            .input('observaciones', sql.Text, observaciones || null)
            .input('usuario_crea', sql.Int, req.session.user.id)
            .query(`
        INSERT INTO Conteos (id_bodega, tipo_conteo, observaciones, usuario_crea)
        OUTPUT INSERTED.id_conteo
        VALUES (@id_bodega, @tipo_conteo, @observaciones, @usuario_crea)
      `);

        res.json({ ok: true, id_conteo: result.recordset[0].id_conteo });

    } catch (error) {
        console.error('Error crearConteo:', error);
        res.status(500).json({ ok: false, msg: 'Error al crear conteo' });
    }
};

// =====================================
// 4. LISTAR DETALLE DE UN CONTEO
// =====================================
const listarDetalleConteo = async (req, res) => {
    const { id } = req.params;

    try {
        const pool = await poolPromise;

        // Cabecera
        const header = await pool.request()
            .input('id_conteo', sql.Int, id)
            .query(`
        SELECT c.*, b.nombre_bodega
        FROM Conteos c
        INNER JOIN Bodegas b ON b.id_bodega = c.id_bodega
        WHERE c.id_conteo = @id_conteo
      `);

        if (header.recordset.length === 0) {
            return res.json({ ok: false, msg: 'Conteo no encontrado' });
        }

        // Detalle
        const detalle = await pool.request()
            .input('id_conteo', sql.Int, id)
            .query(`
        SELECT 
          d.*,
          p.nombre AS producto,
          p.codigo_barra,
          u.descripcion AS ubicacion
        FROM ConteoDetalle d
        INNER JOIN Productos p ON p.id_producto = d.id_producto
        LEFT JOIN Ubicaciones u ON u.id_ubicacion = d.id_ubicacion
        WHERE d.id_conteo = @id_conteo
        ORDER BY p.nombre
      `);

        res.json({
            ok: true,
            header: header.recordset[0],
            detalle: detalle.recordset
        });

    } catch (error) {
        console.error('Error listarDetalleConteo:', error);
        res.status(500).json({ ok: false, msg: 'Error al cargar detalle' });
    }
};

// =====================================
// 5. REGISTRAR LÍNEA DE CONTEO
// =====================================
const registrarLineaConteo = async (req, res) => {
    const { id } = req.params;
    const { codigo_barra, id_producto, id_ubicacion, cantidad_contada } = req.body;

    try {
        const pool = await poolPromise;

        // 1. Obtener bodega del conteo
        const c = await pool.request()
            .input('id_conteo', sql.Int, id)
            .query(`
        SELECT id_bodega, estado
        FROM Conteos
        WHERE id_conteo = @id_conteo
      `);

        const conteo = c.recordset[0];
        if (!conteo) return res.json({ ok: false, msg: 'Conteo no existe' });
        if (conteo.estado !== 'abierto')
            return res.json({ ok: false, msg: 'Conteo cerrado' });

        // 2. Determinar producto
        let prodId = id_producto;

        if (!prodId && codigo_barra) {
            const prod = await pool.request()
                .input('codigo_barra', sql.VarChar(50), codigo_barra)
                .query(`SELECT id_producto FROM Productos WHERE codigo_barra = @codigo_barra`);

            if (prod.recordset.length === 0)
                return res.json({ ok: false, msg: 'Producto no encontrado' });

            prodId = prod.recordset[0].id_producto;
        }

        if (!prodId)
            return res.json({ ok: false, msg: 'Falta producto' });

        // 3. Obtener stock actual
        const stockRes = await pool.request()
            .input('id_producto', sql.Int, prodId)
            .input('id_bodega', sql.Int, conteo.id_bodega)
            .input('id_ubicacion', sql.Int, id_ubicacion || null)
            .query(`
        SELECT TOP 1 cantidad
        FROM Stock
        WHERE id_producto = @id_producto
        AND id_bodega = @id_bodega
        AND (id_ubicacion = @id_ubicacion OR (@id_ubicacion IS NULL AND id_ubicacion IS NULL))
      `);

        const cantidad_sistema =
            stockRes.recordset.length > 0 ? Number(stockRes.recordset[0].cantidad) : 0;

        const diferencia = cantidad_contada - cantidad_sistema;

        // 4. Ver si ya existe línea
        const existe = await pool.request()
            .input('id_conteo', sql.Int, id)
            .input('id_producto', sql.Int, prodId)
            .input('id_ubicacion', sql.Int, id_ubicacion || null)
            .query(`
        SELECT id_detalle
        FROM ConteoDetalle
        WHERE id_conteo = @id_conteo
        AND id_producto = @id_producto
        AND (id_ubicacion = @id_ubicacion OR (@id_ubicacion IS NULL AND id_ubicacion IS NULL))
      `);

        if (existe.recordset.length > 0) {
            // Actualizar línea
            const id_detalle = existe.recordset[0].id_detalle;

            await pool.request()
                .input('id_detalle', sql.Int, id_detalle)
                .input('cantidad_sistema', sql.Decimal(12, 2), cantidad_sistema)
                .input('cantidad_contada', sql.Decimal(12, 2), cantidad_contada)
                .input('diferencia', sql.Decimal(12, 2), diferencia)
                .query(`
          UPDATE ConteoDetalle
          SET cantidad_sistema = @cantidad_sistema,
              cantidad_contada = @cantidad_contada,
              diferencia = @diferencia
          WHERE id_detalle = @id_detalle
        `);

            return res.json({ ok: true, msg: 'Actualizado', diferencia });
        }

        // 5. Insertar línea nueva
        await pool.request()
            .input('id_conteo', sql.Int, id)
            .input('id_producto', sql.Int, prodId)
            .input('id_ubicacion', sql.Int, id_ubicacion || null)
            .input('cantidad_sistema', sql.Decimal(12, 2), cantidad_sistema)
            .input('cantidad_contada', sql.Decimal(12, 2), cantidad_contada)
            .input('diferencia', sql.Decimal(12, 2), diferencia)
            .query(`
        INSERT INTO ConteoDetalle
        (id_conteo, id_producto, id_ubicacion, cantidad_sistema, cantidad_contada, diferencia)
        VALUES
        (@id_conteo, @id_producto, @id_ubicacion, @cantidad_sistema, @cantidad_contada, @diferencia)
      `);

        res.json({ ok: true, msg: 'Registrado', diferencia });

    } catch (error) {
        console.error('Error registrarLineaConteo:', error);
        res.status(500).json({ ok: false, msg: 'Error al registrar detalle' });
    }
};

// =====================================
// 6. CERRAR CONTEO Y APLICAR AJUSTES
// =====================================
const cerrarConteo = async (req, res) => {
    const { id } = req.params;
    const { aplicarAjustes } = req.body;

    try {
        const pool = await poolPromise;

        // Cabecera
        const c = await pool.request()
            .input('id_conteo', sql.Int, id)
            .query(`
        SELECT id_bodega, estado
        FROM Conteos WHERE id_conteo = @id_conteo
      `);

        if (c.recordset.length === 0)
            return res.json({ ok: false, msg: 'Conteo no existe' });

        if (c.recordset[0].estado === 'cerrado')
            return res.json({ ok: false, msg: 'Conteo ya cerrado' });

        if (aplicarAjustes) {
            // Obtener diferencias != 0
            const det = await pool.request()
                .input('id_conteo', sql.Int, id)
                .query(`
          SELECT id_producto, id_ubicacion, diferencia
          FROM ConteoDetalle
          WHERE diferencia <> 0
        `);

            for (const row of det.recordset) {
                const tipo =
                    row.diferencia > 0 ? 'ajuste_pos' : 'ajuste_neg';

                const cantidad = Math.abs(row.diferencia);

                // Insertar movimiento → el trigger actualiza STOCK
                await pool.request()
                    .input('id_producto', sql.Int, row.id_producto)
                    .input('id_bodega', sql.Int, c.recordset[0].id_bodega)
                    .input('id_ubicacion', sql.Int, row.id_ubicacion || null)
                    .input('tipo_movimiento', sql.VarChar(20), tipo)
                    .input('cantidad', sql.Decimal(12, 2), cantidad)
                    .input('usuario', sql.Int, req.session.user.id)
                    .input('observaciones', sql.Text, `Ajuste generado por cierre de conteo ${id}`)
                    .query(`
            INSERT INTO Movimientos
            (id_producto, id_bodega, id_ubicacion, tipo_movimiento, cantidad, usuario, observaciones)
            VALUES
            (@id_producto, @id_bodega, @id_ubicacion, @tipo_movimiento, @cantidad, @usuario, @observaciones)
          `);
            }
        }

        // Marcar como cerrado
        await pool.request()
            .input('id_conteo', sql.Int, id)
            .query(`UPDATE Conteos SET estado = 'cerrado' WHERE id_conteo = @id_conteo`);

        res.json({ ok: true, msg: 'Conteo cerrado' });

    } catch (error) {
        console.error('Error cerrarConteo:', error);
        res.status(500).json({ ok: false, msg: 'Error al cerrar conteo' });
    }
};

// =====================================
// 7. LISTAR BODEGAS
// =====================================
const listarBodegas = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
      SELECT id_bodega, nombre_bodega
      FROM Bodegas ORDER BY nombre_bodega
    `);

        res.json({ ok: true, bodegas: result.recordset });

    } catch (error) {
        console.error('Error listarBodegas:', error);
        res.status(500).json({ ok: false, msg: 'Error' });
    }
};

// =====================================
// 8. LISTAR UBICACIONES POR BODEGA
// =====================================
const listarUbicaciones = async (req, res) => {
    const { id_bodega } = req.params;

    try {
        const pool = await poolPromise;

        const result = await pool.request()
            .input('id_bodega', sql.Int, id_bodega)
            .query(`
        SELECT id_ubicacion, descripcion
        FROM Ubicaciones
        WHERE id_bodega = @id_bodega
        ORDER BY descripcion
      `);

        res.json({ ok: true, ubicaciones: result.recordset });

    } catch (error) {
        console.error('Error listar ubicaciones:', error);
        res.status(500).json({ ok: false, msg: 'Error ubicaciones' });
    }
};

// =====================================
// 9. LISTAR PRODUCTOS
// =====================================
const listarProductos = async (req, res) => {
    try {
        const pool = await poolPromise;

        const result = await pool.request().query(`
      SELECT id_producto, nombre, codigo_barra
      FROM Productos
      WHERE estado = 'activo'
      ORDER BY nombre
    `);

        res.json({ ok: true, productos: result.recordset });

    } catch (error) {
        console.error('Error listar productos:', error);
        res.status(500).json({ ok: false, msg: 'Error productos' });
    }
};

module.exports = {
    getConteosPage,
    listarConteos,
    crearConteo,
    listarDetalleConteo,
    registrarLineaConteo,
    cerrarConteo,
    listarBodegas,
    listarUbicaciones,
    listarProductos
};
