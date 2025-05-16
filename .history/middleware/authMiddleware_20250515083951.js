// // middleware/authMiddleware.js
// import jwt  from 'jsonwebtoken';
// import User from '../models/userModel.js';

// export async function protect(req, res, next) {
//   const header = req.headers.authorization;
//   if (!header || !header.startsWith('Bearer ')) {
//     return res.status(401).json({ message: 'Not authorized' });
//   }

//   try {
//   const token = header.split(' ')[1];
//   console.log('Token received:', token);
  
//   const decoded = jwt.verify(token, process.env.JWT_SECRET);
//   console.log('Decoded token:', decoded);
  
//   const user = await User.findById(decoded.userId).select('-password');
//   if (!user) {
//     console.log('No user found with ID:', decoded.userId);
//     throw new Error('User not found');
//   }
  
//   req.user = user;
//   next();
// } catch (error) {
//   console.error('Auth middleware error:', error.message);
//   res.status(401).json({ message: 'Token invalid or expired' });
// }
// }
