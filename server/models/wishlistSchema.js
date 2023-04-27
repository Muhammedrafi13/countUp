const mongoose =require('mongoose')
const Schema = mongoose.Schema;

const wishListSchema = new Schema({
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    products: [
        { product_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true
        }}
    ]
  },
  {timestamps:true}
);
module.exports = mongoose.model('Wishlist',wishListSchema);