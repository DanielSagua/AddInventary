// public/js/usuarios.js

document.addEventListener('DOMContentLoaded', () => {
    cargarUsuarios();

    // Eventos modales
    document.getElementById("btnCrearUsuario").addEventListener("click", crearUsuario);
    document.getElementById("btnActualizarUsuario").addEventListener("click", actualizarUsuario);
    document.getElementById("btnResetClave").addEventListener("click", resetearClave);
});


// ================================================
// UTILIDAD SIMPLE DE ALERTAS
// ================================================
function alerta(msg) {
    alert(msg);
}



// ================================================
// 1) LISTAR USUARIOS
// ================================================
async function cargarUsuarios() {

    try {
        const resp = await fetch("/usuarios/api");
        const json = await resp.json();

        const tbody = document.getElementById("tablaUsuarios");
        tbody.innerHTML = "";

        if (!json.ok) {
            tbody.innerHTML = `
                <tr><td colspan="6" class="text-center text-muted">Error al cargar usuarios</td></tr>
            `;
            return;
        }

        if (json.usuarios.length === 0) {
            tbody.innerHTML = `
                <tr><td colspan="6" class="text-center text-muted">No hay usuarios</td></tr>
            `;
            return;
        }

        json.usuarios.forEach(u => {
            const estadoClase = u.estado === "activo" ? "text-success fw-bold" : "text-danger fw-bold";

            tbody.innerHTML += `
                <tr>
                    <td>${u.id_usuario}</td>
                    <td>${u.nombre}</td>
                    <td>${u.usuario}</td>
                    <td>${u.rol}</td>
                    <td class="${estadoClase}">${u.estado}</td>
                    <td class="text-end">
                        <button class="btn btn-sm btn-warning me-1" onclick="abrirModalEditar(${u.id_usuario})">
                            Editar
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="abrirModalReset(${u.id_usuario})">
                            Resetear clave
                        </button>
                    </td>
                </tr>
            `;
        });

    } catch (err) {
        console.error(err);
        alerta("Error al cargar usuarios");
    }
}



// ================================================
// 2) CREAR USUARIO
// ================================================
async function crearUsuario() {

    const nombre = document.getElementById("crearNombre").value.trim();
    const usuario = document.getElementById("crearUsuario").value.trim();
    const clave = document.getElementById("crearClave").value.trim();
    const rol = document.getElementById("crearRol").value;

    if (!nombre || !usuario || !clave) {
        alerta("Debe completar todos los campos");
        return;
    }

    try {
        const resp = await fetch("/usuarios/api/crear", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nombre, usuario, clave, rol })
        });

        const json = await resp.json();

        if (!json.ok) {
            alerta(json.msg || "Error al crear usuario");
            return;
        }

        alerta("Usuario creado correctamente");

        // Cerrar modal
        bootstrap.Modal.getInstance(document.getElementById('modalCrear')).hide();

        // Limpiar campos
        document.getElementById("crearNombre").value = "";
        document.getElementById("crearUsuario").value = "";
        document.getElementById("crearClave").value = "";

        cargarUsuarios();

    } catch (err) {
        console.error(err);
        alerta("Error al crear usuario");
    }
}



// ================================================
// 3) ABRIR MODAL EDITAR
// ================================================
async function abrirModalEditar(id) {
    try {
        const resp = await fetch(`/usuarios/api/${id}`);
        const json = await resp.json();

        if (!json.ok) {
            alerta(json.msg || "Error al obtener usuario");
            return;
        }

        const u = json.usuario;

        document.getElementById("editId").value = u.id_usuario;
        document.getElementById("editNombre").value = u.nombre;
        document.getElementById("editRol").value = u.rol;
        document.getElementById("editEstado").value = u.estado;

        // Abrir modal
        new bootstrap.Modal(document.getElementById('modalEditar')).show();

    } catch (err) {
        console.error(err);
        alerta("Error al abrir modal");
    }
}



// ================================================
// 4) ACTUALIZAR USUARIO
// ================================================
async function actualizarUsuario() {

    const id_usuario = document.getElementById("editId").value;
    const nombre = document.getElementById("editNombre").value.trim();
    const rol = document.getElementById("editRol").value;
    const estado = document.getElementById("editEstado").value;
    const clave = document.getElementById("editClave").value.trim(); // <-- Nueva clave opcional

    if (!nombre) {
        alerta("El nombre no puede estar vacío");
        return;
    }

    try {
        const resp = await fetch("/usuarios/api/actualizar", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id_usuario, nombre, rol, estado, clave })
        });

        const json = await resp.json();

        if (!json.ok) {
            alerta(json.msg || "Error al actualizar usuario");
            return;
        }

        alerta("Usuario actualizado correctamente");
        bootstrap.Modal.getInstance(document.getElementById('modalEditar')).hide();
        cargarUsuarios();

    } catch (err) {
        console.error(err);
        alerta("Error al actualizar usuario");
    }
}




// ================================================
// 5) RESETEAR CONTRASEÑA
// ================================================
function abrirModalReset(id) {
    document.getElementById("resetId").value = id;
    document.getElementById("resetClave").value = "";

    new bootstrap.Modal(document.getElementById('modalClave')).show();
}


async function resetearClave() {

    const id_usuario = document.getElementById("resetId").value;
    const clave = document.getElementById("resetClave").value.trim();

    if (!clave) {
        alerta("Debe ingresar la nueva contraseña");
        return;
    }

    try {
        const resp = await fetch("/usuarios/api/resetear-clave", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id_usuario, clave })
        });

        const json = await resp.json();

        if (!json.ok) {
            alerta(json.msg || "Error al resetear contraseña");
            return;
        }

        alerta("Contraseña reseteada correctamente");

        bootstrap.Modal.getInstance(document.getElementById('modalClave')).hide();
        cargarUsuarios();

    } catch (err) {
        console.error(err);
        alerta("Error al resetear contraseña");
    }
}
