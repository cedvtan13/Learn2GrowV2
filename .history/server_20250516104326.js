// server.js
import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import path    from 'path';
import { connectDB } from './db.js';
import userRoutes    from './routes/userRoutes.js';




const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// serve your front-end
app.use(express.static(path.join(process.cwd(), 'pages')));
app.use('/styles',  express.static(path.join(process.cwd(), 'styles')));
app.use('/scripts', express.static(path.join(process.cwd(), 'scripts')));
app.use('/images',  express.static(path.join(process.cwd(), 'images')));

app.get('/', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'pages', 'index.html'));
});

// mount your API
app.use('/api/users', userRoutes);


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
