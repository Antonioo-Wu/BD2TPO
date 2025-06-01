const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const RedisStore = require('connect-redis').default;
const Redis = require('ioredis');
const methodOverride = require('method-override');
const prestamoController = require('./controllers/prestamoController');
const path = require('path');

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

mongoose.connect('mongodb://127.0.0.1:27017/biblioteca', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('Conectado a MongoDB'))
    .catch(err => console.error('Error al conectar a MongoDB:', err));

const redisClient = new Redis({
    port: 6380,
    host: '127.0.0.1',
    lazyConnect: true
});

redisClient.on('error', (err) => console.log('Error de Redis:', err));
redisClient.on('connect', () => console.log('Conectado a Redis'));

app.use(session({
    store: new RedisStore({ client: redisClient }),
    secret: 'biblioteca_secreto',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24
    }
}));

app.use((req, res, next) => {
    if (req.session.usuario) {
        res.locals.usuario = req.session.usuario;
    }
    next();
});

app.use(methodOverride('_method'));

const authRouter = require('./routes/auth');
const libroRoutes = require('./routes/libros');
const carritoRoutes = require('./routes/carrito');
const prestamosRoutes = require('./routes/prestamos');

app.use((req, res, next) => {
    const publicRoutes = ['/auth/login', '/auth/logout', '/auth/registro'];
    if (!req.session.usuario && !publicRoutes.includes(req.path)) {
        return res.redirect('/auth/login');
    }
    next();
});

app.use('/auth', authRouter);
app.use('/libros', libroRoutes);
app.use('/carrito', carritoRoutes);
app.use('/prestamos', prestamosRoutes);

app.get('/', (req, res) => {
    if (!req.session.usuario) {
        return res.redirect('/auth/login');
    }
    if (req.session.usuario.rol === 'admin') {
        return res.redirect('/libros');
    }
    res.render('index');
});

setInterval(async () => {
    await prestamoController.procesarDevoluciones();
}, 60000); 


app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('¡Algo salió mal!');
});

app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
}); 