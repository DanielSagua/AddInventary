// public/js/conteos.js

let conteoActivo = null; // { id_conteo, id_bodega, estado, ... }

// ===============================
// INIT
// ===============================
document.addEventListener('DOMContentLoaded', () => {
    cargarBodegas();
    cargarConteos();

    document.getElementById('btnCrearConteo').addEventListener('click', crearConteo);
    document.getElementById('btnRegistrarLinea').addEventListener('click', registrarLineaConteo);
    document.getElementById('btnCerrarConteo').addEventListener('click', cerrarConteo);

    const txtCodigo = document.getElementById('txtCodigo');
    const txtCantidad = document.getElementById('txtCantidad');

    // Enter en código pasa a cantidad
    txtCodigo.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            txtCantidad.focus();
        }
    });

    // Enter en cantidad registra
    txtCantidad.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            registrarLineaConteo();
        }
    });
});

// ===============================
// HELPERS: ALERTAS
// ===============================
function mostrarAlerta(msg, tipo = 'info', tiempo = 4000) {
    let cont = document.getElementById('alertConteos');
    if (!cont) {
        // si no existe contenedor, usar alert simple
        console.log(`[${tipo}] ${msg}`);
        alert(msg);
        return;
    }

    cont.innerHTML = `
      <div class="alert alert-${tipo} alert-dismissible fade show" role="alert">
        ${msg}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
      </div>
    `;

    if (tiempo) {
        setTimeout(() => {
            cont.innerHTML = '';
        }, tiempo);
    }
}

// ===============================
// 1) CARGAR BODEGAS
// ===============================
async function cargarBodegas() {
    try {
        const resp = await fetch('/conteos/api/bodegas');
        const json = await resp.json();

        const cb = document.getElementById('cbBodega');
        cb.innerHTML = '';

        if (!json.ok) {
            cb.innerHTML = '<option value="">Error cargando bodegas</option>';
            return;
        }

        cb.innerHTML = '<option value="">Seleccione bodega...</option>';
        json.bodegas.forEach(b => {
            cb.innerHTML += `<option value="${b.id_bodega}">${b.nombre_bodega}</option>`;
        });

    } catch (err) {
        console.error(err);
        mostrarAlerta('Error al cargar bodegas', 'danger');
    }
}

// ===============================
// 2) LISTAR CONTEOS
// ===============================
async function cargarConteos() {
    try {
        const resp = await fetch('/conteos/api');
        const json = await resp.json();

        const tbody = document.getElementById('tablaConteos');
        tbody.innerHTML = '';

        if (!json.ok) {
            tbody.innerHTML = `
              <tr>
                <td colspan="7" class="text-center text-muted">Error al cargar conteos</td>
              </tr>
            `;
            return;
        }

        if (json.conteos.length === 0) {
            tbody.innerHTML = `
              <tr>
                <td colspan="7" class="text-center text-muted">No hay conteos registrados</td>
              </tr>
            `;
            return;
        }

        json.conteos.forEach(c => {
            const fecha = new Date(c.fecha_creacion).toLocaleString();
            const pillClase = c.estado === 'abierto' ? 'pill-abierto' : 'pill-cerrado';
            const btnTexto = c.estado === 'abierto' ? 'Continuar' : 'Ver';
            const btnClase = c.estado === 'abierto' ? 'btn-outline-primary' : 'btn-outline-secondary';

            tbody.innerHTML += `
              <tr>
                <td>${c.id_conteo}</td>
                <td>${fecha}</td>
                <td>${c.nombre_bodega}</td>
                <td>${c.tipo_conteo}</td>
                <td>
                    <span class="pill ${pillClase}">${c.estado}</span>
                </td>
                <td>${c.usuario_crea || ''}</td>
                <td class="text-end">
                    <button 
                      class="btn btn-sm ${btnClase}" 
                      onclick="abrirConteo(${c.id_conteo})">
                      ${btnTexto}
                    </button>
                </td>
              </tr>
            `;
        });

    } catch (err) {
        console.error(err);
        mostrarAlerta('Error al listar conteos', 'danger');
    }
}

// ===============================
// 3) CREAR CONTEO
// ===============================
async function crearConteo() {
    const id_bodega = document.getElementById('cbBodega').value;
    const tipo_conteo = document.getElementById('cbTipoConteo').value;
    const observaciones = document.getElementById('txtObsConteo').value.trim();

    if (!id_bodega) {
        mostrarAlerta('Debe seleccionar una bodega', 'warning');
        return;
    }

    if (!tipo_conteo) {
        mostrarAlerta('Debe seleccionar un tipo de conteo', 'warning');
        return;
    }

    try {
        const resp = await fetch('/conteos/api', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_bodega, tipo_conteo, observaciones })
        });

        const json = await resp.json();

        if (!json.ok) {
            mostrarAlerta(json.msg || 'Error al crear conteo', 'danger');
            return;
        }

        mostrarAlerta('Conteo creado correctamente', 'success');
        document.getElementById('txtObsConteo').value = '';
        cargarConteos();

        // Abrir automáticamente el conteo recién creado
        if (json.id_conteo) {
            abrirConteo(json.id_conteo);
        }

    } catch (err) {
        console.error(err);
        mostrarAlerta('Error al crear conteo', 'danger');
    }
}

// ===============================
// 4) ABRIR / VER CONTEO
// ===============================
async function abrirConteo(id_conteo) {
    try {
        const resp = await fetch(`/conteos/api/${id_conteo}/detalle`);
        const json = await resp.json();

        if (!json.ok) {
            mostrarAlerta(json.msg || 'No fue posible cargar el conteo', 'danger');
            return;
        }

        conteoActivo = json.header;

        // Mostrar sección de detalle
        document.getElementById('seccionDetalle').classList.remove('hidden');

        // Cargar ubicaciones para la bodega del conteo activo
        await cargarUbicacionesConteo(conteoActivo.id_bodega);

        // Mostrar detalle actual
        renderDetalleConteo(json.detalle);

        // Dejar foco en el código para pistolera
        document.getElementById('txtCodigo').focus();

        // Si el conteo está cerrado, bloquear registro
        const btnReg = document.getElementById('btnRegistrarLinea');
        const btnCerrar = document.getElementById('btnCerrarConteo');
        const txtCodigo = document.getElementById('txtCodigo');
        const txtCantidad = document.getElementById('txtCantidad');
        const cbUbicacion = document.getElementById('cbUbicacion');

        if (conteoActivo.estado === 'cerrado') {
            btnReg.disabled = true;
            btnCerrar.disabled = true;
            txtCodigo.disabled = true;
            txtCantidad.disabled = true;
            cbUbicacion.disabled = true;
        } else {
            btnReg.disabled = false;
            btnCerrar.disabled = false;
            txtCodigo.disabled = false;
            txtCantidad.disabled = false;
            cbUbicacion.disabled = false;
        }

    } catch (err) {
        console.error(err);
        mostrarAlerta('Error al abrir conteo', 'danger');
    }
}

// ===============================
// 5) CARGAR UBICACIONES PARA EL CONTEO
// ===============================
async function cargarUbicacionesConteo(id_bodega) {
    try {
        const resp = await fetch(`/conteos/api/ubicaciones/${id_bodega}`);
        const json = await resp.json();

        const cb = document.getElementById('cbUbicacion');
        cb.innerHTML = '';

        if (!json.ok) {
            cb.innerHTML = '<option value="">Error al cargar ubicaciones</option>';
            return;
        }

        cb.innerHTML = '<option value="">(Sin ubicación)</option>';
        json.ubicaciones.forEach(u => {
            cb.innerHTML += `<option value="${u.id_ubicacion}">${u.descripcion}</option>`;
        });

    } catch (err) {
        console.error(err);
        mostrarAlerta('Error al cargar ubicaciones', 'danger');
    }
}

// ===============================
// 6) RENDER DETALLE DEL CONTEO
// ===============================
function renderDetalleConteo(detalle) {
    const tbody = document.getElementById('tablaDetalle');
    tbody.innerHTML = '';

    if (!detalle || detalle.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="5" class="text-center text-muted">No hay líneas registradas</td>
          </tr>
        `;
        return;
    }

    detalle.forEach(d => {
        const diff = Number(d.diferencia);
        let diffClase = '';

        if (diff > 0) diffClase = 'text-success fw-bold';
        else if (diff < 0) diffClase = 'text-danger fw-bold';

        tbody.innerHTML += `
          <tr>
            <td>${d.producto} <br><small class="text-muted">${d.codigo_barra || ''}</small></td>
            <td>${Number(d.cantidad_sistema).toFixed(2)}</td>
            <td>${Number(d.cantidad_contada).toFixed(2)}</td>
            <td class="${diffClase}">${diff.toFixed(2)}</td>
            <td>${d.ubicacion || ''}</td>
          </tr>
        `;
    });
}

// ===============================
// 7) REGISTRAR LÍNEA DE CONTEO
// ===============================
async function registrarLineaConteo() {
    if (!conteoActivo) {
        mostrarAlerta('Primero abra o cree un conteo', 'warning');
        return;
    }

    if (conteoActivo.estado === 'cerrado') {
        mostrarAlerta('El conteo está cerrado. No puede registrar más líneas.', 'warning');
        return;
    }

    const codigo_barra = document.getElementById('txtCodigo').value.trim();
    const id_ubicacion = document.getElementById('cbUbicacion').value || null;
    const cantidadStr = document.getElementById('txtCantidad').value;

    const cantidad_contada = parseFloat(cantidadStr);

    if (!codigo_barra) {
        mostrarAlerta('Debe ingresar o escanear un código de barra', 'warning');
        return;
    }

    if (isNaN(cantidad_contada) || cantidad_contada < 0) {
        mostrarAlerta('Cantidad contada inválida', 'warning');
        return;
    }

    try {
        const resp = await fetch(`/conteos/api/${conteoActivo.id_conteo}/detalle`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ codigo_barra, id_ubicacion, cantidad_contada })
        });

        const json = await resp.json();

        if (!json.ok) {
            mostrarAlerta(json.msg || 'Error al registrar línea', 'danger');
            return;
        }

        mostrarAlerta(json.msg || 'Línea registrada', 'success', 2500);

        // Limpiar inputs para el siguiente escaneo
        document.getElementById('txtCodigo').value = '';
        document.getElementById('txtCantidad').value = '';
        document.getElementById('txtCodigo').focus();

        // Volver a cargar detalle
        abrirConteo(conteoActivo.id_conteo);

    } catch (err) {
        console.error(err);
        mostrarAlerta('Error al registrar línea', 'danger');
    }
}

// ===============================
// 8) CERRAR CONTEO
// ===============================
async function cerrarConteo() {
    if (!conteoActivo) {
        mostrarAlerta('No hay conteo activo', 'warning');
        return;
    }

    if (conteoActivo.estado === 'cerrado') {
        mostrarAlerta('El conteo ya está cerrado', 'info');
        return;
    }

    const aplicar = confirm('¿Desea aplicar ajustes automáticamente al cerrar el conteo?');

    try {
        const resp = await fetch(`/conteos/api/${conteoActivo.id_conteo}/cerrar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ aplicarAjustes: aplicar })
        });

        const json = await resp.json();

        if (!json.ok) {
            mostrarAlerta(json.msg || 'Error al cerrar conteo', 'danger');
            return;
        }

        mostrarAlerta(json.msg || 'Conteo cerrado', 'success');

        conteoActivo = null;
        document.getElementById('seccionDetalle').classList.add('hidden');
        cargarConteos();

    } catch (err) {
        console.error(err);
        mostrarAlerta('Error al cerrar conteo', 'danger');
    }
}
