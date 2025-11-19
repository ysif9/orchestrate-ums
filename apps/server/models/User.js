const mongoose = require('mongoose');

// Define the schema
const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
        },
        password: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true, // adds createdAt and updatedAt
    }
);

// Create the model
const User = mongoose.model('User', userSchema);

module.exports = User;