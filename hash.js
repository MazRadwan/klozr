const bcrypt = require('bcryptjs');
const password = 'testpassword';
const hash = bcrypt.hashSync(password, 10);
console.log(hash);
