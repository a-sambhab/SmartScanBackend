const mongoose = require('mongoose');

const missingDb = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    subject_id: {
        type: String, 
        required: true,
    },
    contact_number: {
        type: String,
        required: true,
    },
    address: {
        type: String,
    },
    image_token: {
        type: String,
        required: true,
    },
    found: {
        type: Boolean,
        default: false,
    },
    image_url:{
        type: String,
        required: true,
    },
    possible_results:{
        type: Array,
        default: [],   
    }
});


module.exports = mongoose.model('missingDb', missingDb);
