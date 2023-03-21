const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productSchema = new Schema({
    productName :{
        type: String,
        required: true
    },
    productPrice :{
        type: Number,
        required: true
    },
    salePrice :{
        type: Number,
        required: true
    },
    stock :{
        type: Number,
        required: true
    },
    category :{
        type: String,
        required: true
    },
    images: [
        { type: String }
    ]
    
},
{
    timestamps:true,
});

module.exports = mongoose.model('Product',productSchema);

