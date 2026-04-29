const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({
  name: String,
  brand: String,
  price: Number,
  range: Number,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Car', carSchema);