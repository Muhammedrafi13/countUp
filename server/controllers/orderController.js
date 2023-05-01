const Order = require('../models/orderSchema');
const Cart = require('../models/cartSchema');
const User = require('../models/userSchema');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const Product = require('../models/productSchema');
const Razorpay = require('razorpay');
const paypal = require('paypal-rest-sdk');
//Order 

var instance = new Razorpay({
  key_id: process.env.key_id,
  key_secret: process.env.key_secret,
});

paypal.configure({
  mode: 'sandbox', //sandbox or live
  client_id: process.env.client_id,
  client_secret: process.env.client_secret
});


exports.deliveryAddressSave = async (req, res) => {
  const address = await User.findOneAndUpdate({ _id: req.body.userId },
    {
      $push: {
        address: {
          name: req.body.name,
          mobile: req.body.mobile,
          addressDetails: req.body.addressDetails,
          city: req.body.city,
          state: req.body.state,
          zip: req.body.zip,
          typeOfAddress: req.body.typeOfAddress

        }
      }
    },
    { new: true });

  await res.json(address);
}

exports.placeOrder = async (req, res) => {


  
  let deliveryAddress = await User.findOne(
    { _id: req.body.userId, "address._id": req.body.deliverAddressId },
    { "address.$": 1 }
  );

  let filterAddress = deliveryAddress.address[0]
 
  let cart = await Cart.findOne({ user: req.body.userId });

  
  let status = req.body['payment-method'] === 'COD' ? 'placed' : 'pending'
  let orderObj = new Order({
    deliveryDetails: {
      typeofaddress: filterAddress.typeOfAddress,
      name: filterAddress.name,
      mobile: filterAddress.mobile,
      address: filterAddress.addressDetails,
      city: filterAddress.city,
      state: filterAddress.state,
      zip: filterAddress.zip,

    },
    userId: req.body.userId,
    paymentMethod: req.body['payment-method'],
    products: cart.products,
    tax:req.body.tax,
    couponDiscount:req.body.coupon,
    totalAmount: req.body.totalPrice,
    paymentstatus: status,
    deliverystatus:'not shipped'

  });
  let orderDoc = await Order.create(orderObj);

  let orderId = orderDoc._id
  let orderIdString = orderId.toString();

  if (req.body['payment-method'] == 'COD') {
    res.json({ codSuccess: true })
  } else if (req.body['payment-method'] == 'RazorPay') {
  
    var options = {
      amount: orderDoc.totalAmount * 100,  // amount in the smallest currency unit
      currency: "INR",
      receipt: orderIdString
    };
    instance.orders.create(options, function (err, order) {
      console.log(order, 'new order');
      res.json(order)
    });

  } else if (req.body['payment-method'] == 'PayPal') {

    let amount = Math.floor(orderDoc.totalAmount/75);
    amount = new String(amount)

    const create_payment_json = {
      intent: 'sale',
      payer: {
        payment_method: 'paypal'
      },
      redirect_urls: {
        return_url: `https://countup.live/paymentsuccess/?objId=${orderId}`,
        cancel_url: `https://countup.live/paypal-cancel/?objId=${orderId}`
      },
      transactions: [{
        item_list: {
          items: [{
            name: 'item',
            sku: 'item',
            price: amount,
            currency: 'USD',
            quantity: 1
          }]
        },
        amount: {
          currency: 'USD',
          total: amount
        },
        description: 'This is the payment description.'
      }]
    };

    paypal.payment.create(create_payment_json, function (error, payment) {
      if (error) {
        console.log(error);
      } else {
       
        // Check that payment.links[1] exists
        if (payment.links && payment.links[1]) {
          // Redirect the user to the PayPal checkout page
          res.json({ payment });
        } else {
        
          res.status(500).send('Unable to process payment');
        }
      }

    });


  }
}


exports.successPagePayPal = async (req, res) => {
  try{
  const payerId = req.query.PayerID;
  const paymentId = req.query.paymentId;
  let objId = req.query.objId;

  let orderDoc = await Order.findOne({_id:objId})
  let amount = Math.floor(orderDoc.totalAmount/75)
  amount = new String(amount)

  const execute_payment_json = {
    payer_id: payerId,
    transactions: [
      {
        amount: {
          currency: "USD",
          total: amount,
        },
      },
    ],
  };
  await Order.updateOne(
    { _id: objId },
    {
      $set: {
        paymentstatus: 'placed'
      }
    })
  paypal.payment.execute(
    paymentId,
    execute_payment_json,
    function (error, payment) {

        res.redirect('/order-success')
      
    }
  );
  }catch(error){
    console.log(error,'eror')
  }
}

exports.cancelPagePayPal = async (req, res) => {
  let objId = req.query.objId;
  await Order.updateOne(
    { _id: objId },
    {
      $set: {
        paymentstatus: 'failed'
      }
    })
  res.redirect('/payment-failed')
}

exports.orderSuccess = async (req, res) => {
  
  let userObjId = req.session.user._id;
  let userId = userObjId.toString();


if(req.session.coupon){
 await User.updateOne(
    { _id: req.session.user._id, 'appliedCoupon.applied': req.session.coupon.couponCode },
    { $set: { 'appliedCoupon.$.status': true } }
  );
  await User.updateOne(
    { _id: req.session.user._id },
    { $pull: { appliedCoupon: { status: false } } }
  );
  req.session.couponStatus = null;
  req.session.coupon = null;
}



  await Cart.deleteOne({ user: userId })
  await Order.deleteMany({ userId: userId, paymentstatus: 'pending' })

  res.render('user/orderSuccess', { user: req.session.user ,noShow:true})
}

 
exports.paymentVerify = async (req, res) => {
  

  try {
    let details = req.body;
    const crypto = require('crypto');
    let hmac = crypto.createHmac('sha256', '2kavRhs8iz9X0h6jRNjO6WTk');



    hmac.update(details['payment[razorpay_order_id]'] + '|' + details['payment[razorpay_payment_id]']);
    hmac = hmac.digest('hex')

    let orderResponse = req.body['order[receipt]']
    let orderObjId = new ObjectId(orderResponse);
    if (hmac == details['payment[razorpay_signature]']) {

      await Order.updateOne(
        { _id: orderObjId },
        {
          $set: {
            paymentstatus: 'placed'
          }
        })


   
      res.json({ status: true })

    } else {

      await Order.updateOne(
        { _id: orderObjId },
        {
          $set: {
            paymentstatus: 'failed'
          }
        })
      res.json({ status: false, errMsg: '' })

    }
  } catch (error) {
    console.log(error, 'error')
  }
}

exports.paymentFailed = async (req, res) => {
  res.render('user/paymentFailed',{noShow:true})
}




exports.orderDetails = async (req, res) => {
  

  let orders = await Order.find({ userId: req.session.user._id })
  .sort('-updatedAt')
  .populate({
    path: 'products.item',
    model: 'Product'
  }).exec();


  if(req.session.filterOrders){
    res.locals.orders=req.session.filterOrders
    req.session.filterOrders = null;
  }else if(req.session.noOrders){
    res.locals.orders = req.session.noOrders 
    req.session.noOrders = null;
  }else if(req.session.cancelledOrders){
    res.locals.orders= req.session.cancelledOrders;
    req.session.cancelledOrders=null;
  }else if(req.session.notShippedOrders){
    res.locals.orders= req.session.notShippedOrders
    req.session.notShippedOrders=null;
  }else if(req.session.returneddOrders){
    res.locals.orders= req.session.returneddOrders
    req.session.returneddOrders=null;
  }
  else{
    res.locals.orders=orders
  }
  res.render('user/orders', { user: req.session.user })

  
}


exports.viewPlacedOrder = async (req, res) => {

  let orderId = req.params.id;
  let objId = new ObjectId(orderId);

  
  res.render('user/viewOrderProducts', { user: req.session.user, orderItems })

}

  

exports.sortOrders = async(req,res)=>{
    console.log(req.body,'afadsf')
    const userId = req.session.user._id;
    const selectedYear = req.body.selector;

    const startDate = new Date(selectedYear, 0, 1); // January 1st of selected year
    const endDate = new Date(selectedYear, 11, 31, 23, 59, 59, 999); // December 31st of selected year
    
    // Find all orders of the user that were created between the start and end dates of the selected year
    const orders = await Order.find({
      userId: userId,
      createdAt: { $gte: startDate, $lte: endDate }
    }).populate({
      path: 'products.item',
      model: 'Product'
    }).exec();
   
    if(orders){
      req.session.filterOrders = orders
    }else{
      req.session.noOrders = 'no item founded'
    }
    res.redirect('/orders')
}


exports.invoice = async(req,res)=>{
  
  let productId = req.query.productId
  let orderId = req.query.orderId;
  

  let orders = await Order.find({ _id: orderId })
  .populate({
    path: 'products.item',
    model: 'Product'
  }).exec();





  let product = null;
  for (let i = 0; i < orders.length; i++) {
    let order = orders[i];
    product = order.products.find(product => product.item._id.toString() === productId);
    if (product) {
      // If product found, fetch the details from the Product model
      break; // Exit the loop once product is found
    }
  }
  


   res.render('user/invoice',{orders,product,user: req.session.user,noShow:true});
}


exports.cancelOrder =async(req,res)=>{
 
  let productId = req.query.productId
  let orderId = req.query.orderId;


  let orders = await Order.find({ _id: orderId })
  .populate({
    path: 'products.item',
    model: 'Product'
  }).exec();


  let product = null;
  for (let i = 0; i < orders.length; i++) {
    let order = orders[i];
    product = order.products.find(product => product.item._id.toString() === productId);
    if (product) {
      product.orderstatus = 'cancelled';
      product.deliverystatus ='cancelled';
      await order.save();
      break; // Exit the loop once product is found
    }
  }

  res.redirect('/orders')

}

exports.returnOrder = async(req,res)=>{
     
  let productId = req.query.productId
  let orderId = req.query.orderId;
 

  let orders = await Order.find({ _id: orderId })
  .populate({
    path: 'products.item',
    model: 'Product'
  }).exec();


  let product = null;
  for (let i = 0; i < orders.length; i++) {
    let order = orders[i];
    product = order.products.find(product => product.item._id.toString() === productId);
    if (product) {
      product.orderstatus = 'returned';
      product.deliverystatus ='returned';
      await order.save();
      break; // Exit the loop once product is found
    }
  }
 
  res.redirect('/orders')
}



exports.listOfReturnedOrder =async(req,res)=>{
      
  let orders = await Order.find({
    userId: req.session.user._id,
    'products.orderstatus': 'returned'
  }).populate({
    path: 'products.item',
    model: 'Product'
  }).exec();

  req.session.returneddOrders = orders
  res.redirect('/orders')

}



exports.listOfCancelledOrder = async(req,res)=>{
  let orders = await Order.find({
    userId: req.session.user._id,
    'products.orderstatus': 'cancelled'
  }).populate({
    path: 'products.item',
    model: 'Product'
  }).exec();

  req.session.cancelledOrders = orders
  res.redirect('/orders')

}

exports.listOfNotShippedOrder = async(req,res)=>{
  let orders = await Order.find({
    userId: req.session.user._id,
    'products.deliverystatus': 'not-shipped',
    'products.orderstatus': 'processing'

  }).populate({
    path: 'products.item',
    model: 'Product'
  }).exec();

  req.session.notShippedOrders = orders
  res.redirect('/orders')
}

exports.orderSummary = async(req,res)=>{
  let productId = req.query.productId
  let orderId = req.query.orderId;
  

  let orders = await Order.find({ _id: orderId })
  .populate({
    path: 'products.item',
    model: 'Product'
  }).exec();


 


  let product = null;
  for (let i = 0; i < orders.length; i++) {
    let order = orders[i];
    product = order.products.find(product => product.item._id.toString() === productId);
    if (product) {
      // If product found, fetch the details from the Product model
      break; // Exit the loop once product is found
    }
  }
  

  
     res.render('user/orderSummary',{orders,product,user: req.session.user,noShow:true})
}
  

//admin

exports.ordersAdminPanal = async (req,res)=>{
   let adminDetails = req.session.admin;
   let orders = await Order.find()
   .populate({
     path: 'userId',
     model: 'User',
     select: 'name email' // select the fields you want to include from the User document
   })
   .populate({
     path: 'products.item',
     model: 'Product'
   })
   .exec();
  


    res.locals.orders = orders;
   
   
 

 
      res.render('admin/orderDetails',{admin:true,adminDetails})
} 

exports.orderDetailsAdmin = async(req,res)=>{
   
   
  let productId = req.query.productId
  let orderId = req.query.orderId;

   const deliveryStatus = req.body.deliveryStatus;

   let orders = await Order.find({ _id: orderId })
   .populate({
     path: 'products.item',
     model: 'Product'
   }).exec();
 
 
   let product = null;
   for (let i = 0; i < orders.length; i++) {
     let order = orders[i];
     product = order.products.find(product => product.item._id.toString() === productId);
     if (product) {
       if(deliveryStatus == 'cancelled'){
        product.orderstatus = deliveryStatus;
        product.deliverystatus = deliveryStatus;
       }else{
        product.orderstatus = 'confirmed';
        product.deliverystatus = deliveryStatus;
       }
     
       await order.save();
       break; // Exit the loop once product is found
     }
   }

   res.redirect('/admin/orders')
}

exports.salesReport = async(req,res)=>{
  
  const selector = req.body.selector;

  // Extracting the relevant parts based on the selector
    let year, month, weekStart, weekEnd, day;
    if (selector.startsWith('year')) {
      year = parseInt(selector.slice(5));
       } else if (selector.startsWith('month')) {
         const parts = selector.split('-');
         year = parseInt(parts[1]);
         month = parseInt(parts[2]);
       } else if (selector.startsWith('week')) {
          const today = new Date();
           weekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
           weekEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() + 6);
  

      } else if (selector.startsWith('day')) {
          day = new Date(selector.slice(4));
          day.setHours(0, 0, 0, 0);
       }

 
      if (weekStart && weekEnd) {
        const orderThisWeek = await Order.find({ createdAt: { $gte: weekStart, $lte: weekEnd } }).populate({
          path: 'userId',
          model: 'User',
          select: 'name email' // select the fields you want to include from the User document
        })
        .populate({
          path: 'products.item',
          model: 'Product'
        })
        .exec();;
        req.session.admin.orderThisWeek =orderThisWeek;
     
        return res.redirect('/admin/sales-report')
      
      }

      if (year && month) {
        const startOfMonth = new Date(year, month - 1, 1);
        const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
        const orderThisMonth = await Order.find({ createdAt: { $gte: startOfMonth, $lte: endOfMonth } }).populate({
          path: 'userId',
          model: 'User',
          select: 'name email' // select the fields you want to include from the User document
        })
        .populate({
          path: 'products.item',
          model: 'Product'
        })
        .exec();;
        req.session.admin.orderThisMonth =orderThisMonth;
        
        return res.redirect('/admin/sales-report')
      
      }
      
      if (day) {
        const startOfDay = new Date(day);
        const endOfDay = new Date(day);
        endOfDay.setDate(endOfDay.getDate() + 1);
        endOfDay.setSeconds(endOfDay.getSeconds() - 1);
        const orderThisDay = await Order.find({ createdAt: { $gte: startOfDay, $lte: endOfDay } }).populate({
          path: 'userId',
          model: 'User',
          select: 'name email' // select the fields you want to include from the User document
        })
        .populate({
          path: 'products.item',
          model: 'Product'
        })
        .exec();;
        req.session.admin.orderThisDay =orderThisDay;

        return res.redirect('/admin/sales-report')

      }
      if (year) {
        const orderThisYear = await Order.find({ createdAt: { $gte: new Date(year, 0, 1), $lte: new Date(year, 11, 31, 23, 59, 59, 999) } }).populate({
          path: 'userId',
          model: 'User',
          select: 'name email' // select the fields you want to include from the User document
        })
        .populate({
          path: 'products.item',
          model: 'Product'
        })
        .exec();;
        req.session.admin.orderThisYear =orderThisYear;
   
        return res.redirect('/admin/sales-report')
       
      }
      
      
}

exports.salesSummary = async(req,res)=>{
  let adminDetails = req.session.admin;
  let orders = await Order.find()
  .populate({
    path: 'userId',
    model: 'User',
    select: 'name email' // select the fields you want to include from the User document
  })
  .populate({
    path: 'products.item',
    model: 'Product'
  })
  .exec();

  if(req.session.admin.orderThisWeek){
    res.locals.orders = req.session.admin.orderThisWeek;
    req.session.admin.orderThisWeek = null;
  }else if(req.session.admin.orderThisMonth){
   res.locals.orders = req.session.admin.orderThisMonth;
   req.session.admin.orderThisMonth = null;
  }else if( req.session.admin.orderThisDay){
   res.locals.orders = req.session.admin.orderThisDay;
   req.session.admin.orderThisDay = null;
  }else if( req.session.admin.orderThisYear){
   res.locals.orders = req.session.admin.orderThisYear;
   req.session.admin.orderThisYear = null;
  }else{
   res.locals.orders = orders;
  }
 
  res.render('admin/salesReport',{admin:true,adminDetails})
}