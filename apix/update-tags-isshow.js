const path = require('path');
const { MongoClient } = require(path.join(__dirname, 'node_modules', 'mongodb'));
const MONGODB_URI = 'mongodb://127.0.0.1:27017/azonnox_db';

async function updateTagsIsShow() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db();
  const res = await db.collection('tags').updateMany({}, { $set: { isShow: true } });
  console.log('[OK] Updated tags isShow count:', res.modifiedCount);
  await client.close();
}
updateTagsIsShow();
