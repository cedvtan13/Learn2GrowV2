import bcrypt from 'bcrypt';
const saltRounds = 10;
const password = 'penguins123';

bcrypt.hash(password, saltRounds, function(err, hash) {
  console.log(hash);
});