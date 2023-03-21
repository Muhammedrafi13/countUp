const User = require('../models/userSchema');
const Product = require('../models/productSchema');
const Otp = require('../models/otpSchema')
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const fast2sms = require("fast-two-sms");
const otplib = require('otplib');
const secret = otplib.authenticator.generateSecret();
const Admin = require('../models/adminSchema');
const multer  = require('multer');



const storage =multer.diskStorage({
   
  destination: function (req, file, cb){
    return cb(null, ( 'public/product-images')); 
  },
  filename: function (req, file, cb){
    return cb(null, `${Date.now()}-${file.originalname}`)
  },


});

const upload = multer({
  storage
});

exports.mensPage = async (req, res) => {
    try {
        const mensProducts = await Product.find({ category: 'men' });
        let user = req.session.user;
        res.render('user/menCollection', { mensProducts,user });
    } catch (error) {
        console.log(error);
    }

}
exports.womensPage = async (req, res) => {
    try {
        const womensProducts = await Product.find({ category: 'women' });
        let user = req.session.user;
        res.render('user/womenCollection', { womensProducts,user });
    } catch (error) {
        console.log(error);
    }

}
exports.kidsPage = async (req, res) => {
    try {
        const kidsProducts = await Product.find({ category: 'kid' });
        let user = req.session.user;
        res.render('user/kidsCollection', { kidsProducts,user });
    } catch (error) {
        console.log(error);
    }

}


exports.viewImage = async (req, res) => {
    try {
        const productDetails = await Product.findOne({ _id: req.params.id });
        let user = req.session.user;
        res.render("user/productDetails", { productDetails ,user});
    } catch (error) {
        console.log(error)
    }

}



//admin side product controller 

exports.addProductPage = async(req,res)=>{
    let adminDetails =req.session.admin;
      res.render('admin/addProduct',{admin:true,adminDetails})
  }
  
  exports.postProduct =(req,res,next)=>{
    upload.array('Image',4)(req, res, async (err) => {
      if (err) {
        console.log(err);
        return next(err);
      }
      console.log(req.body)
      console.log(req.files)
    
    try{
      const newProduct = new Product({
          productName: req.body.productName,
          productPrice: req.body.productPrice,
          salePrice: req.body.salePrice,
          category: req.body.category,
          stock: req.body.stock,
          images: req.files.map(file => file.filename)
      });
      await Product.create(newProduct);
      res.redirect('/admin/Product');
    }catch(error){
      console.log(error);
    }
  
  });
  };
  
  exports.viewProduct = async(req,res)=>{
      try{
          const products = await Product.find({});
          let adminDetails =req.session.admin;
          res.render('admin/viewProduct',{products,admin:true,adminDetails});
        }catch(error){
          console.log(error);
        }
      
  }
  exports.men = async(req,res)=>{
      try{
          const products = await Product.find({category:'men'});
          let adminDetails =req.session.admin;
          res.render('admin/men',{products,admin:true,adminDetails});
        }catch(error){
          console.log(error);
        }
      
  }
  exports.women = async(req,res)=>{
      try{
          const products = await Product.find({category:'women'});
          let adminDetails =req.session.admin;
          res.render('admin/women',{products,admin:true,adminDetails});
        }catch(error){
          console.log(error);
        }
      
  }
  exports.kid = async(req,res)=>{
      try{
        let adminDetails =req.session.admin;
          const products = await Product.find({category:'kid'});
          res.render('admin/kid',{products,admin:true,adminDetails});
        }catch(error){
          console.log(error);
        }
      
  }
  
  
  
  exports.getEditProductPage = async(req,res)=>{
    try{
         const editProduct = await Product.findOne({_id: req.params.id})
         let adminDetails =req.session.admin;
         res.render('admin/editProduct',{editProduct,admin:true,adminDetails})
      }catch(error){
         console.log(error);
      }
    
  }
  exports.editProduct = async(req,res)=>{
  
    upload.array('Image',4)(req, res, async (err) => {
     try{
      await Product.findByIdAndUpdate(req.params.id,{
        productName: req.body.productName,
        productPrice: req.body.productPrice,
        salePrice: req.body.salePrice,
        category: req.body.category,
        stock: req.body.stock,
        images: req.files.map(file => file.filename)
      })
      await res.redirect(`/admin/edit/${req.params.id}`);
      console.log('redirected')
     }catch(error){
       console.log(error)
     }
  
    });
    
  }
  
   exports.deleteProduct = async (req,res)=>{
      try{
       await Product.deleteOne({_id: req.params.id});
       res.redirect("/admin/viewProduct");
   
      }catch(error){
       console.log(error)
      }
   }