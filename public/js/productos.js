// public/js/productos.js

let modalAdd;
let modalEdit;

document.addEventListener('DOMContentLoaded', () => {
    const modalAddEl = document.getElementById('modalProductoAdd');
    const modalEditEl = document.getElementById('modalProductoEdit');

    modalAdd = new bootstrap.Modal(modalAddEl);
    modalEdit = new bootstrap.Modal(modalEditEl);

    const btnNuevo = document.getElementById('btnNuevoProducto');
    const formAdd = document.getElementById('formProductoAdd');
    const formEdit = document.getElementById('formProductoEdit');

    if (btnNuevo) {
        btnNuevo.addEventListener('click', () => {
            formAdd.reset();
            formAdd.classList.remove('was-validated');
            modalAdd.show();

            // Focus en código de barra para pistola
            setTimeout(() => {
                const inputCodigo = document.getElementById('add_codigo_barra');
                if (inputCodigo) inputCodigo.focus();
            }, 300);
        });
    }

    if (formAdd) {
        formAdd.addEventListener('submit', async (e) => {
            e.preventDefault();
            e.stopPropagation();

            if (!formAdd.checkValidity()) {
                formAdd.classList.add('was-validated');
                return;
            }

            const data = {
                codigo_barra: document.getElementById('add_codigo_barra').value.trim(),
                sku: document.getElementById('add_sku').value.trim(),
                nombre: document.getElementById('add_nombre').value.trim(),
                descripcion: document.getElementById('add_descripcion').value.trim(),
                marca: document.getElementById('add_marca').value.trim(),
                categoria: document.getElementById('add_categoria').value.trim(),
                unidad_medida: document.getElementById('add_unidad_medida').value.trim(),
                contenido_neto: document.getElementById('add_contenido_neto').value.trim()
            };

            try {
                const resp = await fetch('/productos/api', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const json = await resp.json();

                if (!json.ok) {
                    mostrarAlerta(json.msg || 'Error al crear producto', 'danger');
                    return;
                }

                mostrarAlerta('Producto creado correctamente', 'success');
                modalAdd.hide();
                cargarProductos();
            } catch (err) {
                console.error('Error al crear producto:', err);
                mostrarAlerta('Error al crear producto', 'danger');
            }
        });
    }

    if (formEdit) {
        formEdit.addEventListener('submit', async (e) => {
            e.preventDefault();
            e.stopPropagation();

            if (!formEdit.checkValidity()) {
                formEdit.classList.add('was-validated');
                return;
            }

            const id = document.getElementById('edit_id_producto').value;

            const data = {
                codigo_barra: document.getElementById('edit_codigo_barra').value.trim(),
                sku: document.getElementById('edit_sku').value.trim(),
                nombre: document.getElementById('edit_nombre').value.trim(),
                descripcion: document.getElementById('edit_descripcion').value.trim(),
                marca: document.getElementById('edit_marca').value.trim(),
                categoria: document.getElementById('edit_categoria').value.trim(),
                unidad_medida: document.getElementById('edit_unidad_medida').value.trim(),
                contenido_neto: document.getElementById('edit_contenido_neto').value.trim()
            };

            try {
                const resp = await fetch(`/productos/api/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const json = await resp.json();

                if (!json.ok) {
                    mostrarAlerta(json.msg || 'Error al actualizar producto', 'danger');
                    return;
                }

                mostrarAlerta('Producto actualizado correctamente', 'success');
                modalEdit.hide();
                cargarProductos();
            } catch (err) {
                console.error('Error al actualizar producto:', err);
                mostrarAlerta('Error al actualizar producto', 'danger');
            }
        });
    }

    // Carga inicial
    cargarProductos();
});

async function cargarProductos() {
    try {
        const resp = await fetch('/productos/api');
        const json = await resp.json();

        if (!json.ok) {
            mostrarAlerta('Error al cargar productos', 'danger');
            return;
        }

        renderTabla(json.productos);
    } catch (err) {
        console.error('Error al cargar productos:', err);
        mostrarAlerta('Error al cargar productos', 'danger');
    }
}

function renderTabla(productos = []) {
    const tbody = document.getElementById('tablaProductosBody');
    if (!tbody) return;

    if (productos.length === 0) {
        tbody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center text-muted py-3">
          No hay productos registrados.
        </td>
      </tr>
    `;
        return;
    }

    tbody.innerHTML = productos.map(p => `
    <tr>
      <td>${p.codigo_barra || ''}</td>
      <td>${p.sku || ''}</td>
      <td>${p.nombre || ''}</td>
      <td>${p.marca || ''}</td>
      <td>${p.categoria || ''}</td>
      <td>${p.unidad_medida || ''}</td>
      <td>${p.contenido_neto || ''}</td>
      <td class="text-end">
        <button class="btn btn-sm btn-outline-primary me-1" onclick="editarProducto(${p.id_producto})">
          Editar
        </button>
        <button class="btn btn-sm btn-outline-danger" onclick="eliminarProducto(${p.id_producto})">
          Eliminar
        </button>
      </td>
    </tr>
  `).join('');
}

async function editarProducto(id) {
    try {
        const resp = await fetch(`/productos/api/${id}`);
        const json = await resp.json();

        if (!json.ok) {
            mostrarAlerta(json.msg || 'Error al obtener producto', 'danger');
            return;
        }

        const p = json.producto;
        document.getElementById('edit_id_producto').value = p.id_producto;
        document.getElementById('edit_codigo_barra').value = p.codigo_barra || '';
        document.getElementById('edit_sku').value = p.sku || '';
        document.getElementById('edit_nombre').value = p.nombre || '';
        document.getElementById('edit_descripcion').value = p.descripcion || '';
        document.getElementById('edit_marca').value = p.marca || '';
        document.getElementById('edit_categoria').value = p.categoria || '';
        document.getElementById('edit_unidad_medida').value = p.unidad_medida || '';
        document.getElementById('edit_contenido_neto').value = p.contenido_neto || '';

        const formEdit = document.getElementById('formProductoEdit');
        formEdit.classList.remove('was-validated');

        modalEdit.show();
    } catch (err) {
        console.error('Error al editar producto:', err);
        mostrarAlerta('Error al cargar datos del producto', 'danger');
    }
}

async function eliminarProducto(id) {
    if (!confirm('¿Seguro que deseas eliminar (inactivar) este producto?')) {
        return;
    }

    try {
        const resp = await fetch(`/productos/api/${id}`, {
            method: 'DELETE'
        });

        const json = await resp.json();

        if (!json.ok) {
            mostrarAlerta(json.msg || 'Error al eliminar producto', 'danger');
            return;
        }

        mostrarAlerta('Producto eliminado (inactivado)', 'success');
        cargarProductos();
    } catch (err) {
        console.error('Error al eliminar producto:', err);
        mostrarAlerta('Error al eliminar producto', 'danger');
    }
}

function mostrarAlerta(mensaje, tipo = 'info') {
    const cont = document.getElementById('alertaProductos');
    if (!cont) return;

    cont.innerHTML = `
    <div class="alert alert-${tipo} alert-dismissible fade show" role="alert">
      ${mensaje}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>
  `;
}
