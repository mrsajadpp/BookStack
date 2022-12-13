let MongoClient = require('mongodb').MongoClient;
let state = {
  db: false
}
function connect(done) {
  let url = 'mongodb+srv://sajad:310410@cluster0.okcmril.mongodb.net/?retryWrites=true&w=majority'
  let dbname = 'basket';
  MongoClient.connect(url, (err, data) => {
    if (err) return done(err);
    state.db = data.db(dbname);
  });
  done();
}
function get() { 
  return state.db;
}
module.exports = {
  connect,
  get
};