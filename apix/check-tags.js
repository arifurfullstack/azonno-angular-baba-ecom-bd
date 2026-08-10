const path = require('path');
const { MongoClient } = require(path.join(__dirname, 'node_modules', 'mongodb'));
const MONGODB_URI = 'mongodb://127.0.0.1:27017/azonnox_db';

async function checkTags() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db();
  const tags = await db.collection('tags').find({}).toArray();
  console.log('Tags in DB:', tags);
  await client.close();
}
checkTags();
