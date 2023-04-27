const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const cartSchema =new Schema({
    user:{
        type:String,
        required :true
    },
    products:[
            {
            item:{
               type:String,
               required:true
            },
            quantity: {
                type:Number,
                required:true
            },
            size:{
                type:String,
                required:true
            },
            currentPrice:{
               type:Number,
               required:true
            },
            tax:{
               type:Number,
               required:true
            },
            orderstatus:{
                type:String,
            }
            ,
            deliverystatus:{
              type: String,
            }  
          }
        
    ]

},
{
    timestamps:true
});

module.exports = mongoose.model('Cart',cartSchema);