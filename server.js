const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3478;
const DB_FILE = path.join(__dirname, 'data', 'employees.json');

// Ensure data file exists
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
}
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify([], null, 2));
}

function readDB() {
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// List all employees
app.get('/api/employees', (req, res) => {
  res.json(readDB());
});

// Get single employee
app.get('/api/employee/:id', (req, res) => {
  const employee = readDB().find(e => e.id === req.params.id);
  if (!employee) return res.status(404).json({ error: 'Not found' });
  res.json(employee);
});

// Generate new onboarding link
app.post('/api/generate', (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });

  const data = readDB();
  const id = crypto.randomBytes(8).toString('hex');
  const employee = {
    id,
    name: name.trim(),
    createdAt: new Date().toISOString(),
    url: `/onboarding/${id}`
  };
  data.unshift(employee); // newest first
  writeDB(data);
  res.json(employee);
});

// Delete employee
app.delete('/api/employee/:id', (req, res) => {
  const data = readDB().filter(e => e.id !== req.params.id);
  writeDB(data);
  res.json({ success: true });
});

// Serve onboarding page for any id
app.get('/onboarding/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'onboarding.html'));
});

app.listen(PORT, () => {
  console.log(`\n✅ V3 Onboarding App is running`);
  console.log(`🌐 Open: http://localhost:${PORT}\n`);
});
