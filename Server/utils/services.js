const bcrypt = require('bcryptjs');

const saltRounds = 10;

module.exports = {
    hashPassword: async (decryptedPassword) => {
        let _hashed = await bcrypt.hash(decryptedPassword, saltRounds);
        return _hashed;
    },
    hashCompare: async ({password, hashedPassword}) => {
        let _compare = await bcrypt.compare(password, hashedPassword);
        return _compare;
    }
}
  