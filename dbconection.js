const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// MySQL Connection Configuration
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'srsssmsc_smartlab'
});

// Connect to MySQL
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to database:', err);
    return;
  }
  console.log('Connected to MySQL database!');
});

// Endpoint to fetch data as JSON
app.get('/data', (req, res) => {
  const query = 'SELECT * FROM send_msg'; // Modify query according to your table
  connection.query(query, (error, results) => {
    if (error) {
      console.error('Error fetching data:', error);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }
    res.json(results);
  });
});

// Endpoint to delete data
app.post('/deletedata', (req, res) => {
  const id = req.body.id; // ID to delete, passed in request body
  if (!id) {
    res.status(400).json({ error: 'ID not provided' });
    return;
  }

  const deleteQuery = `DELETE FROM send_msg WHERE id = ${id}`;
  connection.query(deleteQuery, (error, results) => {
    if (error) {
      console.error('Error deleting data:', error);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }
    res.json({ message: 'Record deleted successfully' });
  });
});

// // Start the server on a dynamically assigned port
const port = 52914;
app.listen(port, () => {
    console.log(`Server berjalan di port :: ${port}`);
});

// const server = app.listen(0, () => {
//   const { port } = server.address();
// //   const  port  = 2000
//   console.log(`Server running on port ${port}`);
// });
