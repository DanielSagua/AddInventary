// controllers/movimientoController.js
const { sql, poolPromise } = require('../models/db');
const path = require('path');

const getMovimientosPage = (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'movimientos.html'));
};

const listarMovimientos = async (req, res) => {
    try {
        const pool = await poolPromise;

        const result = await pool.request().query(`
      SELECT 
        m.id_movimiento,
        m.tipo_movimiento,
        m.cantidad,
        m.fecha_movimiento,
        m.documento,
        m.numero_documento,
        m.observaciones,

        p.nombre AS producto,
        p.codigo_barra AS codigo,
        b.nombre_bodega AS bodega,

        CONCAT(
          ISNULL(u.pasillo, ''),
          CASE WHEN u.pasillo IS NOT NULL THEN ' / ' ELSE '' END,
          ISNULL(u.rack, ''),
          CASE WHEN u.rack IS NOT NULL THEN ' / ' ELSE '' END,
          ISNULL(u.nivel, ''),
          CASE WHEN u.nivel IS NOT NULL THEN ' - ' ELSE '' END,
          ISNULL(u.descripcion, '')
        ) AS ubicacion

      FROM Movimientos m
      INNER JOIN Productos p ON p.id_producto = m.id_producto
      INNER JOIN Bodegas b ON b.id_bodega = m.id_bodega
      LEFT JOIN Ubicaciones u ON u.id_ubicacion = m.id_ubicacion
      ORDER BY m.fecha_movimiento DESC
    `);

        res.json({ ok: true, movimientos: result.recordset });

    } catch (error) {
        console.error("Error listarMovimientos:", error);
        res.status(500).json({ ok: false, msg: 'Error al obtener movimientos' });
    }
};

const crearMovimiento = async (req, res) => {
    const {
        id_producto,
        id_bodega,
        id_ubicacion,
        tipo_movimiento,
        cantidad,
        documento,
        numero_documento,
        observaciones
    } = req.body;

    if (!id_producto || !id_bodega || !tipo_movimiento || !cantidad) {
        return res.status(400).json({ ok: false, msg: "Faltan datos obligatorios" });
    }

    const cant = Number(cantidad);
    if (isNaN(cant) || cant <= 0) {
        return res.status(400).json({ ok: false, msg: "Cantidad inválida" });
    }

    try {
        const pool = await poolPromise;
        const request = pool.request();

        request.input("id_producto", sql.Int, id_producto);
        request.input("id_bodega", sql.Int, id_bodega);
        request.input("id_ubicacion", sql.Int, id_ubicacion || null);
        request.input("tipo_movimiento", sql.VarChar(20), tipo_movimiento);
        request.input("cantidad", sql.Decimal(12, 2), cant);
        request.input("documento", sql.VarChar(50), documento || null);
        request.input("numero_documento", sql.VarChar(50), numero_documento || null);
        request.input("observaciones", sql.Text, observaciones || null);

        // 1️⃣ Insertar movimiento
        await request.query(`
      INSERT INTO Movimientos
      (id_producto, id_bodega, id_ubicacion, tipo_movimiento, cantidad,
       documento, numero_documento, observaciones)
      VALUES
      (@id_producto, @id_bodega, @id_ubicacion, @tipo_movimiento, @cantidad,
       @documento, @numero_documento, @observaciones)
    `);

        // 2️⃣ Verificar si existe stock en esa bodega
        const stockResult = await pool.request()
            .input("id_producto", sql.Int, id_producto)
            .input("id_bodega", sql.Int, id_bodega)
            .query(`
        SELECT TOP 1 *
        FROM Stock
        WHERE id_producto = @id_producto AND id_bodega = @id_bodega
      `);

        let stockActual = stockResult.recordset.length > 0 ? stockResult.recordset[0] : null;

        // 3️⃣ Si no existe stock → crear
        if (!stockActual) {
            await pool.request()
                .input("id_producto", sql.Int, id_producto)
                .input("id_bodega", sql.Int, id_bodega)
                .input("id_ubicacion", sql.Int, id_ubicacion || null)
                .input("cantidad", sql.Decimal(12, 2), cant)
                .query(`
          INSERT INTO Stock (id_producto, id_bodega, id_ubicacion, cantidad)
          VALUES (@id_producto, @id_bodega, @id_ubicacion, @cantidad)
        `);

            return res.json({ ok: true, msg: "Movimiento registrado y stock creado" });
        }

        // 4️⃣ Si existe stock → calcular actualización
        let nuevaCantidad = Number(stockActual.cantidad);

        switch (tipo_movimiento) {
            case "ingreso":
            case "ajuste_pos":
            case "devolucion":
                nuevaCantidad += cant;
                break;

            case "salida":
            case "ajuste_neg":
                nuevaCantidad -= cant;
                if (nuevaCantidad < 0) {
                    return res.status(400).json({ ok: false, msg: "Stock insuficiente" });
                }
                break;

            default:
                return res.status(400).json({ ok: false, msg: "Tipo de movimiento inválido" });
        }

        // 5️⃣ Actualizar el stock
        await pool.request()
            .input("id_stock", sql.Int, stockActual.id_stock)
            .input("nuevaCantidad", sql.Decimal(12, 2), nuevaCantidad)
            .input("id_ubicacion", sql.Int, id_ubicacion || stockActual.id_ubicacion || null)
            .query(`
        UPDATE Stock
        SET cantidad = @nuevaCantidad,
            id_ubicacion = @id_ubicacion
        WHERE id_stock = @id_stock
      `);

        res.json({ ok: true, msg: "Movimiento registrado" });

    } catch (error) {
        console.error("Error crearMovimiento:", error);
        res.status(500).json({ ok: false, msg: 'Error al registrar movimiento' });
    }
};

// GET /movimientos/api/ubicaciones/:id_bodega
const listarUbicacionesPorBodega = async (req, res) => {
    const { id_bodega } = req.params;

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input("id_bodega", sql.Int, id_bodega)
            .query(`
        SELECT id_ubicacion, descripcion
        FROM Ubicaciones
        WHERE id_bodega = @id_bodega
        ORDER BY descripcion
      `);

        res.json({ ok: true, ubicaciones: result.recordset });

    } catch (error) {
        console.error("Error ubicaciones:", error);
        res.status(500).json({ ok: false, msg: "Error al obtener ubicaciones" });
    }
};

// GET /movimientos/api/filtrar
const filtrarMovimientos = async (req, res) => {
    const {
        id_producto,
        id_bodega,
        tipo_movimiento,
        desde,
        hasta
    } = req.query;

    try {
        const pool = await poolPromise;
        let query = `
      SELECT 
        m.id_movimiento,
        m.tipo_movimiento,
        m.cantidad,
        m.fecha_movimiento,
        m.documento,
        m.numero_documento,
        m.observaciones,

        p.nombre AS producto,
        p.codigo_barra AS codigo,
        b.nombre_bodega AS bodega,

        CONCAT(
          ISNULL(u.pasillo, ''),
          CASE WHEN u.pasillo IS NOT NULL THEN ' / ' ELSE '' END,
          ISNULL(u.rack, ''),
          CASE WHEN u.rack IS NOT NULL THEN ' / ' ELSE '' END,
          ISNULL(u.nivel, ''),
          CASE WHEN u.nivel IS NOT NULL THEN ' - ' ELSE '' END,
          ISNULL(u.descripcion, '')
        ) AS ubicacion

      FROM Movimientos m
      INNER JOIN Productos p  ON p.id_producto  = m.id_producto
      INNER JOIN Bodegas b   ON b.id_bodega    = m.id_bodega
      LEFT JOIN Ubicaciones u ON u.id_ubicacion = m.id_ubicacion
      WHERE 1 = 1
    `;

        // filtros dinámicos
        if (id_producto) query += ` AND m.id_producto = ${id_producto}`;
        if (id_bodega) query += ` AND m.id_bodega = ${id_bodega}`;
        if (tipo_movimiento) query += ` AND m.tipo_movimiento = '${tipo_movimiento}'`;
        if (desde) query += ` AND m.fecha_movimiento >= '${desde} 00:00:00'`;
        if (hasta) query += ` AND m.fecha_movimiento <= '${hasta} 23:59:59'`;

        query += ` ORDER BY m.fecha_movimiento DESC`;

        const result = await pool.request().query(query);
        return res.json({ ok: true, movimientos: result.recordset });

    } catch (error) {
        console.error("Error filtrarMovimientos:", error);
        return res.status(500).json({ ok: false, msg: "Error al filtrar movimientos" });
    }
};


module.exports = {
    getMovimientosPage,
    listarMovimientos,
    crearMovimiento,
    listarUbicacionesPorBodega,
    filtrarMovimientos
};
