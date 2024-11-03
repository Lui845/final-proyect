require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const app = express();
const prisma = new PrismaClient();

app.use(express.json());

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('¡Bienvenido!');
});

// Puerto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});


//registro de usuarios
app.post('/register', async (req, res) => {
    const { email, password, name, city, interests } = req.body;
    try {
      // Verificar si el usuario ya existe
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ message: 'El usuario ya existe' });
      }
  
      // Hashear la contraseña
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Crear el nuevo usuario
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          city,
          interests,
        },
      });
  
      res.status(201).json({ message: 'Usuario registrado con éxito', user });
    } catch (error) {
      res.status(500).json({ message: 'Error en el servidor', error });
    }
  });
  
  //login de usuarios
  app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
      // Buscar al usuario por su email
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return res.status(400).json({ message: 'Usuario no encontrado' });
      }
  
      // Verificar la contraseña
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Contraseña incorrecta' });
      }
  
      // Generar un token JWT
      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  
      res.json({ message: 'Inicio de sesión exitoso', token });
    } catch (error) {
      res.status(500).json({ message: 'Error en el servidor', error });
    }
  });
  



  //middleware 
  const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Token requerido' });
  
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) return res.status(403).json({ message: 'Token no válido' });
      req.userId = decoded.userId;
      next();
    });
  };
  



app.post('/posts', authenticateToken, async (req, res) => {
  

  // Ruta para crear un nuevo post
app.post('/posts', async (req, res) => {
  const { content } = req.body;
  const userId = req.userId; // Se obtiene del middleware de autenticación (lo implementaremos más adelante)

  try {
    const post = await prisma.post.create({
      data: {
        content,
        authorId: userId,
      },
    });
    res.status(201).json({ message: 'Post creado con éxito', post });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor', error });
  }
});

// Ruta para obtener todos los posts
app.get('/posts', async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      include: {
        author: {
          select: { name: true },
        },
      },
    });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor', error });
  }
});
});

