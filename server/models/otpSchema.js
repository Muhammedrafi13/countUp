const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const otpSchema =new Schema({
    email:{
        type: String,
        required: true
    },
    otp:{
        type:Number,
        required:true
    }
},
{
    timestamps:true
});

// create TTL index on createdAt field with expiry of 1 minute
otpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 });

module.exports= mongoose.model('Otp',otpSchema);

