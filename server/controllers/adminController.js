
const Admin = require('../models/adminSchema');
const Product = require('../models/productSchema');
const User = require('../models/userSchema');
const multer  = require('multer');
const bcrypt = require('bcrypt');



//adminControler 

exports.adminLogin = async(req,res)=>{
  
    if (req.session.admin) {
      res.redirect('/admin/dashboard')
    } else {
      const adminErr = req.session.adminErr;
      req.session.adminErr = false;
      res.render('admin/login', {noShow:true, login: adminErr })
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
                    req.session.adminErr ='password is not matching';
                    res.redirect('/admin')
                }
            })
        } else {
    
            console.log('not valid email');
            req.session.adminErr ='not valid email';
            res.redirect('/admin')
        }

    } catch (error) {
        console.log(error)
    }

}

exports.logout =async (req,res)=>{
  req.session.admin = null;
  res.redirect('/admin');
}


exports.getDashboard = async(req,res)=>{

  let adminDetails =req.session.admin;
  res.render('admin/dashboard',{admin:true,adminDetails})
}






