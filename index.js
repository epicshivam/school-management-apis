require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());


const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err.stack);
    return;
  }
  console.log('Connected to MySQL database.');
});


app.post('/addSchool', (req, res) => {
  const { name, address, latitude, longitude } = req.body;

  
  if (!name || !address || !latitude || !longitude) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const query = 'INSERT INTO schools (name, address, latitude, longitude) VALUES (?, ?, ?, ?)';
  db.query(query, [name, address, latitude, longitude], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to add school.' });
    }
    res.status(201).json({ message: 'School added successfully.' });
  });
});


app.get('/listSchools', (req, res) => {
  const { latitude, longitude } = req.query;

  
  if (!latitude || !longitude) {
    return res.status(400).json({ error: 'Latitude and longitude are required.' });
  }

  const query = 'SELECT * FROM schools';
  db.query(query, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to retrieve schools.' });
    }

    
    const userLat = parseFloat(latitude);
    const userLng = parseFloat(longitude);

    const calculateDistance = (lat1, lng1, lat2, lng2) => {
      const toRadians = (deg) => (deg * Math.PI) / 180;
      const R = 6371; // Earth's radius in km
      const dLat = toRadians(lat2 - lat1);
      const dLng = toRadians(lng2 - lng1);
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRadians(lat1)) *
          Math.cos(toRadians(lat2)) *
          Math.sin(dLng / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    const sortedSchools = results.map((school) => ({
      ...school,
      distance: calculateDistance(userLat, userLng, school.latitude, school.longitude),
    })).sort((a, b) => a.distance - b.distance);

    res.json(sortedSchools);
  });
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
