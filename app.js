const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const XLSX = require('xlsx');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

const uri = process.env.MONGODB_URI || 'mongodb+srv://vicente:vce.neira12@cluster0.ojt4bpw.mongodb.net/juegos?retryWrites=true&w=majority';
const client = new MongoClient(uri);
const storage = multer.memoryStorage();
const upload = multer({ storage });

let collection;

// 🔹 GET - Obtener todos los juegos
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

// 🔹 POST - Insertar juego manualmente
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

// 🔹 POST - Subir Excel y evitar duplicados
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

app.get('/api/colecciones', async (req, res) => {
  try {
    const db = client.db('juegos'); // Cambia si usas otro nombre
    const colecciones = await db.listCollections().toArray();
    // Extraemos solo los nombres
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

// Rutas HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.get('/subir', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'subir.html'));
});
app.get('/tabla', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'tabla.html'));
});

// 🔹 Iniciar servidor y conectar MongoDB
async function startServer() {
  try {
    await client.connect();
    const db = client.db('juegos');
    collection = db.collection('r_juegos');

    // Crear índice único
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
