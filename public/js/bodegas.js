// public/js/bodegas.js

let bodegaSeleccionadaId = null;

// =====================================
// INIT
// =====================================
document.addEventListener('DOMContentLoaded', () => {
    cargarBodegas();

    document.getElementById('btnCrearBodega').addEventListener('click', crearBodega);
    document.getElementById('btnActualizarBodega').addEventListener('click', actualizarBodega);

    document.getElementById('btnCrearUbicacion').addEventListener('click', crearUbicacion);
    document.getElementById('btnActualizarUbicacion').addEventListener('click', actualizarUbicacion);
});

function alerta(msg) {
    alert(msg);
}

// =====================================
// 1) BODEGAS
// =====================================

// Listar bodegas
async function cargarBodegas() {
    try {
        const resp = await fetch('/bodegas/api');
        const json = await resp.json();

        const tbody = document.getElementById('tbodyBodegas');
        tbody.innerHTML = '';

        if (!json.ok) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">Error al cargar bodegas</td></tr>`;
            return;
        }

        if (json.bodegas.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">No hay bodegas registradas</td></tr>`;
            return;
        }

        json.bodegas.forEach(b => {
            const tr = document.createElement('tr');
            tr.dataset.id = b.id_bodega;

            tr.innerHTML = `
                <td>${b.id_bodega}</td>
                <td>${b.nombre_bodega}</td>
                <td>${b.comuna || ''}</td>
                <td>${b.ciudad || ''}</td>
                <td>${b.responsable || ''}</td>
                <td class="text-end">
                    <button class="btn btn-sm btn-warning" onclick="abrirModalEditarBodega(${b.id_bodega}); event.stopPropagation();">
                        Editar
                    </button>
                </td>
            `;

            // Click en la fila -> seleccionar bodega y cargar ubicaciones
            tr.addEventListener('click', () => seleccionarBodega(b.id_bodega, tr));

            tbody.appendChild(tr);
        });

    } catch (err) {
        console.error(err);
        alerta('Error al cargar bodegas');
    }
}

function limpiarSeleccionBodegas() {
    document.querySelectorAll('#tbodyBodegas tr').forEach(tr => tr.classList.remove('selected-row'));
}

// Seleccionar bodega y cargar ubicaciones
async function seleccionarBodega(id_bodega, filaDom) {
    bodegaSeleccionadaId = id_bodega;

    limpiarSeleccionBodegas();
    if (filaDom) filaDom.classList.add('selected-row');

    // habilitar botón agregar ubicación
    document.getElementById('btnAddUbicacion').disabled = false;

    cargarUbicaciones(id_bodega);
}

// Crear bodega
async function crearBodega() {
    const nombre = document.getElementById('crearBodegaNombre').value.trim();
    const direccion = document.getElementById('crearBodegaDireccion').value.trim();
    const comuna = document.getElementById('crearBodegaComuna').value.trim();
    const ciudad = document.getElementById('crearBodegaCiudad').value.trim();
    const responsable = document.getElementById('crearBodegaResponsable').value.trim();

    if (!nombre) {
        alerta('El nombre de la bodega es obligatorio');
        return;
    }

    try {
        const resp = await fetch('/bodegas/api', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre_bodega: nombre, direccion, comuna, ciudad, responsable })
        });

        const json = await resp.json();

        if (!json.ok) {
            alerta(json.msg || 'Error al crear bodega');
            return;
        }

        alerta('Bodega creada correctamente');
        bootstrap.Modal.getInstance(document.getElementById('modalCrearBodega')).hide();

        // limpiar campos
        document.getElementById('crearBodegaNombre').value = '';
        document.getElementById('crearBodegaDireccion').value = '';
        document.getElementById('crearBodegaComuna').value = '';
        document.getElementById('crearBodegaCiudad').value = '';
        document.getElementById('crearBodegaResponsable').value = '';

        cargarBodegas();

    } catch (err) {
        console.error(err);
        alerta('Error al crear bodega');
    }
}

// Abrir modal editar bodega
async function abrirModalEditarBodega(id_bodega) {
    try {
        const resp = await fetch(`/bodegas/api/${id_bodega}`);
        const json = await resp.json();

        if (!json.ok) {
            alerta(json.msg || 'Error al obtener bodega');
            return;
        }

        const b = json.bodega;

        document.getElementById('editBodegaId').value = b.id_bodega;
        document.getElementById('editBodegaNombre').value = b.nombre_bodega || '';
        document.getElementById('editBodegaDireccion').value = b.direccion || '';
        document.getElementById('editBodegaComuna').value = b.comuna || '';
        document.getElementById('editBodegaCiudad').value = b.ciudad || '';
        document.getElementById('editBodegaResponsable').value = b.responsable || '';

        new bootstrap.Modal(document.getElementById('modalEditarBodega')).show();

    } catch (err) {
        console.error(err);
        alerta('Error al abrir bodega');
    }
}

// Actualizar bodega
async function actualizarBodega() {
    const id_bodega = document.getElementById('editBodegaId').value;
    const nombre = document.getElementById('editBodegaNombre').value.trim();
    const direccion = document.getElementById('editBodegaDireccion').value.trim();
    const comuna = document.getElementById('editBodegaComuna').value.trim();
    const ciudad = document.getElementById('editBodegaCiudad').value.trim();
    const responsable = document.getElementById('editBodegaResponsable').value.trim();

    if (!id_bodega || !nombre) {
        alerta('Faltan datos obligatorios');
        return;
    }

    try {
        const resp = await fetch(`/bodegas/api/${id_bodega}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre_bodega: nombre, direccion, comuna, ciudad, responsable })
        });

        const json = await resp.json();

        if (!json.ok) {
            alerta(json.msg || 'Error al actualizar bodega');
            return;
        }

        alerta('Bodega actualizada correctamente');
        bootstrap.Modal.getInstance(document.getElementById('modalEditarBodega')).hide();
        cargarBodegas();

        // si la bodega editada es la seleccionada, refrescar ubicaciones
        if (bodegaSeleccionadaId && Number(bodegaSeleccionadaId) === Number(id_bodega)) {
            cargarUbicaciones(id_bodega);
        }

    } catch (err) {
        console.error(err);
        alerta('Error al actualizar bodega');
    }
}

// =====================================
// 2) UBICACIONES
// =====================================

// Listar ubicaciones por bodega
async function cargarUbicaciones(id_bodega) {
    const tbody = document.getElementById('tbodyUbicaciones');

    if (!id_bodega) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">Seleccione una bodega</td></tr>`;
        return;
    }

    try {
        const resp = await fetch(`/bodegas/${id_bodega}/ubicaciones/api`);
        const json = await resp.json();

        tbody.innerHTML = '';

        if (!json.ok) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">Error al cargar ubicaciones</td></tr>`;
            return;
        }

        if (json.ubicaciones.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">No hay ubicaciones en esta bodega</td></tr>`;
            return;
        }

        json.ubicaciones.forEach(u => {
            tbody.innerHTML += `
                <tr>
                    <td>${u.id_ubicacion}</td>
                    <td>${u.pasillo || ''}</td>
                    <td>${u.rack || ''}</td>
                    <td>${u.nivel || ''}</td>
                    <td>${u.descripcion || ''}</td>
                    <td class="text-end">
                        <button class="btn btn-sm btn-info text-white" onclick="abrirModalEditarUbicacion(${u.id_ubicacion})">
                            Editar
                        </button>
                    </td>
                </tr>
            `;
        });

    } catch (err) {
        console.error(err);
        alerta('Error al cargar ubicaciones');
    }
}

// Crear ubicación
async function crearUbicacion() {
    if (!bodegaSeleccionadaId) {
        alerta('Debe seleccionar una bodega primero');
        return;
    }

    const pasillo = document.getElementById('crearUbPasillo').value.trim();
    const rack = document.getElementById('crearUbRack').value.trim();
    const nivel = document.getElementById('crearUbNivel').value.trim();
    const descripcion = document.getElementById('crearUbDescripcion').value.trim();

    if (!descripcion) {
        alerta('La descripción de la ubicación es obligatoria');
        return;
    }

    try {
        const resp = await fetch(`/bodegas/${bodegaSeleccionadaId}/ubicaciones/api`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pasillo, rack, nivel, descripcion })
        });

        const json = await resp.json();

        if (!json.ok) {
            alerta(json.msg || 'Error al crear ubicación');
            return;
        }

        alerta('Ubicación creada correctamente');
        bootstrap.Modal.getInstance(document.getElementById('modalCrearUbicacion')).hide();

        // limpiar
        document.getElementById('crearUbPasillo').value = '';
        document.getElementById('crearUbRack').value = '';
        document.getElementById('crearUbNivel').value = '';
        document.getElementById('crearUbDescripcion').value = '';

        cargarUbicaciones(bodegaSeleccionadaId);

    } catch (err) {
        console.error(err);
        alerta('Error al crear ubicación');
    }
}

// Abrir modal editar ubicación
async function abrirModalEditarUbicacion(id_ubicacion) {
    try {
        const resp = await fetch(`/bodegas/ubicaciones/api/${id_ubicacion}`);
        const json = await resp.json();

        if (!json.ok) {
            alerta(json.msg || 'Error al obtener ubicación');
            return;
        }

        const u = json.ubicacion;

        document.getElementById('editUbId').value = u.id_ubicacion;
        document.getElementById('editUbPasillo').value = u.pasillo || '';
        document.getElementById('editUbRack').value = u.rack || '';
        document.getElementById('editUbNivel').value = u.nivel || '';
        document.getElementById('editUbDescripcion').value = u.descripcion || '';

        new bootstrap.Modal(document.getElementById('modalEditarUbicacion')).show();

    } catch (err) {
        console.error(err);
        alerta('Error al abrir ubicación');
    }
}

// Actualizar ubicación
async function actualizarUbicacion() {
    const id_ubicacion = document.getElementById('editUbId').value;
    const pasillo = document.getElementById('editUbPasillo').value.trim();
    const rack = document.getElementById('editUbRack').value.trim();
    const nivel = document.getElementById('editUbNivel').value.trim();
    const descripcion = document.getElementById('editUbDescripcion').value.trim();

    if (!id_ubicacion || !descripcion) {
        alerta('Faltan datos obligatorios');
        return;
    }

    try {
        const resp = await fetch(`/bodegas/ubicaciones/api/${id_ubicacion}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pasillo, rack, nivel, descripcion })
        });

        const json = await resp.json();

        if (!json.ok) {
            alerta(json.msg || 'Error al actualizar ubicación');
            return;
        }

        alerta('Ubicación actualizada correctamente');
        bootstrap.Modal.getInstance(document.getElementById('modalEditarUbicacion')).hide();

        if (bodegaSeleccionadaId) {
            cargarUbicaciones(bodegaSeleccionadaId);
        }

    } catch (err) {
        console.error(err);
        alerta('Error al actualizar ubicación');
    }
}
