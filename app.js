const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static(path.join(__dirname, 'public'))); // Servir HTML estático
app.use(express.json()); // 🟢 Para aceptar JSON en POST

const uri = process.env.MONGODB_URI || 'mongodb+srv://vicente:vce.neira12@cluster0.ojt4bpw.mongodb.net/juegos?retryWrites=true&w=majority';
const client = new MongoClient(uri); // No necesitas useNewUrlParser ni useUnifiedTopology en versiones modernas

let collection;

// 🔹 GET - Obtener datos (para Power BI o frontend)
app.get('/api/gatos', async (req, res) => {
  if (!collection) {
    return res.status(503).json({ error: 'Base de datos no disponible aún' });
  }

  try {
    const datos = await collection.find({}).toArray();
    res.json(datos);
  } catch (err) {
    console.error('❌ Error en /api/gatos:', err);
    res.status(500).json({ error: 'Error al obtener datos' });
  }
});

// 🔹 POST - Insertar nuevo juego
app.post('/api/juegos', async (req, res) => {
  if (!collection) {
    return res.status(503).json({ error: 'Base de datos no disponible aún' });
  }

  const nuevoJuego = req.body;

  // Validación simple
  if (!nuevoJuego["Nombre del Juego"] || !nuevoJuego.RAM) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  try {
    const resultado = await collection.insertOne(nuevoJuego);
    res.status(201).json({ mensaje: 'Juego insertado correctamente', id: resultado.insertedId });
  } catch (err) {
    console.error('❌ Error al insertar juego:', err);
    res.status(500).json({ error: 'Error al insertar en la base de datos' });
  }
});

// Página principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar conexión y servidor
async function startServer() {
  try {
    await client.connect();
    const db = client.db('juegos');
    collection = db.collection('r_juegos');
    console.log('✅ Conectado a MongoDB Atlas');
  } catch (err) {
    console.error('❌ Error al conectar con MongoDB:', err);
  }
app.get('/tabla', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'tabla.html')); // Este archivo HTML lo puedes crear
});

  app.listen(PORT, () => {
    console.log(`🚀 Servidor escuchando en http://localhost:${PORT}`);
  });
}

startServer();
