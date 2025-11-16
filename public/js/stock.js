document.addEventListener('DOMContentLoaded', () => {
    cargarStock();
});

async function cargarStock() {
    try {
        const resp = await fetch('/stock/api');
        const json = await resp.json();

        if (!json.ok) {
            mostrarAlerta("Error al cargar stock", "danger");
            return;
        }

        renderTabla(json.stock);

    } catch (err) {
        console.error("Error cargarStock:", err);
        mostrarAlerta("Error al cargar stock", "danger");
    }
}

function renderTabla(stock = []) {
    const tbody = document.getElementById("tablaStockBody");
    if (!tbody) return;

    if (stock.length === 0) {
        tbody.innerHTML = `
      <tr>
        <td colspan="10" class="text-center text-muted py-3">
          No hay stock registrado.
        </td>
      </tr>
    `;
        return;
    }

    tbody.innerHTML = stock.map(s => {
        const critico = Number(s.cantidad) <= Number(s.stock_minimo);
        const estadoHTML = critico
            ? `<span class="badge bg-danger">Bajo mínimo</span>`
            : `<span class="badge bg-success">OK</span>`;

        return `
      <tr>
        <td>${s.codigo_barra || ""}</td>
        <td>${s.sku || ""}</td>
        <td>${s.nombre}</td>
        <td>${s.bodega}</td>
        <td>${s.ubicacion || "-"}</td>
        <td class="text-end fw-bold">${Number(s.cantidad).toFixed(2)}</td>
        <td class="text-end">${Number(s.stock_minimo).toFixed(2)}</td>
        <td class="text-end">${Number(s.stock_maximo).toFixed(2)}</td>
        <td class="text-end">${estadoHTML}</td>
        <td class="text-end">
          <a href="/movimientos?producto=${s.id_producto}" 
             class="btn btn-sm btn-outline-primary">
            Ver Mov
          </a>
        </td>
      </tr>
    `;
    }).join("");
}

function mostrarAlerta(msg, tipo = "info") {
    const cont = document.getElementById("alertaStock");
    cont.innerHTML = `
    <div class="alert alert-${tipo} alert-dismissible fade show" role="alert">
      ${msg}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>
  `;
}
