# AddInventary  
Sistema de Gestión de Inventario Corporativo  
Desarrollado en **Node.js + Express + SQL Server**, con interfaz HTML5, Bootstrap 5.3 y JavaScript.

---

## 📦 Descripción del proyecto

**AddInventary** es un sistema completo de inventario corporativo orientado a bodegas, operaciones internas y auditoría logística.  
Incluye control de productos, stock, movimientos, conteos, reportes y administración de usuarios.

El sistema está diseñado con enfoque **profesional (ERP/WMS)** y estilo corporativo basado en el esquema visual **WEG (#005387)**.

---

## 🎯 Objetivos del sistema

- Controlar productos con SKU, códigos de barras y categorías.  
- Gestionar stock por bodega y ubicación.  
- Registrar movimientos de entradas, salidas y ajustes.  
- Realizar conteos de inventario con diferencias calculadas automáticamente.  
- Generar reportes avanzados para auditoría.  
- Administrar usuarios, roles y permisos.  
- Mantener trazabilidad y exactitud en cada acción.

---

## 🛠 Tecnologías utilizadas

### **Frontend**
- HTML5  
- CSS3 + Bootstrap 5.3  
- JavaScript (Vanilla)  
- Diseño responsive corporativo  

### **Backend**
- Node.js  
- Express  
- Express-session  
- Bcryptjs  
- Body-parser  

### **Base de datos**
- SQL Server  
- Relaciones con FK, CHECK, triggers y vistas  
- Pool de conexiones optimizado con `mssql`

---

## 🗂 Estructura principal de carpetas

/inventario-app
│
├── app.js
├── package.json
├── /controllers
│ ├── authController.js
│ ├── productoController.js
│ ├── stockController.js
│ ├── movimientoController.js
│ ├── conteoController.js
│ ├── reporteController.js
│ └── usuarioController.js
│
├── /routes
│ ├── authRoutes.js
│ ├── productoRoutes.js
│ ├── stockRoutes.js
│ ├── movimientoRoutes.js
│ ├── conteoRoutes.js
│ ├── reporteRoutes.js
│ └── usuarioRoutes.js
│
├── /views
│ ├── login.html
│ ├── home.html
│ ├── productos.html
│ ├── stock.html
│ ├── movimientos.html
│ ├── conteos.html
│ ├── reportes.html
│ └── usuarios.html
│
└── /public
├── /css
│ └── styles.css
└── /js
├── productos.js
├── stock.js
├── movimientos.js
├── conteos.js
├── reportes.js
└── usuarios.js


---

## 🧩 Módulos del sistema (implementados hasta ahora)

### ✔ **1. Autenticación y sesiones**
- Login con usuario y contraseña encriptada  
- Express-session (toda la app está protegida)  
- Redirección segura  
- Roles y control de permisos  

---

### ✔ **2. Productos**
- Crear, editar, listar y buscar productos  
- Campos: código de barras, SKU, nombre, descripción, marca, categoría, unidad, contenido neto  
- Estados y validaciones  

---

### ✔ **3. Stock**
- Vista por producto + bodega  
- Stock mínimo/máximo  
- Soporte para ubicaciones internas  
- Se actualiza automáticamente por movimientos y conteos  

---

### ✔ **4. Movimientos**
- Movimientos de:
  - ingreso  
  - salida  
  - ajuste (+ / −)  
  - devolución  
- Registro con:
  - fecha  
  - documento  
  - usuario  
  - observaciones  
- Trigger que actualiza el stock inmediatamente  

---

### ✔ **5. Conteos de inventario (Modelo A — Profesional)**
- Crear conteo (cabecera)  
- Ingreso por pistola lectora  
- ConteoDetalle con:
  - cantidad contada  
  - cantidad sistema  
  - diferencia automática  
- Cierre del conteo  
- Aplicación automática de ajustes (movimientos generados)  
- Funcionalidad en una sola página con secciones dinámicas  

---

### ✔ **6. Reportes**
Con pestañas (tabs) profesionales:

**a) Stock**  
- Filtros por bodega, estado, producto  
- Mínimos/máximos  

**b) Movimientos**  
- Filtros por fecha, tipo, producto  
- Orden descendente  

**c) Diferencias de conteo**  
- Filtros por conteo y diferencias ≠ 0  
- Vista de auditoría  

---

### ✔ **7. Administración de usuarios**
- Crear usuario  
- Editar usuario  
- Activar / inactivar  
- Cambiar contraseña (desde modal Editar)  
- Resetear contraseña  
- Solo administradores acceden  

---

## 🧪 Próximos módulos por desarrollar
- Exportación a Excel/PDF para reportes  
- Reglas de contraseñas robustas  
- Auditoría de eventos del sistema  
- CRUD de Bodegas  
- CRUD de Ubicaciones (pasillo / rack / nivel)  
- Configuraciones del sistema  
- Log completo de movimientos internos  

---

## 📌 Estado actual del proyecto
El sistema se encuentra en **etapa de desarrollo avanzado (80%)**, totalmente funcional en los principales módulos operacionales:

- Productos ✔  
- Stock ✔  
- Movimientos ✔  
- Conteos ✔  
- Reportes ✔  
- Usuarios ✔  
- Seguridad con roles ✔  

Restan módulos complementarios y ajustes de producción.

---

## 🚀 Deploy
Próximamente se habilitarán instrucciones para deploy en:

- **Plesk (Windows)**  
- **Railway / Render / Azure**  

---

## 👤 Autor
Daniel Sagua  
Desarrollador — Ingeniería en Informática  
AIEP / WEG Chile  

---

## 📄 Licencia
Proyecto interno corporativo.  
No apto para distribución pública.

