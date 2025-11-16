// controllers/stockController.js
const { sql, poolPromise } = require('../models/db');
const path = require('path');

const getStockPage = (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'stock.html'));
};

const listarStock = async (req, res) => {
    try {
        const pool = await poolPromise;

        const result = await pool.request().query(`
      SELECT 
        s.id_stock,
        s.cantidad,
        s.stock_minimo,
        s.stock_maximo,

        p.id_producto,
        p.codigo_barra,
        p.sku,
        p.nombre,
        p.marca,
        p.categoria,

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

      FROM Stock s
      INNER JOIN Productos p ON p.id_producto = s.id_producto
      INNER JOIN Bodegas b ON b.id_bodega = s.id_bodega
      LEFT JOIN Ubicaciones u ON u.id_ubicacion = s.id_ubicacion
      WHERE p.estado = 'activo'
      ORDER BY b.nombre_bodega, p.nombre;
    `);

        res.json({ ok: true, stock: result.recordset });

    } catch (error) {
        console.error("Error listarStock:", error);
        res.status(500).json({ ok: false, msg: "Error al obtener stock" });
    }
};

module.exports = {
    getStockPage,
    listarStock
};
