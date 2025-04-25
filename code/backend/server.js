const express = require('express');
const fs = require('fs');
const https = require('https');
const { Server } = require('socket.io');
const os = require('os');
const path = require('path');

// Read SSL certificates
let options;
try {
  options = {
    key: fs.readFileSync(path.resolve(__dirname, 'server.key')),
    cert: fs.readFileSync(path.resolve(__dirname, 'server.cert')),
  };
} catch (error) {
  console.error('Error reading SSL certificates:', error.message);
  process.exit(1);
}

const app = express();
app.use(express.static(path.join(__dirname, 'public')));

// Detect Wi-Fi IPv4 Address
function getWiFiIPv4() {
  const interfaces = os.networkInterfaces();

  for (const [name, iface] of Object.entries(interfaces)) {
    if (/Wi-Fi|wlan/i.test(name)) {
      for (const details of iface) {
        if (details.family === 'IPv4' && !details.internal) {
          return details.address;
        }
      }
    }
  }
  return '127.0.0.1'; // Fallback to localhost
}
// Create an HTTPS server
const PORT = process.env.PORT || 8443;

const httpsServer = https.createServer(options, app);

const io = new Server(httpsServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  allowEIO3: true,
});


const onlineUsers = {};

io.on('connection', socket => {
  console.log(`User connected: ${socket.id}`);

  const username = socket.handshake.query.username;
  if (username) {
    onlineUsers[username] = socket.id;
    console.log(`✅ ${username} connected, ID: ${socket.id}`);
    io.emit('online-users', onlineUsers);
  } else {
    console.warn(`⚠️ No username found in socket query for ID ${socket.id}`);
  }  

  socket.on('disconnect', () => {
    const disconnectedUser = Object.keys(onlineUsers).find(
      name => onlineUsers[name] === socket.id
    );
    if (disconnectedUser) {
      delete onlineUsers[disconnectedUser];
      console.log(`❌ ${disconnectedUser} disconnected`);
    }
    io.emit('online-users', onlineUsers);
  });  

  socket.on('call-user', ({ toUsername, offer, fromUsername }) => {
    console.log(`[call-user] from: ${fromUsername} to: ${toUsername}`);
    console.log('📡 Online users map:', onlineUsers);
    const targetSocketId = onlineUsers[toUsername];
    console.log(`📤 Attempting to send offer to ${toUsername} via socket: ${targetSocketId}`);
    if (targetSocketId) {
      console.log(`User ${toUsername} found, emitting call...`);
      io.to(targetSocketId).emit('call-made', {
        callerUsername: fromUsername,
        offer
      });
    } else {
      console.log(`User ${toUsername} is offline!`);
      const callerSocketId = onlineUsers[fromUsername];
      if (callerSocketId) {
        io.to(callerSocketId).emit('user-offline', { toUsername });
      }
    }
  });  

  socket.on('make-answer', ({ toUsername, answer, fromUsername }) => {
    const targetSocketId = onlineUsers[toUsername];
    if (targetSocketId) {
      console.log(`📨 Forwarding answer from ${fromUsername} to ${toUsername}`);
      io.to(targetSocketId).emit('make-answer', {
        answer,
        answererUsername: fromUsername
      });
    }
  });
  

  socket.on('call-request', ({ fromUsername, toUsername }) => {
    const toSocketId = onlineUsers[toUsername];
    if (toSocketId) {
      io.to(toSocketId).emit('incoming-call', { fromUsername });
    } else {
      const fromSocketId = onlineUsers[fromUsername];
      if (fromSocketId) {
        io.to(fromSocketId).emit('user-offline', { toUsername });
      }
    }
  });
  
  socket.on('accept-call', ({ fromUsername, toUsername }) => {
    const fromSocketId = onlineUsers[fromUsername];
    if (fromSocketId) {
      io.to(fromSocketId).emit('call-accepted', { toUsername });
    }
  });  

  socket.on('ice-candidate', ({ toUsername, candidate, fromUsername }) => {
    const targetSocketId = onlineUsers[toUsername];
    if (targetSocketId) {
      io.to(targetSocketId).emit('ice-candidate', { candidate, fromUsername });
    }
  });

  socket.on(
    'reject-call',
    ({ toUsername, reason = 'User rejected the call', fromUsername }) => {
      const targetSocketId = onlineUsers[toUsername];
      if (targetSocketId) {
        io.to(targetSocketId).emit('call-rejected', {
          reason,
          rejectedBy: fromUsername,
        });
      }
    }
  );    

  socket.on('update-mic-status', ({ toUsername, muted }) => {
    const targetSocketId = onlineUsers[toUsername];
    if (targetSocketId) {
      io.to(targetSocketId).emit('update-mic-status', { muted });
    }
  });

  socket.on('recording-started', ({ toUsername }) => {
    const targetSocketId = onlineUsers[toUsername];
    if (targetSocketId) {
      io.to(targetSocketId).emit('recording-started');
    }
  });

  socket.on('recording-stopped', ({ toUsername }) => {
    const targetSocketId = onlineUsers[toUsername];
    if (targetSocketId) {
      io.to(targetSocketId).emit('recording-stopped');
    }
  });

  socket.on('call-ended', ({ toUsername }) => {
    const targetSocketId = onlineUsers[toUsername];
    if (targetSocketId) {
      io.to(targetSocketId).emit('call-ended');
    }
  });

  socket.on('screen-share-started', ({ toUsername }) => {
    const targetSocketId = onlineUsers[toUsername];
    if (targetSocketId) {
      io.to(targetSocketId).emit('screen-share-started');
    }
  });

  socket.on('screen-share-stopped', ({ toUsername }) => {
    const targetSocketId = onlineUsers[toUsername];
    if (targetSocketId) {
      io.to(targetSocketId).emit('screen-share-stopped');
    }
  });
  // Add this new event handler for emoji reactions
  socket.on('reaction', ({ toUsername, emoji }) => {
    const targetSocketId = onlineUsers[toUsername];
    if (targetSocketId) {
      io.to(targetSocketId).emit('reaction', { emoji });
    }
  });

  socket.on('subtitle', ({ toUsername, text }) => {
    const targetSocketId = onlineUsers[toUsername];
    if (targetSocketId) {
      io.to(targetSocketId).emit('subtitle', { text });
    }
  });
});

const localIP = getWiFiIPv4();

app.get('/api/lan-ip', (req, res) => {
  const ip = getWiFiIPv4();
  res.json({ ip });
});

httpsServer.listen(PORT, getWiFiIPv4(), () => {
  const localIP = getWiFiIPv4();
  console.log('✅ Server running at:');
  console.log(`- Local:    https://localhost:${PORT}`);
  console.log(`- Network:  https://${localIP}:${PORT}`);
});
