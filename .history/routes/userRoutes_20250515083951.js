// // routes/userRoutes.js

// import jwt      from 'jsonwebtoken';
// import express  from 'express';
// import bcrypt   from 'bcryptjs';
// import User     from '../models/userModel.js';  // import the User model

// const router = express.Router();

// /**
//  * @desc    Register a new user
//  * @route   POST /api/users/register
//  * @access  Public
//  */
// router.post('/register', async (req, res) => {
//   try {
//     const { name, email, password, role } = req.body;

//     if (!name || !email || !password) {
//       return res.status(400).json({ message: 'Name, email and password are required.' });
//     }

//     const exists = await User.findOne({ email });
//     if (exists) {
//       return res.status(400).json({ message: 'Email already in use.' });
//     }

//     const salt = await bcrypt.genSalt(10);
//     const hashed = await bcrypt.hash(password, salt);

//     const user = await User.create({
//       name,
//       email,
//       password: hashed,
//       role: role || 'Recipient'
//     });
//     console.log('✅ Created user document:', user);

//     const { _id, role: userRole } = user;
//     return res.status(201).json({ 
//       _id, 
//       name, 
//       email, 
//       role: userRole 
//     });
//   } catch (err) {
//     console.error(err);
//     return res.status(500).json({ message: 'Server error' });
//   }
// });

// // GET /api/users — return all users (omit passwords)
// router.get('/', async (req, res) => {
//   try {
//     const users = await User.find().select('-password');
//     res.json(users);
//   } catch (err) {
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// router.post('/login', async (req, res) => {
//   const { email, password } = req.body;
//   if (!email || !password) return res.status(400).json({ message: 'Email & password required.' });

//   const user = await User.findOne({ email });
//   if (!user) return res.status(401).json({ message: 'Invalid credentials.' });

//   const ok = await bcrypt.compare(password, user.password);
//   if (!ok) return res.status(401).json({ message: 'Invalid credentials.' });

//   const token = jwt.sign(
//     { userId: user._id, role: user.role },
//     process.env.JWT_SECRET,
//     { expiresIn: '1h' }
//   );

//   res.json({
//     _id:   user._id,
//     name:  user.name,
//     email: user.email,
//     role:  user.role,
//     token
//   });
// });

// export default router;
