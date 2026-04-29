require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Car = require('./models/Car');  
const Lead = require('./models/Lead');
const app = express();

app.use(cors());
app.use(express.json());

// Test route
app.get('/', (req, res) => {
  res.send('Zyvev Backend Running 🚀');
});

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected ✅'))
  .catch(err => console.log(err));

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

app.post('/cars', async (req, res) => {
  try {
    const car = new Car(req.body);
    await car.save();
    res.json(car);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/cars', async (req, res) => {
  try {
    const { brand, minPrice, maxPrice } = req.query;

    let filter = {};

    if (brand) {
      filter.brand = brand;
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    const cars = await Car.find(filter);
    res.json(cars);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/leads', async (req, res) => {
  try {
    const lead = new Lead(req.body);
    await lead.save();
    res.json(lead);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});app.post('/leads', async (req, res) => {
  try {
    const lead = new Lead(req.body);
    await lead.save();
    res.json(lead);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/leads', async (req, res) => {
  try {
    const leads = await Lead.find().populate('carId');
    res.json(leads);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});