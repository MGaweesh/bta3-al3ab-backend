const mongoose = require('mongoose');

const bundleSchema = new mongoose.Schema({
    title: { type: String, required: true },
    type: { type: String, enum: ['horror', 'action', 'anime', 'other'], default: 'other' },
    description: { type: String, required: true },
    games: [{ type: String }], // Array of strings (Game + Movie names)
    image: { type: String }, // Optional bundle image
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Bundle', bundleSchema);
