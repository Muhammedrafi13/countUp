const Category = require('../models/categorySchema');
const mongoose = require('mongoose');

exports.categoryPage = async(req,res)=>{
    let adminDetails =req.session.admin;
    let categoryData = await Category.find();
    console.log(categoryData)
    if(req.session.admin.categoryErr){
      res.locals.catErr =req.session.admin.categoryErr;
      req.session.admin.categoryErr=null;
    }
     
    res.render('admin/category',{admin:true,adminDetails,categoryData})
}

exports.postCategory = async(req,res)=>{
    console.log(req.body,'body of catgeory')

    const newCategory = new Category({
        name: req.body.category
    })

    try {
        await Category.create(newCategory);
        console.log('Category saved successfully');
        req.session.admin.categoryErr = ''
      } catch (error) {
        // check if the error is a duplicate key error
        if (error.code === 11000) {
          req.session.admin.categoryErr='Category with this name already exists';
        } else {
          console.log(error);
        }
      }
   
    res.redirect('/admin/category')
}