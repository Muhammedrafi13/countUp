
const Admin = require('../models/adminSchema');
const Product = require('../models/productSchema');
const User = require('../models/userSchema');
const Order = require('../models/orderSchema')
const multer = require('multer');
const bcrypt = require('bcrypt');



//adminControler 

exports.adminLogin = async (req, res) => {

  if (req.session.admin) {
    res.redirect('/admin/dashboard')
  } else {
    const adminErr = req.session.adminErr;
    req.session.adminErr = false;
    res.render('admin/login', { noShow: true, login: adminErr })
  }

}
exports.postAdminlogin = async (req, res) => {
  console.log(req.body.email)
  console.log(req.body.password)

  try {
    const existingAdmin = await Admin.findOne({ email: req.body.email })
    if (existingAdmin) {
      bcrypt.compare(req.body.password, existingAdmin.password).then((status) => {
        if (status) {
          console.log('admin exist ')
          req.session.admin = existingAdmin;
          req.session.admin.loggedIn = true;
          res.redirect('/admin/dashboard')

        } else {
          console.log('password is not matching');
          req.session.adminErr = 'password is not matching';
          res.redirect('/admin')
        }
      })
    } else {

      console.log('not valid email');
      req.session.adminErr = 'not valid email';
      res.redirect('/admin')
    }

  } catch (error) {
    console.log(error)
  }

}

exports.logout = async (req, res) => {
  req.session.admin = null;
  res.redirect('/admin');
}


exports.getDashboard = async (req, res) => {
  const jsPDF = require('jspdf');
  let adminDetails = req.session.admin;
  const orders = await Order.find({})
    .populate({
      path: 'products.item',
      model: 'Product'
    }).exec();

  const totalQuantity = orders.reduce((accumulator, order) => {
    order.products.forEach((product) => {
      accumulator += product.quantity;
    });
    return accumulator;
  }, 0);
  const totalProfit = orders.reduce((acc, order) => {
    return acc + order.totalAmount;
  }, 0);
  const totalShipped = orders.reduce((accumulator, order) => {
    order.products.forEach((product) => {
      if (product.deliverystatus === "shipped") {
        accumulator += 1;
      }
    });
    return accumulator;
  }, 0);
  const totalCancelled = orders.reduce((accumulator, order) => {
    order.products.forEach((product) => {
      if (product.orderstatus === "cancelled") {
        accumulator += 1;
      }
    });
    return accumulator;
  }, 0);

  console.log(orders, 'order details')




  const startOfYear = new Date(new Date().getFullYear(), 0, 1); // start of the year
  const endOfYear = new Date(new Date().getFullYear(), 11, 31); // end of the year

  let orderBasedOnMonths = await Order.aggregate([
    // match orders within the current year
    { $match: { createdAt: { $gte: startOfYear, $lte: endOfYear } } },

    // group orders by month
    {
      $group: {
        _id: { $month: "$createdAt" },
        orders: { $push: "$$ROOT" }
      }
    },

    // project the month and orders fields
    {
      $project: {
        _id: 0,
        month: "$_id",
        orders: 1
      }
    },
    {
      $project: {
        month: 1,
        orderCount: { $size: "$orders" }
      }
    }
    , {
      $sort: { month: 1 }
    }
  ]);

  console.log(orderBasedOnMonths, 'vall')



  // console.log(totalQuantity,totalProfit,totalShipped,totalCancelled,'ordercount')
  res.render('admin/dashboard', { admin: true, adminDetails, totalQuantity, totalProfit, totalShipped, totalCancelled, orderBasedOnMonths, jsPDF: jsPDF });
}






