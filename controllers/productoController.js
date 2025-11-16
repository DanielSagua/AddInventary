// controllers/productoController.js
const { sql, poolPromise } = require('../models/db');
const path = require('path');

// Enviar la vista HTML
const getProductosPage = (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'productos.html'));
};

// GET /productos/api
const listarProductos = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
      SELECT id_producto, codigo_barra, sku, nombre,
             descripcion, marca, categoria,
             unidad_medida, contenido_neto, estado
      FROM Productos
      WHERE estado = 'activo'
      ORDER BY nombre
    `);

        res.json({ ok: true, productos: result.recordset });
    } catch (error) {
        console.error('Error listarProductos:', error);
        res.status(500).json({ ok: false, msg: 'Error al listar productos' });
    }
};

// GET /productos/api/:id
const obtenerProducto = async (req, res) => {
    const { id } = req.params;

    try {
        const pool = await poolPromise;
        const request = pool.request();
        request.input('id_producto', sql.Int, id);

        const result = await request.query(`
      SELECT TOP 1 id_producto, codigo_barra, sku, nombre,
             descripcion, marca, categoria,
             unidad_medida, contenido_neto, estado
      FROM Productos
      WHERE id_producto = @id_producto
    `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ ok: false, msg: 'Producto no encontrado' });
        }

        res.json({ ok: true, producto: result.recordset[0] });
    } catch (error) {
        console.error('Error obtenerProducto:', error);
        res.status(500).json({ ok: false, msg: 'Error al obtener producto' });
    }
};

// POST /productos/api
const crearProducto = async (req, res) => {
    const {
        codigo_barra,
        sku,
        nombre,
        descripcion,
        marca,
        categoria,
        unidad_medida,
        contenido_neto
    } = req.body;

    if (!nombre || !codigo_barra) {
        return res.status(400).json({ ok: false, msg: 'Nombre y código de barra son obligatorios' });
    }

    try {
        const pool = await poolPromise;
        const request = pool.request();

        request.input('codigo_barra', sql.VarChar(50), codigo_barra || null);
        request.input('sku', sql.VarChar(50), sku || null);
        request.input('nombre', sql.VarChar(150), nombre);
        request.input('descripcion', sql.Text, descripcion || null);
        request.input('marca', sql.VarChar(100), marca || null);
        request.input('categoria', sql.VarChar(100), categoria || null);
        request.input('unidad_medida', sql.VarChar(20), unidad_medida || null);
        request.input('contenido_neto', sql.VarChar(50), contenido_neto || null);

        await request.query(`
      INSERT INTO Productos
      (codigo_barra, sku, nombre, descripcion, marca, categoria, unidad_medida, contenido_neto, estado)
      VALUES
      (@codigo_barra, @sku, @nombre, @descripcion, @marca, @categoria, @unidad_medida, @contenido_neto, 'activo')
    `);

        res.json({ ok: true, msg: 'Producto creado correctamente' });
    } catch (error) {
        console.error('Error crearProducto:', error);
        res.status(500).json({ ok: false, msg: 'Error al crear producto' });
    }
};

// PUT /productos/api/:id
const actualizarProducto = async (req, res) => {
    const { id } = req.params;
    const {
        codigo_barra,
        sku,
        nombre,
        descripcion,
        marca,
        categoria,
        unidad_medida,
        contenido_neto
    } = req.body;

    if (!nombre || !codigo_barra) {
        return res.status(400).json({ ok: false, msg: 'Nombre y código de barra son obligatorios' });
    }

    try {
        const pool = await poolPromise;
        const request = pool.request();

        request.input('id_producto', sql.Int, id);
        request.input('codigo_barra', sql.VarChar(50), codigo_barra || null);
        request.input('sku', sql.VarChar(50), sku || null);
        request.input('nombre', sql.VarChar(150), nombre);
        request.input('descripcion', sql.Text, descripcion || null);
        request.input('marca', sql.VarChar(100), marca || null);
        request.input('categoria', sql.VarChar(100), categoria || null);
        request.input('unidad_medida', sql.VarChar(20), unidad_medida || null);
        request.input('contenido_neto', sql.VarChar(50), contenido_neto || null);

        const result = await request.query(`
      UPDATE Productos
      SET codigo_barra = @codigo_barra,
          sku = @sku,
          nombre = @nombre,
          descripcion = @descripcion,
          marca = @marca,
          categoria = @categoria,
          unidad_medida = @unidad_medida,
          contenido_neto = @contenido_neto
      WHERE id_producto = @id_producto
    `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ ok: false, msg: 'Producto no encontrado' });
        }

        res.json({ ok: true, msg: 'Producto actualizado correctamente' });
    } catch (error) {
        console.error('Error actualizarProducto:', error);
        res.status(500).json({ ok: false, msg: 'Error al actualizar producto' });
    }
};

// DELETE /productos/api/:id
const eliminarProducto = async (req, res) => {
    const { id } = req.params;

    try {
        const pool = await poolPromise;
        const request = pool.request();
        request.input('id_producto', sql.Int, id);

        const result = await request.query(`
      UPDATE Productos
      SET estado = 'inactivo'
      WHERE id_producto = @id_producto
    `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ ok: false, msg: 'Producto no encontrado' });
        }

        res.json({ ok: true, msg: 'Producto eliminado (inactivado)' });
    } catch (error) {
        console.error('Error eliminarProducto:', error);
        res.status(500).json({ ok: false, msg: 'Error al eliminar producto' });
    }
};

module.exports = {
    getProductosPage,
    listarProductos,
    obtenerProducto,
    crearProducto,
    actualizarProducto,
    eliminarProducto
};
