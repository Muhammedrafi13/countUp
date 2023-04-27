const Cart = require('../models/cartSchema');
const User = require('../models/userSchema');
const Product = require('../models/productSchema');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;


//cart 
exports.addToCart = async (req,res)=>{
    try{  
         //need prodcut id and user session id
         console.log(req.query.size,'size')
          let proPrice = await Product.findOne({_id:req.params.id})
          let taxAmount = Math.floor(((proPrice.salePrice)/100)*12)
          console.log(taxAmount,'taxxxxxxxxxxx')
          console.log(proPrice,'proPrice')

          let proObj = {
          item : req.params.id,
          quantity: Number(1),
          currentPrice: proPrice.salePrice,
          tax:taxAmount,
          size : req.query.size,
          deliverystatus:'not-shipped',
          orderstatus:'processing'

        }
    
        let userCart = await Cart.findOne({user:req.session.user._id});;
     
        if(userCart){
            let proExist = userCart.products.findIndex(product=> product.item===req.params.id && product.size === req.query.size)
            console.log(proExist,"....proExist")
            if(proExist !=-1){
               await Cart.updateOne({user:req.session.user._id,'products.item':req.params.id},{$inc:{'products.$.quantity':1}});
          
            }else{
               await Cart.updateOne({user:req.session.user._id},{$push:{products:proObj}})
  
  
            }
        }else{
  
          const cartObj = new Cart({
                   user:req.session.user,
                   products:[proObj]
          });
          await Cart.create(cartObj);
        
        }
        res.json({status:true})
  
    }catch(error){
      console.log(error)  
    }
  }
  
  exports.getCartProducts = async (req,res)=>{
    try{
      let cartuuu = await Cart.findOne({user:req.session.user._id})
      console.log(cartuuu,'value')
      let cartItems = await Cart.aggregate([
        {
          $match:{user:req.session.user._id}
        },
        {
          $unwind:'$products'
        },
        {
          $project:{
            item: { $toObjectId: '$products.item' },
            size:'$products.size',
            currentPrice:'$products.currentPrice',
            tax:'$products.tax',
            quantity:'$products.quantity',
            unique_id:'$products._id'
          }
        },
        {
          $lookup:{
            from:'products',
            localField:'item',
            foreignField:'_id',
            as:'productInfo'
          }
        },
        {
          $project:{
            unique_id:1,
            item:1,
            size:1,
            currentPrice:1,
            tax:1,
            quantity:1,
            productInfo:{$arrayElemAt:['$productInfo',0]}
          }
        }
     
      ]);
    

      let displayTotal = await Cart.aggregate([
        {
          $match:{user:req.session.user._id}
        },
        {
          $unwind:'$products'
        },
        {
          $project:{
            item: { $toObjectId: '$products.item' },
            size:'$products.size',
            currentPrice:'$products.currentPrice',
            tax:'$products.tax',
            quantity:'$products.quantity'
          }
        },
        {
          $lookup:{
            from:'products',
            localField:'item',
            foreignField:'_id',
            as:'productInfo'
          }
        },
        {
          $project:{
      
            item:1,
            size:1,
            currentPrice:1,
            tax:1,
            quantity:1,
            productInfo:{$arrayElemAt:['$productInfo',0]}
          }
        },
        {
          $group:{
            _id:null,
           
                totalTax:{$sum:{$multiply:['$quantity','$tax']}},
                total:{$sum:{$multiply:['$quantity','$currentPrice']}},
                totalWithTax: { $sum: { $multiply: ['$quantity', { $add: ['$tax', '$currentPrice'] } ] } }

          }
        }
     
      ]);
      console.log(cartItems,'cart')
      console.log(displayTotal,'dispak')
      let subtotal=0;
      let tax=0;
      let totalWithTax=0;
    if(displayTotal.length>0){
       subtotal=displayTotal[0].total;
       tax =displayTotal[0].totalTax;
       totalWithTax=displayTotal[0].totalWithTax;
    }
       console.log(displayTotal,'....')

      if(req.session.coupon){ 
       
        let backToTotal = await User.findOne({_id:req.session.user._id},{appliedCoupon:1})
        let minPurchase=backToTotal.appliedCoupon[0].minPurchase
        if(minPurchase<=displayTotal[0].total)
        {
          res.locals.couponApplied =req.session.coupon;
        }else{
          await User.updateOne(
            { _id: req.session.user._id },
            { $pull: { appliedCoupon: { status: false } } }
          );
           req.session.couponStatus = null;
          req.session.coupon = null;
        }
      }

      res.render('user/cart',{user:req.session.user,cartItems,noShow:true,subtotal,tax,totalWithTax})
  
    }catch(error){
      console.log(error)
    }
  }
  
  
  exports.changeProductQuantity = async(req,res)=>{
  
  

   
    try{
       let response ={};
      let count =req.body.count
      let quantity =req.body.quantity
      let unique_id=new ObjectId(req.body.product)
      count = parseInt(count)
      quantity = parseInt(quantity)
           if(count == -1 && quantity ==1){
  
            await Cart.updateOne(
              { 
                  _id: req.body.cart,
                 'products._id': unique_id
              },
              {
                  $pull: { 'products': { _id: unique_id } }
              }
              );
              response.removeProduct = true;
             
         
          }else{
            await Cart.updateOne({_id:req.body.cart,'products._id':unique_id},{$inc:{'products.$.quantity':count}});
              response.status = true;
           
          }
          let displayTotal = await Cart.aggregate([
            {
              $match:{user:req.session.user._id}
            },
            {
              $unwind:'$products'
            },
            {
              $project:{
                item: { $toObjectId: '$products.item' },
                size:'$products.size',
                currentPrice:'$products.currentPrice',
                tax:'$products.tax',
                quantity:'$products.quantity'
              }
            },
            {
              $lookup:{
                from:'products',
                localField:'item',
                foreignField:'_id',
                as:'productInfo'
              }
            },
            {
              $project:{
          
                item:1,
                size:1,
                currentPrice:1,
                tax:1,
                quantity:1,
                productInfo:{$arrayElemAt:['$productInfo',0]}
              }
            },
            {
              $group:{
                _id:null,
               
                    totalTax:{$sum:{$multiply:['$quantity','$tax']}},
                    total:{$sum:{$multiply:['$quantity','$currentPrice']}},
                    totalWithTax: { $sum: { $multiply: ['$quantity', { $add: ['$tax', '$currentPrice'] } ] } }
    
              }
            }
         
          ]);
          
          console.log(displayTotal,".....dfsad")
          if(count == -1 && quantity ==1){
            if(displayTotal.length===0){
              if(req.session.coupon){ 
       
                let backToTotal = await User.findOne({_id:req.session.user._id},{appliedCoupon:1})
                let minPurchase=backToTotal.appliedCoupon[0].minPurchase
                if(minPurchase<=displayTotal[0].total)
                {
                  response.couponApplied =req.session.coupon;
                }else{
                  await User.updateOne(
                    { _id: req.session.user._id },
                    { $pull: { appliedCoupon: { status: false } } }
                  );
                   req.session.couponStatus = null;
                  req.session.coupon = null;
                }
              }
              response.subtotal=0;
              response.tax=0;
              response.totalWithTax=0;
              res.json(response)
            
            }else{
              if(req.session.coupon){ 
       
                let backToTotal = await User.findOne({_id:req.session.user._id},{appliedCoupon:1})
                let minPurchase=backToTotal.appliedCoupon[0].minPurchase;
               
                if(minPurchase<=displayTotal[0].total)
                {
                  response.couponApplied =req.session.coupon;
                }else{
                  await User.updateOne(
                    { _id: req.session.user._id },
                    { $pull: { appliedCoupon: { status: false } } }
                  );
                   req.session.couponStatus = null;
                  req.session.coupon = null;
                  response.couponApplied=null;
                }
              }
              let subtotal=displayTotal[0].total;
              let tax =displayTotal[0].totalTax;
              let totalWithTax=displayTotal[0].totalWithTax;
              response.subtotal=subtotal;
              response.tax=tax;
              response.totalWithTax=totalWithTax;
              
              res.json(response)
               
            }
            
          }else{
            let subtotal=displayTotal[0].total;
            let tax =displayTotal[0].totalTax;
            let totalWithTax=displayTotal[0].totalWithTax;
            
            let updatedProduct = await Cart.findOne(
              {_id: req.body.cart, 'products._id': unique_id},
              {'products.$': 1}
             ).lean();
             if(req.session.coupon){ 
       
              let backToTotal = await User.findOne({_id:req.session.user._id},{appliedCoupon:1})
              let minPurchase=backToTotal.appliedCoupon[0].minPurchase
              if(minPurchase<=displayTotal[0].total)
              {
                response.couponApplied =req.session.coupon;
              }else{
                await User.updateOne(
                  { _id: req.session.user._id },
                  { $pull: { appliedCoupon: { status: false } } }
                );
                 req.session.couponStatus = null;
                req.session.coupon = null;
              }
            }
            let quantity=updatedProduct.products[0].quantity; 
            response.subtotal=subtotal;
            response.tax=tax;
            response.totalWithTax=totalWithTax;
            response.quantity=quantity;
            res.json(response)
          }
        
          
        
             
         
         
      }catch(error){
           console.log(error,'....errrefr')
       }
}
  
  
  
  
  exports.removeProductCart = async(req,res)=>{
    try{
      console.log(req.body.product,'iddunique')
      let unique_id=new ObjectId(req.body.product)
      console.log(req.body.product,'iddunique')
       await Cart.updateOne(
           { 
                _id: req.body.cart,
                'products._id': unique_id
           },
            {
               $pull: { 'products': { _id: unique_id } }
            }
         );
         let displayTotal = await Cart.aggregate([
          {
            $match:{user:req.session.user._id}
          },
          {
            $unwind:'$products'
          },
          {
            $project:{
              item: { $toObjectId: '$products.item' },
              size:'$products.size',
              currentPrice:'$products.currentPrice',
              tax:'$products.tax',
              quantity:'$products.quantity'
            }
          },
          {
            $lookup:{
              from:'products',
              localField:'item',
              foreignField:'_id',
              as:'productInfo'
            }
          },
          {
            $project:{
        
              item:1,
              size:1,
              currentPrice:1,
              tax:1,
              quantity:1,
              productInfo:{$arrayElemAt:['$productInfo',0]}
            }
          },
          {
            $group:{
              _id:null,
             
                  totalTax:{$sum:{$multiply:['$quantity','$tax']}},
                  total:{$sum:{$multiply:['$quantity','$currentPrice']}},
                  totalWithTax: { $sum: { $multiply: ['$quantity', { $add: ['$tax', '$currentPrice'] } ] } }
  
            }
          }
       
        ]);
        
       let response ={};
        if(displayTotal.length===0){
          if(req.session.coupon){ 
       
            let backToTotal = await User.findOne({_id:req.session.user._id},{appliedCoupon:1})
            let minPurchase=backToTotal.appliedCoupon[0].minPurchase
          
              response.couponApplied =null;
          
              await User.updateOne(
                { _id: req.session.user._id },
                { $pull: { appliedCoupon: { status: false } } }
              );
               req.session.couponStatus = null;
              req.session.coupon = null;
            
          }
          response.subtotal=0;
          response.tax=0;
          response.totalWithTax=0;
          await res.json(response)
        }else{
      

          let subtotal=displayTotal[0].total;
          let tax =displayTotal[0].totalTax;
          let totalWithTax=displayTotal[0].totalWithTax;
          if(req.session.coupon){ 
       
            let backToTotal = await User.findOne({_id:req.session.user._id},{appliedCoupon:1})
            let minPurchase=backToTotal.appliedCoupon[0].minPurchase
            if(minPurchase<=displayTotal[0].total)
            {
              response.couponApplied =req.session.coupon;
            }else{
              await User.updateOne(
                { _id: req.session.user._id },
                { $pull: { appliedCoupon: { status: false } } }
              );
               req.session.couponStatus = null;
              req.session.coupon = null;
            }
          }
          response.subtotal=subtotal;
          response.tax=tax;
          response.totalWithTax=totalWithTax;
          
        
         await res.json(response)
          
        }
         
         
    }catch(error){
      console.log(error)
    }
   
    
  }
  
  exports.checkOutPage = async(req,res)=>{
    
    try {
     
      let displayTotal = await Cart.aggregate([
        {
          $match:{user:req.session.user._id}
        },
        {
          $unwind:'$products'
        },
        {
          $project:{
            item: { $toObjectId: '$products.item' },
            quantity:'$products.quantity'
          }
        },
        {
          $lookup:{  
            from:'products',
            localField:'item',
            foreignField:'_id',
            as:'productInfo'
          }
        },
        {
          $project:{
            item:1,
            quantity:1,
            productInfo:{$arrayElemAt:['$productInfo',0]}
          }
        },
        {
          $group:{
            _id:null,
            total:{$sum:{$multiply:['$quantity','$productInfo.salePrice']}}
          }
        }
     
      ]);
      let cartItems = await Cart.aggregate([
        {
          $match:{user:req.session.user._id}
        },
        {
          $unwind:'$products'
        },
        {
          $project:{
            item: { $toObjectId: '$products.item' },
            quantity:'$products.quantity'
          }
        },
        {
          $lookup:{
            from:'products',
            localField:'item',
            foreignField:'_id',
            as:'productInfo'
          }
        },
        {
          $project:{
            item:1,
            quantity:1,
            productInfo:{$arrayElemAt:['$productInfo',0]}
          }
        }
     
      ]);
  
      let total ;
      let tax;
      let totalWithTax;
      if(displayTotal!=0){
        total = displayTotal[0].total
        tax =Math.floor((total/100)*12)
        totalWithTax =total+tax
      }
      console.log(cartItems,'proaucts...')
   
      let deliveryAddress = await User.findOne({_id:req.session.user._id})
      const userId = req.session.user._id;
      const user = await User.findById(userId);
      const hasAddress = user.address && user.address.length > 0;
      console.log(hasAddress,'trrr')
      let couponDis;
      // if(user.appliedCoupon.length){
      //   let appliedCoupon = user.appliedCoupon[0];
      //   console.log(appliedCoupon,'coup')
      //    couponDis = appliedCoupon.coupondis;
      // }
      console.log(hasAddress,'has address')
      console.log(req.session.coupon)
      if(req.session.coupon){
        couponDis = req.session.coupon.discount
      }
      if(cartItems.length){
       return res.render('user/checkout',{noShow:true,total,user:req.session.user,cartItems,couponDis,hasAddress,deliveryAddress,tax,totalWithTax})

      }else{
        return res.redirect('/')
      }
    } catch (error) {
      console.log(error)
    }
          
  }
  
  exports.productSizeSelector =async(req,res)=>{
      let proId = req.query.proId;
      console.log(proId,'product di')
      if(req.session.user){
        let cartItem = await Cart.findOne({
          user: req.session.user._id,
          products: { 
            $elemMatch: { 
              size: req.params.id,
              item: proId
            } 
          }
        });
        console.log(cartItem,'valeu')
        if (cartItem) {
          return res.json(true)
        } else {
          return res.json(false)
        }
      }else{
        res.redirect('/login')
      }
     
  }