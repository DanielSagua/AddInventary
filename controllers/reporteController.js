// controllers/reporteController.js
const { sql, poolPromise } = require('../models/db');


// =======================================================
// ================ 1) REPORTE DE STOCK ===================
// =======================================================
exports.reporteStock = async (req, res) => {

    const { producto, id_bodega, estado } = req.query;

    try {
        const pool = await poolPromise;

        let query = `
            SELECT 
                p.nombre AS nombre_producto,
                p.codigo_barra,
                b.nombre_bodega,
                u.descripcion AS descripcion_ubicacion,
                s.cantidad,
                s.stock_minimo,
                s.stock_maximo
            FROM Stock s
            INNER JOIN Productos p ON p.id_producto = s.id_producto
            INNER JOIN Bodegas b ON b.id_bodega = s.id_bodega
            LEFT JOIN Ubicaciones u ON u.id_ubicacion = s.id_ubicacion
            WHERE 1=1
        `;

        // FILTRO: texto (producto o código)
        if (producto) {
            query += `
                AND (
                    p.nombre LIKE '%${producto}%'
                    OR p.codigo_barra LIKE '%${producto}%'
                    OR p.sku LIKE '%${producto}%'
                )
            `;
        }

        // FILTRO: bodega
        if (id_bodega) {
            query += ` AND s.id_bodega = ${id_bodega} `;
        }

        // FILTRO: estado
        if (estado === 'con') {
            query += ` AND s.cantidad > 0 `;
        } else if (estado === 'sin') {
            query += ` AND s.cantidad = 0 `;
        } else if (estado === 'bajo') {
            query += ` AND s.cantidad < s.stock_minimo `;
        }

        const result = await pool.request().query(query);

        res.json({ ok: true, data: result.recordset });

    } catch (err) {
        console.error("Error reporteStock:", err);
        res.json({ ok: false, msg: 'Error al obtener reporte de stock' });
    }
};



// =======================================================
// ============= 2) REPORTE DE MOVIMIENTOS ================
// =======================================================
exports.reporteMovimientos = async (req, res) => {

    const { desde, hasta, tipo, producto } = req.query;

    try {
        const pool = await poolPromise;

        let query = `
            SELECT 
                m.fecha_movimiento,
                m.tipo_movimiento,
                m.cantidad,
                p.nombre AS nombre_producto,
                b.nombre_bodega,
                CONCAT(
                    ISNULL(u.pasillo,''), 
                    CASE WHEN u.pasillo IS NOT NULL THEN '/' ELSE '' END,
                    ISNULL(u.rack,''), 
                    CASE WHEN u.rack IS NOT NULL THEN '/' ELSE '' END,
                    ISNULL(u.nivel,''), 
                    CASE WHEN u.nivel IS NOT NULL THEN '' ELSE '' END
                ) AS ubicacion,
                us.nombre AS usuario,
                m.documento,
                m.numero_documento,
                m.observaciones
            FROM Movimientos m
            INNER JOIN Productos p ON p.id_producto = m.id_producto
            INNER JOIN Bodegas b ON b.id_bodega = m.id_bodega
            LEFT JOIN Ubicaciones u ON u.id_ubicacion = m.id_ubicacion
            LEFT JOIN Usuarios us ON us.id_usuario = m.usuario
            WHERE 1=1
        `;

        // FILTRO: fechas
        if (desde) {
            query += ` AND m.fecha_movimiento >= '${desde} 00:00:00' `;
        }
        if (hasta) {
            query += ` AND m.fecha_movimiento <= '${hasta} 23:59:59' `;
        }

        // FILTRO: tipo
        if (tipo) {
            query += ` AND m.tipo_movimiento = '${tipo}' `;
        }

        // FILTRO: producto (texto)
        if (producto) {
            query += `
                AND (
                    p.nombre LIKE '%${producto}%'
                    OR p.codigo_barra LIKE '%${producto}%'
                    OR p.sku LIKE '%${producto}%'
                )
            `;
        }

        query += ` ORDER BY m.fecha_movimiento DESC `;

        const result = await pool.request().query(query);

        res.json({ ok: true, data: result.recordset });

    } catch (err) {
        console.error("Error reporteMovimientos:", err);
        res.json({ ok: false, msg: 'Error al obtener movimientos' });
    }
};



// =======================================================
// ====== 3) REPORTE DE DIFERENCIAS DE CONTEO =============
// =======================================================
exports.reporteDiferencias = async (req, res) => {

    const { id_conteo, solo_con_diferencias } = req.query;

    try {
        const pool = await poolPromise;

        let query = `
            SELECT 
                cd.id_conteo,
                p.nombre AS producto,
                p.codigo_barra,
                cd.cantidad_sistema,
                cd.cantidad_contada,
                cd.diferencia,
                b.nombre_bodega,
                u.descripcion AS ubicacion
            FROM ConteoDetalle cd
            INNER JOIN Productos p ON p.id_producto = cd.id_producto
            INNER JOIN Conteos c ON c.id_conteo = cd.id_conteo
            INNER JOIN Bodegas b ON b.id_bodega = c.id_bodega
            LEFT JOIN Ubicaciones u ON u.id_ubicacion = cd.id_ubicacion
            WHERE 1=1
        `;

        // FILTRO: Un conteo específico
        if (id_conteo) {
            query += ` AND cd.id_conteo = ${id_conteo} `;
        }

        // FILTRO: Solo diferencias != 0
        if (solo_con_diferencias === '1') {
            query += ` AND cd.diferencia <> 0 `;
        }

        query += ` ORDER BY cd.id_conteo DESC, p.nombre `;

        const result = await pool.request().query(query);

        res.json({ ok: true, data: result.recordset });

    } catch (err) {
        console.error("Error reporteDiferencias:", err);
        res.json({ ok: false, msg: 'Error al obtener diferencias de conteo' });
    }
};
