// Importación de módulos necesarios
const express = require('express'); // Framework para crear el servidor y rutas
const { MongoClient } = require('mongodb'); // Cliente para conectar a MongoDB
const cors = require('cors'); // ✅ Permite el acceso a la API desde otros orígenes (CORS)
const path = require('path'); // Módulo para manejar rutas de archivos
const multer = require('multer'); // Middleware para manejar archivos subidos
const XLSX = require('xlsx'); // Librería para leer archivos Excel (.xlsx)

// Inicializa la aplicación Express
const app = express();

// Define el puerto
const PORT = process.env.PORT || 3000;

// ✅ Middleware CORS (habilita acceso desde otras apps como Angular)
app.use(cors({
  origin: 'http://localhost:4200', // ⬅️ Angular en desarrollo corre en este puerto
  optionsSuccessStatus: 200
}));

// Middlewares adicionales
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// URI de conexión a MongoDB
const uri = process.env.MONGODB_URI || 'mongodb+srv://vicente:vce.neira12@cluster0.ojt4bpw.mongodb.net/juegos?retryWrites=true&w=majority';
const client = new MongoClient(uri);

// Configura almacenamiento en memoria para archivos subidos
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Variable global para almacenar una colección
let collection;

/* ========= RUTAS DE API ========= */

app.get('/api/gatos', async (req, res) => {
  if (!collection) return res.status(503).json({ error: 'Base de datos no disponible aún' });

  try {
    const datos = await collection.find({}).toArray();
    res.json(datos);
  } catch (err) {
    console.error('❌ Error en /api/gatos:', err);
    res.status(500).json({ error: 'Error al obtener datos' });
  }
});

app.post('/api/juegos', async (req, res) => {
  if (!collection) return res.status(503).json({ error: 'Base de datos no disponible aún' });

  const nuevoJuego = req.body;
  if (!nuevoJuego["Nombre del Juego"] || !nuevoJuego.RAM) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  try {
    const existe = await collection.findOne({ "Nombre del Juego": nuevoJuego["Nombre del Juego"] });
    if (existe) {
      return res.status(409).json({ error: 'El juego ya existe' });
    }

    const resultado = await collection.insertOne(nuevoJuego);
    res.status(201).json({ mensaje: 'Juego insertado correctamente', id: resultado.insertedId });
  } catch (err) {
    console.error('❌ Error al insertar juego:', err);
    res.status(500).json({ error: 'Error al insertar en la base de datos' });
  }
});

app.post('/api/subir-excel', upload.single('archivo'), async (req, res) => {
  const coleccionNombre = req.body.coleccion;
  if (!req.file) return res.status(400).json({ error: 'No se ha subido ningún archivo' });
  if (!coleccionNombre) return res.status(400).json({ error: 'No se especificó la colección' });

  try {
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const hoja = workbook.Sheets[workbook.SheetNames[0]];
    const datos = XLSX.utils.sheet_to_json(hoja);

    const db = client.db('juegos');
    const coleccion = db.collection(coleccionNombre);
    const resultado = await coleccion.insertMany(datos);

    res.json({
      mensaje: `Archivo procesado. Documentos insertados: ${resultado.insertedCount} en colección "${coleccionNombre}"`,
    });
  } catch (err) {
    console.error('❌ Error al procesar archivo Excel:', err);
    res.status(500).json({ error: 'Error al procesar archivo Excel' });
  }
});


app.get('/juego-mas-popular', async (req, res) => {
  try {
    const db = client.db('juegos');
    const col = db.collection('r_juegos');

    const juegoMasPopular = await col.findOne({}, { sort: { "Cantidad de Usuarios": -1 } });

    if (juegoMasPopular) {
      res.json(juegoMasPopular);
    } else {
      res.status(404).json({ error: 'No se encontró ningún juego' });
    }
  } catch (error) {
    console.error("❌ Error real en /juego-mas-popular:", error);
    res.status(500).json({ error: 'Error al obtener el juego más popular' });
  }
});


app.get('/api/colecciones', async (req, res) => {
  try {
    const db = client.db('juegos');
    const colecciones = await db.listCollections().toArray();
    const nombres = colecciones.map(c => c.name);
    res.json(nombres);
  } catch (err) {
    console.error('❌ Error al obtener colecciones:', err);
    res.status(500).json({ error: 'No se pudieron obtener las colecciones' });
  }
});

app.get('/api/juegos-coleccion', async (req, res) => {
  if (!collection) return res.status(503).json({ error: 'Base de datos no disponible aún' });

  const { coleccion } = req.query;
  if (!coleccion) return res.status(400).json({ error: 'Falta el parámetro coleccion' });

  try {
    const db = client.db('juegos');
    const col = db.collection(coleccion);
    const datos = await col.find({}).toArray();
    res.json(datos);
  } catch (err) {
    console.error('❌ Error al obtener datos de colección:', err);
    res.status(500).json({ error: 'Error al obtener datos de colección' });
  }
});

/* ========= RUTAS HTML ========= */

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/html', 'index.html'));
});

app.get('/subir', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/html', 'subir.html'));
});


app.get('/tabla', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'tabla.html'));
});

/* ========= INICIAR EL SERVIDOR Y CONECTAR A MONGODB ========= */

async function startServer() {
  try {
    await client.connect();
    const db = client.db('juegos');
    collection = db.collection('r_juegos');

    await collection.createIndex({ "Nombre del Juego": 1 }, { unique: true });
    console.log('✅ Índice único aplicado a "Nombre del Juego"');
    console.log('✅ Conectado a MongoDB Atlas');

    app.listen(PORT, () => {
      console.log(`🚀 Servidor escuchando en http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Error al conectar con MongoDB:', err);
  }
}

startServer();
