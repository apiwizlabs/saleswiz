const mongoose = require("mongoose");
const config = require("../config.js")

const connectToDatabase = async () => {
let db = null;

return new Promise((resolve, reject) => {
  if(db)
  {
    resolve(db);
    return db;
  }
  else {
    try {
        mongoose.connect(config.DB_URL, {useNewUrlParser: true}, 
          function (err, _db) {
          if(err){
              reject(err);
              return err;
            }
      
            db = _db;
            resolve(_db);
            return _db
      });
    }
    catch(err) {
      console.log(err)
      return err;
    }
  }
})
};

module.exports = connectToDatabase;
