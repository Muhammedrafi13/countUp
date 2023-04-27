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
    gender: {
        type: [String],
        enum: ['men', 'women', 'boys', 'girls'] // possible values for gender
      },  
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    },  
    stock :{
        type: Number,
        required: true
    },
    images: [
        { type: String }
    ],
    softdelete:{
        type: Boolean,
        required: true
    }
    
},
{
    timestamps:true,
});

module.exports = mongoose.model('Product',productSchema);

