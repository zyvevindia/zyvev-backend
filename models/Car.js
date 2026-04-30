const mongoose = require('mongoose');

const carSchema = new mongoose.Schema(
  {
    name: String,
    brand: String,
    price: Number,
    range: Number,
    image: String
  },
  { timestamps: true }
);

module.exports = mongoose.model('Car', carSchema);