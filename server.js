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

// 🔥 Seed function
const seedCars = async () => {
  try {
    const count = await Car.countDocuments();

    if (true) {
      await Car.insertMany([
        {
          name: "Nexon EV",
          brand: "Tata",
          price: 1500000,
          range: 300,
          image: "https://images.unsplash.com/photo-1619767886558-efdc259cde1a"
        },
        {
          name: "Tiago EV",
          brand: "Tata",
          price: 900000,
          range: 250,
          image: "https://images.unsplash.com/photo-1580273916550-e323be2ae537"
        },
        {
          name: "MG ZS EV",
          brand: "MG",
          price: 2300000,
          range: 400,
          image: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d"
        }
      ]);

      console.log("🚗 Sample cars inserted");
    }
  } catch (err) {
    console.log(err.message);
  }
};

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB Connected ✅');
    await seedCars();   // 👈 AUTO DATA INSERT
  })
  .catch(err => console.log(err));

// Routes
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

    if (brand) filter.brand = brand;

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

// Leads
app.post('/leads', async (req, res) => {
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

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

mongoose.connect(process.env.MONGO_URI, {
  dbName: "zyvevDB"
})
.then(() => {
  console.log("MongoDB Connected to zyvevDB ✅");
})
.catch(err => console.log(err));