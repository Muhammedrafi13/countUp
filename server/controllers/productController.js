const User = require('../models/userSchema');
const Product = require('../models/productSchema');
const Cart = require('../models/cartSchema');
const Category = require('../models/categorySchema');
const Otp = require('../models/otpSchema')
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const fast2sms = require("fast-two-sms");
const otplib = require('otplib');
const secret = otplib.authenticator.generateSecret();
const Admin = require('../models/adminSchema');
const multer = require('multer');
const ObjectId = mongoose.Types.ObjectId;
const Order = require('../models/orderSchema');

const storage = multer.diskStorage({

  destination: function (req, file, cb) {
    return cb(null, ('public/product-images'));
  },
  filename: function (req, file, cb) {
    return cb(null, `${Date.now()}-${file.originalname}`)
  },


});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype == "image/png" || file.mimetype == "image/webp" || file.mimetype == "image/jpg" || file.mimetype == "image/jpeg") {
      cb(null, true);
    } else {
      // cb(null, false);
      // return cb(new Error('Only .png, .jpg and .jpeg format allowed!'));

      const error = new Error('Only .png, .jpg and .jpeg format allowed!');
      error.code = 'LIMIT_FILE_TYPES';
      return cb(error, false);
    }
  }
});

exports.mensPage = async (req, res) => {
  try {
    const pageSize = 4;
    const mensProducts = await Product.find({ gender: { $all: ["men"] },softdelete: false }).limit(pageSize);
    const totalCount = await Product.find({ gender: { $all: ["men"] },softdelete: false  }).countDocuments();
    const totalPages = Math.ceil(totalCount / pageSize);
    res.render('user/menCollection', { mensProducts,totalPages });
  } catch (error) {
    console.log(error);
  }

}
exports.womensPage = async (req, res) => {
  try {
    const pageSize = 4;
    const womensProducts = await Product.find({ gender: { $all: ["women"] },softdelete: false  }).limit(pageSize);

    const totalCount = await Product.find({ gender: { $all: ["women"] },softdelete: false  }).countDocuments();
    const totalPages = Math.ceil(totalCount / pageSize);


    res.render('user/womenCollection', { womensProducts,totalPages });

  } catch (error) {
    console.log(error);
  }

}
exports.kidsPage = async (req, res) => {
  try {
    const pageSize = 4;
    const kidsProducts = await Product.find({ gender: { $in: [ "girls","boys"] },softdelete: false  }).limit(pageSize);

    const totalCount = await Product.find({ gender: { $in: [ "girls","boys"] },softdelete: false  }).countDocuments();
    const totalPages = Math.ceil(totalCount / pageSize);
    res.render('user/kidsCollection', { kidsProducts,totalPages });
  } catch (error) {
    console.log(error);
  }

}


exports.viewImage = async (req, res) => {
  try {
    const productDetails = await Product.findOne({ _id: req.params.id });
    res.render("user/productDetails", { productDetails });
  } catch (error) {
    console.log(error)
  }

}





exports.shopPage = async (req, res) => {

  try {
    let user = req.session.user;
   
    if(req.session.product){
      res.locals.product = req.session.product;
      req.session.product = null;
    }else if(req.session.search){
      res.locals.product = req.session.search;
      req.session.search = null;
    }
    else{
      res.locals.product = await Product.find({gender:{ $all : ["men"]},softdelete: false })
      req.session.product = null;
    }

    let categoryNames=await Category.find()
   
    console.log(res.locals.product)
   
    res.render('user/shop', { user,categoryNames  });
  } catch (error) {
    console.log(error)
  }

}

exports.genderFilter = async(req,res)=>{
    // let gender = req.body.gender
    let gender = req.params.gender;
    let category = req.params.category;
  

    
    let product;
     
  if(gender!="undefined"){

      product = await Product.find({ gender: { $all: [gender] },softdelete: false  })
 
  }else{
 
    product = await Product.find()
    .populate({
     path: 'category',
     match: { name: category }
   })
   .exec();
   
   const filteredProducts = product.filter(product => product.category !== null);
   product = filteredProducts;
  }
   


      req.session.product = product
      res.json(true)


}



exports.postSearch = async(req,res)=>{
 
   let regex = new RegExp(req.body.search,"i");
   let product = await Product.find({$or:[{productName:{$regex:regex}}]})
 
   req.session.search =product;
   res.redirect('/shop')
   
}

exports.pagination = async(req,res)=>{
  console.log(req.query.gender,'gender')
  const pageSize = 4;
  const pageNumber =parseInt(req.params.id);
  const skip = (pageNumber - 1) * pageSize;
  let products;
  if(req.query.gender=="kids"){
     products = await Product.find({ gender: { $in: [ "girls","boys"] },softdelete: false  }).skip(skip).limit(pageSize);
  }else{
     products = await Product.find({ gender: { $all: [req.query.gender] },softdelete: false  }).skip(skip).limit(pageSize);
  }

  console.log(products,'products')
  res.json(products)

}



















//admin side product controller 

exports.addProductPage = async (req, res) => {
  let adminDetails = req.session.admin;
  let categoryData = await Category.find();
  if(req.session.imgErr){
     res.locals.imgErr=req.session.imgErr;
     req.session.imgErr=null;
  }
  res.render('admin/addProduct', { admin: true, adminDetails, categoryData })
}

exports.postProduct = (req, res, next) => {
  upload.array('Image', 4)(req, res, async (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_TYPES') {
        req.session.imgErr="invalid file type! only .png .jpg and .jpeg format allowed";
        return res.redirect('/admin/Product');
        // return res.status(400).send({ error: 'Invalid file type. Only .png, .jpg and .jpeg format allowed.' });
      } else {
        req.session.imgErr="maximum 4 images can be upload";
        return res.redirect('/admin/Product');
        // return res.status(400).send({ error: 'only 4 img' });
      }
    }
  

    try {
      const newProduct = new Product({
        productName: req.body.productName,
        productPrice: req.body.productPrice,
        salePrice: req.body.salePrice,
        gender: req.body.gender,
        category: req.body.category,
        stock: req.body.stock,
        images: req.files.map(file => file.filename),
        softdelete: false
      });
      await Product.create(newProduct);
      res.redirect('/admin/Product');
    } catch (error) {
      console.log(error);
    }

  });
};

exports.viewProduct = async (req, res) => {
  try {
    const products = await Product.find()
    .populate('category');
 
    let adminDetails = req.session.admin;
    res.render('admin/viewProduct', { products, admin: true, adminDetails });
  } catch (error) {
    console.log(error);
  }

}
exports.men = async (req, res) => {
  try {
    const products = await Product.find({ gender: { $all: ["men"] } });
    let adminDetails = req.session.admin;
    res.render('admin/men', { products, admin: true, adminDetails });
  } catch (error) {
    console.log(error);
  }

}
exports.women = async (req, res) => {
  try {
    const products = await Product.find({ gender: { $all: ["women"] } });
    let adminDetails = req.session.admin;
    res.render('admin/women', { products, admin: true, adminDetails });
  } catch (error) {
    console.log(error);
  }

}
exports.kid = async (req, res) => {
  try {
    let adminDetails = req.session.admin;
    const products = await Product.find({ category: 'kid' });
    res.render('admin/kid', { products, admin: true, adminDetails });
  } catch (error) {
    console.log(error);
  }

}



exports.getEditProductPage = async (req, res) => {
  try {
    const editProduct = await Product.findOne({ _id: req.params.id }).populate('category');

    let categoryData = await Category.find();
    let adminDetails = req.session.admin;
    res.render('admin/editProduct', { editProduct, admin: true, adminDetails ,categoryData})
  } catch (error) {
    console.log(error);
  }

}
exports.editProduct = async (req, res) => {

  upload.array('Image', 4)(req, res, async (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_TYPES') {
        return res.status(400).send({ error: 'Invalid file type. Only .png, .jpg and .jpeg format allowed.' });
      } else {
        return res.status(400).send({ error: err.message });
      }
    }
    try {
      const product = await Product.findById(req.params.id);
      let imageFiles = [];
  
      
    if (req.files && req.files.length > 0) {
      // If new images are uploaded, set them as the imageFiles
      imageFiles = req.files.map(file => file.filename);
    } else {
      // If no new images are uploaded, keep the existing ones
      imageFiles = product.images;
    }
      
   
      await Product.findByIdAndUpdate(req.params.id, {
        productName: req.body.productName,
        productPrice: req.body.productPrice,
        category: req.body.category,
        salePrice: req.body.salePrice,
        gender: req.body.gender,
        stock: req.body.stock,
        images: imageFiles,
       
      })
   
      await res.redirect(`/admin/edit/${req.params.id}`);
 
    } catch (error) {
      console.log(error)
    }

  });

}

exports.deleteProduct = async (req, res) => {
  try {
    await Product.findByIdAndUpdate({ _id: req.params.id },{
      softdelete: true
    });
    await res.redirect("/admin/viewProduct");

  } catch (error) {
    console.log(error)
  }
}


exports.enableProduct =async (req,res) =>{
  try{

    await Product.findByIdAndUpdate({ _id: req.params.id },{
      softdelete: false
    });
     await res.redirect("/admin/viewProduct");

  }catch(error){
    console.log(error)
  }
}