// server.js
import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import path    from 'path';
import { connectDB } from './db.js';
import userRoutes    from './routes/userRoutes.js';
import postRoutes    from './routes/postRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import { protect }   from './middleware/authMiddleware.js';




const app = express();
// Increase payload size limits for JSON and URL-encoded data
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// serve your front-end
app.use(express.static(path.join(process.cwd(), 'pages')));
app.use('/styles',  express.static(path.join(process.cwd(), 'styles')));
app.use('/scripts', express.static(path.join(process.cwd(), 'scripts')));
app.use('/images',  express.static(path.join(process.cwd(), 'images')));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use('/utils',   express.static(path.join(process.cwd(), 'utils')));

app.get('/', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'pages', 'index.html'));
});

// Add redirects for pages that might be linked without .html extension
app.get('/admin', (req, res) => {
  res.redirect('/admin.html');
});

app.get('/login', (req, res) => {
  res.redirect('/index.html');
});

app.get('/posts', (req, res) => {
  res.redirect('/posts.html');
});

app.get('/profile', (req, res) => {
  res.redirect('/profile.html');
});

app.get('/messages', (req, res) => {
  res.redirect('/messages.html');
});

app.get('/forgot-password', (req, res) => {
  res.redirect('/forgot-password.html');
});

app.get('/reset-password', (req, res) => {
  res.redirect('/reset-password.html');
});

// mount your API
app.use('/api/users', userRoutes);

// Messages API - all routes in messageRoutes already have their own protection
app.use('/api/messages', messageRoutes);

// Use middleware only on POST/PUT/DELETE routes, allowing public GET access
app.use('/api/posts', (req, res, next) => {
  if (req.method === 'GET') {
    return postRoutes(req, res, next);
  }
  return protect(req, res, next);
}, postRoutes);


const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await connectDB();              // ← connects and logs the DB name
    app.listen(PORT, () =>
      console.log(`🚀 Server listening on port ${PORT}`)
    );
  } catch (err) {
    console.error('Failed to start app:', err);
    process.exit(1);
  }
}

start();
