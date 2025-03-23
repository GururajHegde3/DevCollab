import http from 'http';
import 'dotenv/config.js';
import app from './app.js';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { generateResult } from './db/services/ai.service.js';
import projectModel from './db/models/project.model.js';

const port = process.env.PORT || 8080;
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

io.use(async (socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers.authorization?.split(' ')[1];
    const projectId = socket.handshake.query.projectId;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return next(new Error('Invalid project id'));
    }

    socket.project = await projectModel.findById(projectId);
    if (!token) {
      return next(new Error('Authentication error'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) {
      return next(new Error('Authentication error'));
    }

    socket.user = decoded;
    next();
  } catch (error) {
    next(error);
  }
});

io.on('connection', (socket) => {
  socket.roomId = socket.project._id.toString();
  console.log('A user connected');
  socket.join(socket.roomId);

  socket.on('project-message',async (data) => {
    const message = data.message; 
    const aiIsPresent = data.message.includes('@ai');

    if (aiIsPresent) {
      const prompt = message.replace('@ai','');
      const result=await generateResult(prompt);
      io.to(socket.roomId).emit('project-message', { message: result, 
        sender:{
          _id:'ai',
          email:'AI',
        }
       });

      return;
    }

    socket.broadcast.to(socket.roomId).emit('project-message', data);
  });


  socket.on('event', (data) => {
    /* … */
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
    socket.leave(socket.roomId);
  });
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
