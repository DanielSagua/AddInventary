// app.js
require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const bodyParser = require('body-parser');


const authRoutes = require('./routes/authRoutes');
const productoRoutes = require('./routes/productoRoutes');
const stockRoutes = require('./routes/stockRoutes');
const movimientoRoutes = require('./routes/movimientoRoutes');
const conteoRoutes = require('./routes/conteoRoutes');
const reporteRoutes = require('./routes/reporteRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const bodegaRoutes = require('./routes/bodegaRoutes');

const { ensureAuthenticated } = require('./middleware/authMiddleware');

const app = express();
const PORT = process.env.PORT || 3003;



// Body parser
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Static
app.use(express.static(path.join(__dirname, 'public')));

// Sesiones
app.use(session({
    secret: process.env.SESSION_SECRET || 'inventario_secret',
    resave: false,
    saveUninitialized: false
}));

// Flash messages
app.use(flash());

// Middleware para pasar mensajes a todas las vistas (si luego usas plantillas)
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    next();
});

// Rutas de autenticación
app.use('/', authRoutes);

// Ruta home protegida
app.get('/home', ensureAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'home.html'));
});

app.use('/productos', ensureAuthenticated, productoRoutes);
app.use('/stock', ensureAuthenticated, stockRoutes);
app.use('/movimientos', ensureAuthenticated, movimientoRoutes);
app.use('/conteos', ensureAuthenticated, conteoRoutes);
app.use('/reportes', ensureAuthenticated, reporteRoutes);
app.use('/usuarios', ensureAuthenticated, usuarioRoutes);
app.use('/bodegas', ensureAuthenticated, bodegaRoutes);

// Redirección raíz
app.get('/', (req, res) => {
    res.redirect('/login');
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor escuchando en http://localhost:${PORT}`);
});
