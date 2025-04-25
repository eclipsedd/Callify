
const express = require('express');
const fs = require('fs');
const https = require('https');
const os = require('os');
const path = require('path');
const app = express();
const PORT = 3000;

const options = {
  key: fs.readFileSync(path.join(__dirname, 'server.key')),
  cert: fs.readFileSync(path.join(__dirname, 'server.cert'))
};

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const dataFilePath = path.join(__dirname, 'data.json');
if (!fs.existsSync(dataFilePath)) fs.writeFileSync(dataFilePath, '[]');

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/signup', (req, res) => res.sendFile(path.join(__dirname, 'public', 'signup.html')));
app.get('/home', (req, res) => res.sendFile(path.join(__dirname, 'public', 'home.html')));
app.get('/search', (req, res) => res.sendFile(path.join(__dirname, 'public', 'search.html')));

app.get('/api/users', (req, res) => {
  try {
    const users = JSON.parse(fs.readFileSync(dataFilePath)).map(({ password, ...rest }) => rest);
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read users data' });
  }
});

app.get('/api/current-user', (req, res) => {
  const username = req.query.username;
  if (!username) return res.status(400).json({ error: 'Username required' });
  res.json({ username });
});

app.get('/api/lan-ip', (req, res) => {
  const interfaces = require('os').networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (
        iface.family === 'IPv4' &&
        !iface.internal &&
        (name.toLowerCase().includes('wi-fi') || name.toLowerCase().includes('eth'))
      ) {
        return res.json({ ip: iface.address });
      }
    }
  }
  res.json({ ip: '127.0.0.1' }); // fallback
});

app.post('/signup', (req, res) => {
  const { username, phone, password } = req.body;
  if (!username || !phone || !password) return res.status(400).send('All fields are required');

  try {
    const users = JSON.parse(fs.readFileSync(dataFilePath));
    const existing = users.find(user => user.username === username || user.phone === phone);
    if (existing) return res.status(400).send('Username or phone number already exists.');

    users.push({ username, phone, password });
    fs.writeFileSync(dataFilePath, JSON.stringify(users, null, 2));
    res.redirect('/login');
  } catch {
    res.status(500).send('Error processing your registration');
  }
});

app.post('/login', (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) return res.status(400).send('Username/phone and password are required');

  try {
    const users = JSON.parse(fs.readFileSync(dataFilePath));
    const user = users.find(user =>
      (user.username === identifier || user.phone === identifier) &&
      user.password === password
    );
    if (user) res.redirect(`/home?username=${encodeURIComponent(user.username)}`);
    else res.status(401).send('Invalid login. Please check your credentials.');
  } catch {
    res.status(500).send('Error during login');
  }
});

app.get('/logout', (req, res) => {
  res.redirect('/');
});

https.createServer(options, app).listen(PORT, () => {
  console.log(`Frontend server running:`);
  console.log(`- Local:   https://localhost:${PORT}`);
});
