// public/js/movimientos.js

document.addEventListener("DOMContentLoaded", () => {
    cargarProductos();
    cargarBodegas();
    cargarMovimientos();

    document.getElementById("btnAplicarFiltros").addEventListener("click", aplicarFiltros);
    document.getElementById("btnLimpiarFiltros").addEventListener("click", limpiarFiltros);


    const form = document.getElementById("formMovimiento");
    form.addEventListener("submit", enviarMovimiento);

    const selectBodega = document.getElementById("mov_id_bodega");
    selectBodega.addEventListener("change", cargarUbicaciones);
});

async function cargarProductos() {
    try {
        const resp = await fetch("/productos/api");
        const json = await resp.json();

        const select = document.getElementById("mov_id_producto");
        select.innerHTML = `<option value="">Seleccione...</option>`;

        json.productos.forEach(p => {
            select.innerHTML += `<option value="${p.id_producto}">${p.nombre} (${p.codigo_barra})</option>`;
        });

    } catch (err) {
        mostrarAlerta("Error al cargar productos", "danger");
    }
}


async function cargarBodegas() {
    try {
        const resp = await fetch('/bodegas/api');
        const json = await resp.json();

        const cb = document.getElementById('mov_id_bodega');
        cb.innerHTML = '<option value="">Seleccione bodega</option>';

        if (!json.ok) return;

        json.bodegas.forEach(b => {
            cb.innerHTML += `<option value="${b.id_bodega}">${b.nombre_bodega}</option>`;
        });

    } catch (err) {
        console.error("Error cargarBodegas:", err);
    }
}


// OJO: como no tenemos endpoint de bodegas todavía, lo completaré luego
// Por ahora lo dejaremos así: las bodegas se cargarán desde un endpoint temporal directamente en movimientoController
// PARA NO CORTAR EL FLUJO: te agrego el endpoint abajo


async function cargarUbicaciones() {
    const idBodega = document.getElementById("mov_id_bodega").value;

    if (!idBodega) {
        document.getElementById("mov_id_ubicacion").innerHTML = `<option value="">Sin ubicación</option>`;
        return;
    }

    try {
        const resp = await fetch(`/movimientos/api/ubicaciones/${idBodega}`);
        const json = await resp.json();

        const select = document.getElementById("mov_id_ubicacion");
        select.innerHTML = `<option value="">Sin ubicación</option>`;

        json.ubicaciones.forEach(u => {
            select.innerHTML += `<option value="${u.id_ubicacion}">${u.descripcion}</option>`;
        });

    } catch (err) {
        mostrarAlerta("Error cargando ubicaciones", "danger");
    }
}


async function enviarMovimiento(e) {
    e.preventDefault();

    const form = document.getElementById("formMovimiento");
    if (!form.checkValidity()) {
        form.classList.add("was-validated");
        return;
    }

    const data = {
        id_producto: document.getElementById("mov_id_producto").value,
        id_bodega: document.getElementById("mov_id_bodega").value,
        id_ubicacion: document.getElementById("mov_id_ubicacion").value,
        tipo_movimiento: document.getElementById("mov_tipo").value,
        cantidad: document.getElementById("mov_cantidad").value,
        documento: document.getElementById("mov_documento").value,
        numero_documento: document.getElementById("mov_numero_documento").value,
        observaciones: document.getElementById("mov_obs").value
    };

    try {
        const resp = await fetch("/movimientos/api", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        const json = await resp.json();

        if (!json.ok) {
            mostrarAlerta(json.msg, "danger");
            return;
        }

        mostrarAlerta(json.msg, "success");
        form.reset();
        form.classList.remove("was-validated");

        cargarMovimientos();

    } catch (err) {
        mostrarAlerta("Error al registrar movimiento", "danger");
    }
}


async function cargarMovimientos() {
    try {
        const resp = await fetch("/movimientos/api");
        const json = await resp.json();

        const tbody = document.getElementById("tablaMovimientosBody");
        tbody.innerHTML = "";

        json.movimientos.forEach(m => {

            const tipoBadge = tipoMovimientoHTML(m.tipo_movimiento);

            tbody.innerHTML += `
                <tr>
                    <td>${new Date(m.fecha_movimiento).toLocaleString()}</td>
                    <td>${m.producto}</td>
                    <td>${tipoBadge}</td>
                    <td>${m.cantidad}</td>
                    <td>${m.bodega}</td>
                    <td>${m.ubicacion || "-"}</td>
                    <td>${m.documento || ""}</td>
                    <td>${m.numero_documento || ""}</td>
                    <td>${m.observaciones || ""}</td>
                </tr>
            `;
        })
    } catch {
        mostrarAlerta("Error al cargar historial", "danger");
    }
}


function tipoMovimientoHTML(tipo) {
    switch (tipo) {
        case "ingreso": return `<span class="badge bg-success">Ingreso</span>`;
        case "salida": return `<span class="badge bg-danger">Salida</span>`;
        case "ajuste_pos": return `<span class="badge bg-primary">Ajuste +</span>`;
        case "ajuste_neg": return `<span class="badge bg-warning text-dark">Ajuste -</span>`;
        case "devolucion": return `<span class="badge bg-info text-dark">Devolución</span>`;
        default: return tipo;
    }
}


function mostrarAlerta(msg, tipo = "info") {
    const cont = document.getElementById("alertaMov");
    cont.innerHTML = `
      <div class="alert alert-${tipo} alert-dismissible fade show" role="alert">
        ${msg}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
      </div>
    `;
}


async function aplicarFiltros() {

    const params = new URLSearchParams();

    const id_producto = document.getElementById("filtro_producto").value;
    const id_bodega = document.getElementById("filtro_bodega").value;
    const tipo = document.getElementById("filtro_tipo").value;
    const desde = document.getElementById("filtro_desde").value;
    const hasta = document.getElementById("filtro_hasta").value;

    if (id_producto) params.append("id_producto", id_producto);
    if (id_bodega) params.append("id_bodega", id_bodega);
    if (tipo) params.append("tipo_movimiento", tipo);
    if (desde) params.append("desde", desde);
    if (hasta) params.append("hasta", hasta);

    try {
        const resp = await fetch(`/movimientos/api/filtrar?${params.toString()}`);
        const json = await resp.json();

        if (!json.ok) {
            mostrarAlerta("Error al filtrar", "danger");
            return;
        }

        renderMovimientosTabla(json.movimientos);

    } catch (err) {
        mostrarAlerta("Error aplicando filtro", "danger");
    }
}

function limpiarFiltros() {
    document.getElementById("filtro_producto").value = "";
    document.getElementById("filtro_bodega").value = "";
    document.getElementById("filtro_tipo").value = "";
    document.getElementById("filtro_desde").value = "";
    document.getElementById("filtro_hasta").value = "";

    cargarMovimientos();
}

function renderMovimientosTabla(data) {
    const tbody = document.getElementById("tablaMovimientosBody");
    tbody.innerHTML = "";

    data.forEach(m => {
        tbody.innerHTML += `
            <tr>
                <td>${new Date(m.fecha_movimiento).toLocaleString()}</td>
                <td>${m.producto}</td>
                <td>${tipoMovimientoHTML(m.tipo_movimiento)}</td>
                <td>${m.cantidad}</td>
                <td>${m.bodega}</td>
                <td>${m.ubicacion || "-"}</td>
                <td>${m.documento || ""}</td>
                <td>${m.numero_documento || ""}</td>
                <td>${m.observaciones || ""}</td>
            </tr>
        `;
    });
}
