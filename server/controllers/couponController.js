const Coupon = require('../models/couponSchema');
var voucher_codes = require('voucher-code-generator');
const User = require('../models/userSchema')
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;


//admin
exports.couponPage = async (req,res)=>{
    let adminDetails =req.session.admin;
    let coupon = await Coupon.find()

    res.locals.coupon = coupon
    res.render('admin/coupon',{admin:true,adminDetails})
}

exports.postCoupon = async (req,res)=>{

    const voucher = voucher_codes.generate({
        prefix: "Cp-",
        length: 7,
        charset: voucher_codes.charset("alphabetic"),
        postfix: "-OFF"
    });
   let strCoupon = voucher.toString()
    const newCoupon = new Coupon({
        couponCode : strCoupon,
        discount :req.body.discount,
        minPurchase: req.body.minPurchase,
        expires : req.body.expires,
        statusEnable: true
    });
    await Coupon.create(newCoupon);

    res.redirect('/admin/coupon')
}
 
exports.disableCoupon = async(req,res)=>{
  try{
    await Coupon.findByIdAndUpdate({ _id: req.params.id },{
      statusEnable: false
    });

    await res.json(true);
    
  }catch(error){
    console.log(error)
  }
}



exports.enableCoupon = async(req,res)=>{
  try{
    await Coupon.findByIdAndUpdate({ _id: req.params.id },{
      statusEnable: true
    });

    await res.json(true);
    
  }catch(error){
    console.log(error)
  }

}
   
exports.editCoupon = async(req,res)=>{
  try{
    let couponId=req.query.couponId;
    let couponDetails= await Coupon.findOne({_id:couponId})
    res.json(couponDetails)
  }catch(error){
    console.log(error)   
  }
     
     
}

exports.updateCoupon = async(req,res)=>{
   try{
    

    let {couponId,couponCode,couponDiscount,couponMinPurchase,couponExp}= req.body;
    let updatedCoupn = await Coupon.findByIdAndUpdate({ _id: couponId},{
      couponCode:couponCode,
      discount:couponDiscount,
      minPurchase:couponMinPurchase,
      expires:couponExp  
    },
    { new: true });

    await res.json(updatedCoupn);
   }catch(error){
    console.log(error)
   }
}















//user
exports.applyCoupon = async(req,res)=>{
  
     let cartTotal = parseInt(req.body.total);
     let matchCouponId = await Coupon.findOne({
      couponCode: req.body.couponId,
      statusEnable: true, // check if the coupon is enabled
      expires: {$gt: Date.now()} // check if the current date is before the expiry date
      });

     if(!matchCouponId){
        return await res.json({ message: 'Invalid coupon code' })
     }else if(cartTotal < matchCouponId.minPurchase) {
        return await res.json({ message: `Coupon requires minimum purchase of Rs . ${matchCouponId.minPurchase}` });
    }

    // let proExist = await User.findOne({_id:req.session.user._id})
    let proExist = await User.aggregate([
        {
          $match: {
            _id: new ObjectId(req.session.user._id),
            appliedCoupon: {
              $elemMatch: {
                applied: req.body.couponId,
                status:true
        
              }
            }
          }
        }
      ]);
    
      
     
      if(proExist.length){
        return await res.json({ message: 'coupon is already applied' })
      }
    
    if (!req.session.couponStatus){
        let user = await User.findOneAndUpdate(
            { _id: req.session.user._id },
            {$push: { 
                appliedCoupon: { applied: req.body.couponId,minPurchase: matchCouponId.minPurchase, coupondis: matchCouponId.discount,status:false }
              
             }},
            { new: true })
             req.session.couponStatus = true;
             const discountedTotal = cartTotal - matchCouponId.discount;
           
             req.session.coupon = matchCouponId;
         
             return await res.json(discountedTotal);
        
     }else{
       return await res.json({ message: 'already applied' })
    }
    
    
    
}

exports.removeCoupon = async(req,res)=>{
  let backToTotal = await User.findOne(
    { _id: req.session.user._id },
    { 
      appliedCoupon: { $elemMatch: { status: false } } 
    }
  );
  
        let response={
           totalBefore:backToTotal.appliedCoupon[0].coupondis
        };
        await User.updateOne(
            { _id: req.session.user._id },
            { $pull: { appliedCoupon: { status: false } } }
          );
           req.session.couponStatus = null;
          req.session.coupon = null;
       await res.json(response)
}