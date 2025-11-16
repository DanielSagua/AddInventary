// public/js/reportes.js

// ===========================================
// INIT
// ===========================================
document.addEventListener('DOMContentLoaded', () => {

    // Cargar combos iniciales
    cargarBodegasStock();

    // Eventos de búsqueda
    document.getElementById('btnBuscarStock').addEventListener('click', buscarStock);
    document.getElementById('btnBuscarMov').addEventListener('click', buscarMovimientos);
    document.getElementById('btnBuscarDif').addEventListener('click', buscarDiferencias);
});


// =============================================================
// UTILIDAD PARA MOSTRAR ALERTAS (si deseas agregarlo visualmente)
// =============================================================
function alerta(msg) {
    alert(msg);
}



// =============================================================
// ===================== 1) REPORTE DE STOCK ====================
// =============================================================

// ----- Cargar bodegas en combo -----
async function cargarBodegasStock() {
    try {
        const resp = await fetch('/conteos/api/bodegas');
        const json = await resp.json();

        const cb = document.getElementById('filtroStockBodega');
        cb.innerHTML = '<option value="">Todas</option>';

        if (!json.ok) return;

        json.bodegas.forEach(b => {
            cb.innerHTML += `<option value="${b.id_bodega}">${b.nombre_bodega}</option>`;
        });

    } catch (err) {
        console.error(err);
    }
}


// ----- Buscar reporte de stock -----
async function buscarStock() {
    const producto = document.getElementById('filtroStockProducto').value.trim();
    const id_bodega = document.getElementById('filtroStockBodega').value;
    const estado = document.getElementById('filtroStockEstado').value;

    const params = new URLSearchParams();

    if (producto) params.append('producto', producto);
    if (id_bodega) params.append('id_bodega', id_bodega);
    if (estado) params.append('estado', estado);

    try {
        const resp = await fetch(`/reportes/stock?${params.toString()}`);
        const json = await resp.json();

        const tbody = document.getElementById('tablaStock');
        tbody.innerHTML = '';

        if (!json.ok || json.data.length === 0) {
            tbody.innerHTML = `
                <tr><td colspan="7" class="text-center text-muted">No hay resultados</td></tr>
            `;
            return;
        }

        json.data.forEach(r => {
            tbody.innerHTML += `
                <tr>
                    <td>${r.nombre_producto}</td>
                    <td>${r.codigo_barra || ''}</td>
                    <td>${r.nombre_bodega}</td>
                    <td>${r.descripcion_ubicacion || ''}</td>
                    <td>${Number(r.cantidad).toFixed(2)}</td>
                    <td>${Number(r.stock_minimo).toFixed(2)}</td>
                    <td>${Number(r.stock_maximo).toFixed(2)}</td>
                </tr>
            `;
        });

    } catch (err) {
        console.error(err);
    }
}



// =============================================================
// ================== 2) REPORTE DE MOVIMIENTOS =================
// =============================================================

async function buscarMovimientos() {

    const desde = document.getElementById('filtroMovDesde').value;
    const hasta = document.getElementById('filtroMovHasta').value;
    const tipo = document.getElementById('filtroMovTipo').value;
    const producto = document.getElementById('filtroMovProducto').value.trim();

    const params = new URLSearchParams();

    if (desde) params.append('desde', desde);
    if (hasta) params.append('hasta', hasta);
    if (tipo) params.append('tipo', tipo);
    if (producto) params.append('producto', producto);

    try {
        const resp = await fetch(`/reportes/movimientos?${params.toString()}`);
        const json = await resp.json();

        const tbody = document.getElementById('tablaMov');
        tbody.innerHTML = '';

        if (!json.ok || json.data.length === 0) {
            tbody.innerHTML = `
                <tr><td colspan="9" class="text-center text-muted">No hay resultados</td></tr>
            `;
            return;
        }

        json.data.forEach(m => {

            const fecha = new Date(m.fecha_movimiento).toLocaleString();

            tbody.innerHTML += `
                <tr>
                    <td>${fecha}</td>
                    <td>${m.tipo_movimiento}</td>
                    <td>${m.nombre_producto}</td>
                    <td>${Number(m.cantidad).toFixed(2)}</td>
                    <td>${m.nombre_bodega}</td>
                    <td>${m.ubicacion || ''}</td>
                    <td>${m.usuario || ''}</td>
                    <td>${m.documento || ''}</td>
                    <td>${m.observaciones || ''}</td>
                </tr>
            `;
        });

    } catch (err) {
        console.error(err);
    }
}



// =============================================================
// ============== 3) REPORTE DE DIFERENCIAS DE CONTEO ===========
// =============================================================

async function buscarDiferencias() {

    const id_conteo = document.getElementById('filtroDifConteo').value;
    const tipo = document.getElementById('filtroDifTipo').value;

    const params = new URLSearchParams();

    if (id_conteo) params.append('id_conteo', id_conteo);
    if (tipo === 'diff') params.append('solo_con_diferencias', '1');

    try {
        const resp = await fetch(`/reportes/diferencias?${params.toString()}`);
        const json = await resp.json();

        const tbody = document.getElementById('tablaDif');
        tbody.innerHTML = '';

        if (!json.ok || json.data.length === 0) {
            tbody.innerHTML = `
                <tr><td colspan="7" class="text-center text-muted">No hay diferencias registradas</td></tr>
            `;
            return;
        }

        json.data.forEach(d => {
            let diffClass = '';
            const diff = Number(d.diferencia);

            if (diff > 0) diffClass = 'text-success fw-bold';
            else if (diff < 0) diffClass = 'text-danger fw-bold';

            tbody.innerHTML += `
                <tr>
                    <td>${d.producto}</td>
                    <td>${d.codigo_barra || ''}</td>
                    <td>${Number(d.cantidad_sistema).toFixed(2)}</td>
                    <td>${Number(d.cantidad_contada).toFixed(2)}</td>
                    <td class="${diffClass}">${diff.toFixed(2)}</td>
                    <td>${d.nombre_bodega || ''}</td>
                    <td>${d.ubicacion || ''}</td>
                </tr>
            `;
        });

    } catch (err) {
        console.error(err);
    }
}
