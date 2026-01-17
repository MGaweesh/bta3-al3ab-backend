const mongoose = require('mongoose');

const upcomingGameSchema = new mongoose.Schema({
    title: { type: String, required: true },
    platform: { type: String, enum: ['Steam', 'Epic Games', 'GOG Galaxy', 'Other'], required: true },
    unlockDate: { type: Date, required: true },
    description: { type: String },
    image: { type: String }, // URL for the game/platform logo or art
    backgroundImage: { type: String }, // Optional background image
    color: { type: String, default: 'from-gray-900 to-gray-800' }, // Gradient colors
    accent: { type: String, default: 'text-white' }, // Accent color class
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('UpcomingGame', upcomingGameSchema);
