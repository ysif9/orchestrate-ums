const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Basic Route
app.get('/', (req, res) => {
    res.json({ message: 'Hello from the Backend!' });
});

// MongoDB Connection (Placeholder)
// mongoose.connect(process.env.MONGO_URI).then(() => console.log("DB Connected"));

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});