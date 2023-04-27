const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orderSchema = new Schema({

    deliveryDetails:{
        typeofaddress:{
          type: String,
          required: true
        },
        name:{
          type: String,
          required: true
        },
        mobile:{
          type: String,
          required: true
        },
        address: {
            type: String,
            required: true
            },
        city:{
            type: String,
            required: true
        },
        state:{
          type: String,
          required: true
        },
        zip:{
          type: Number,
          required: true
        }   
     },
    userId: {
        type: String,
        required: true
    },
    paymentMethod: {
        type: String,
        required: true
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
      ],
    tax:{
      type:Number,
      required:true
    },
    couponDiscount:{
      type:Number,
     
    },
    totalAmount: {
        type: Number,
        required:true
      },
    paymentstatus: {
        type: String,
       
      },
 

}
,
{
    timestamps:true
});


  
module.exports= mongoose.model('Order',orderSchema);
