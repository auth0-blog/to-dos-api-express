const { getDatabase } = require('./mongo');
const { ObjectID } = require('mongodb');
const { paginate } = require('./../helper');

const collectionName = 'to-dos';

async function insertToDo(toDo) {
  const database = await getDatabase();
  const { insertedId } = await database
    .collection(collectionName)
    .insertOne(toDo);
  return insertedId;
}

async function getToDos(req) {
  const database = await getDatabase();
  const perPage = parseInt(req.query.per_page ? req.query.per_page : 20);
  const rawData = database.collection(collectionName);
  const currentPage = parseInt(req.query.page ? req.query.page : 1);
  const total = await rawData.countDocuments();
  const meta = paginate(perPage, currentPage, total);
  const data = await rawData
    .find({})
    .skip(meta.nextSet)
    .limit(perPage)
    .toArray();
  return { data, meta };
}

async function deleteToDo(id) {
  const database = await getDatabase();
  await database.collection(collectionName).deleteOne({
    _id: new ObjectID(id)
  });
}

async function updateToDo(id, toDo) {
  const database = await getDatabase();
  delete toDo._id;
  await database.collection(collectionName).update(
    { _id: new ObjectID(id) },
    {
      $set: {
        ...toDo
      }
    }
  );
}

module.exports = {
  insertToDo,
  getToDos,
  deleteToDo,
  updateToDo
};
