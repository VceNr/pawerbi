const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static(path.join(__dirname, 'public'))); // Servir HTML estático

const uri = process.env.MONGODB_URI || 'mongodb+srv://vicente:vce.neira12@cluster0.ojt4bpw.mongodb.net/videogames?retryWrites=true&w=majority';
const client = new MongoClient(uri); // Ya no uses useNewUrlParser ni useUnifiedTopology

let collection;

app.get('/api/datos', async (req, res) => {
  if (!collection) {
    return res.status(503).json({ error: 'Base de datos no disponible aún' });
  }

  try {
    const datos = await collection.find({}).toArray();
    res.json(datos); // ← Este es el endpoint que Power BI puede usar
  } catch (err) {
    console.error('❌ Error en /api/datos:', err);
    res.status(500).json({ error: 'Error al obtener datos' });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html')); // Sirve HTML principal
});

async function startServer() {
  try {
    await client.connect();
    const db = client.db('videogames');
    collection = db.collection('vj');
    console.log('✅ Conectado a MongoDB Atlas');
  } catch (err) {
    console.error('❌ Error al conectar con MongoDB:', err);
  }

  app.listen(PORT, () => {
    console.log(`🚀 Servidor escuchando en http://localhost:${PORT}`);
  });
}

startServer();
