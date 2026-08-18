import { MongoClient } from 'mongodb';

let clientPromise = null;
let indexesEnsured = false;

function getClientPromise() {
  if (!clientPromise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('Falta la variable de entorno MONGODB_URI');
    }
    const client = new MongoClient(uri);
    // Si la conexión falla, limpiamos la promesa cacheada para que el
    // próximo pedido reintente en vez de quedar fallando para siempre en
    // esta misma instancia serverless "tibia".
    clientPromise = client.connect().catch((err) => {
      clientPromise = null;
      throw err;
    });
  }
  return clientPromise;
}

export async function getDb() {
  const client = await getClientPromise();
  const db = client.db(process.env.MONGODB_DB || 'el_oraculo');
  if (!indexesEnsured) {
    indexesEnsured = true;
    // TTL: las salas viejas se autolimpian solas, no hace falta cron.
    db.collection('rooms')
      .createIndex({ createdAt: 1 }, { expireAfterSeconds: 6 * 60 * 60 })
      .catch(() => {});
  }
  return db;
}
