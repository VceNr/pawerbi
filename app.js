const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static(path.join(__dirname, 'public'))); // Carpeta para archivos estáticos (HTML, CSS, JS)

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('❌ La variable de entorno MONGODB_URI no está definida.');
  process.exit(1); // Salir si no está configurada la conexión
}

const client = new MongoClient(uri);

let collection;

app.get('/api/datos', async (req, res) => {
  if (!collection) {
    return res.status(503).json({ error: 'Base de datos no disponible aún' });
  }

  try {
    const datos = await collection.find({}).toArray();
    res.json(datos); // Endpoint que puede usar Power BI
  } catch (err) {
    console.error('❌ Error en /api/datos:', err);
    res.status(500).json({ error: 'Error al obtener datos' });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html')); // Sirve página principal
});

async function startServer() {
  try {
    await client.connect();
    const db = client.db('videogames');
    collection = db.collection('vj');
    console.log('✅ Conectado a MongoDB Atlas');

    app.listen(PORT, () => {
      console.log(`🚀 Servidor escuchando en http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Error al conectar con MongoDB:', err);
    process.exit(1); // Terminar proceso si no conecta a Mongo
  }
}

startServer();
