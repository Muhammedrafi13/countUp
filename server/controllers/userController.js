
const User = require('../models/userSchema');
const Product = require('../models/productSchema');
const Otp = require('../models/otpSchema');
const Cart = require('../models/cartSchema');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const fast2sms = require("fast-two-sms");
const otplib = require('otplib');
const secret = otplib.authenticator.generateSecret();
var unirest = require("unirest");


const Admin = require('../models/adminSchema');
const multer  = require('multer');





//user controller 



exports.HomePage = async (req, res) => {
    req.session.tempUser = null;
    let products = await Product.aggregate([
        // Group products by gender
        { $group: {
            _id: '$gender',
            products: { $push: '$$ROOT' },
            count: { $sum: 1 }
        }},
        // Sort each group by createdAt date in descending order
        { $project: {
            _id: 1,
            products: { $slice: [ '$products', 9 ] }
        }}
      ])
      const productsByGender = {};

    // Iterate over the result array and create a new array for each gender group
    products.forEach(group => {
      const gender = group._id[0];
      productsByGender[gender] = group.products;
    });

    console.log(productsByGender,'innovative');
    console.log(products,'last 9')
    res.render('user/index',{productsByGender});
}
exports.LoginPage = async (req, res) => {
    if (req.session.user) {
  
        res.redirect('/')
    } else {
        const loginErr = req.session.logginErr;
        req.session.logginErr = false;
        
        res.render('user/login', { login: loginErr,loginVe:true,noShow:true })
    }

}
exports.signUpPage = async (req, res) => {
    if (req.session.user) {
        res.redirect('/')
    } else {
        console.log('signupppperr')
        const loginErr = req.session.logginErr;
        req.session.logginErr = false;
        res.render('user/signUp', { login: loginErr,loginVe:true ,noShow:true })
    }

}
exports.postSignUP = async (req, res) => {
    try {
     
        const existingUser = await User.findOne({$or:[{ email: req.body.email},{phone:req.body.phone}],status:true });
        console.log(existingUser,'user ')
        if (existingUser) {
            console.log(`A user with email ${req.body.email} already exists`);
            req.session.logginErr = 'Email id or phone number is already used';
            res.redirect('/signup');

        } else {
            const hashPassword = await bcrypt.hash(req.body.password, 10);
            const newUser = new User({
                name: req.body.name,
                email: req.body.email,
                phone: req.body.phone,
                password: hashPassword,
                status: false,
                isActive: true,
            });
         
            req.session.token = otplib.authenticator.generate(secret);
            const token = req.session.token;
            const sendMessage = function (mobile, res, next) {
                console.log(mobile)
            
                // var options = {
                //     authorization: process.env.SMS_KEY, //fill this with your api
                //     message: `Your verification code is ${token}`,
                //     numbers: [mobile],
                //     route: `otp`,
                // };
                //send this message
                // fast2sms
                //     .sendMessage(options)
                //     .then((response) => {
                //         console.log(response);
                //     })
                //     .catch((error) => {
                //         console.log(error);
                //     });
               ///

               var req = unirest("GET", "https://www.fast2sms.com/dev/bulkV2");

               req.query({
                 "authorization": process.env.SMS_KEY,
                 "variables_values": `${token}`,
                 "route": "otp",
                 "numbers":  [mobile]
               });
               
               req.headers({
                 "cache-control": "no-cache"
               });
               
               
               req.end(function (res) {
                 if (res.error) throw new Error(res.error);
               
                 console.log(res.body);
               });
               

                    


                    
                return token;
            };

           
            const newOtp = sendMessage(req.body.phone, res)  // pass the mobile 
            
            console.log(newOtp, 'otptottttot')
            const newOtpSend = new Otp({
                email: req.body.email,
                otp: newOtp
            });
            await User.create(newUser);
            await Otp.create(newOtpSend);

            req.session.tempUser = newUser;
            res.redirect('/otp')
        }
    } catch (error) {
        console.log(error);
    }
}
exports.postlogin = async (req, res) => {

    try {
        const existingUser = await User.findOne({ email: req.body.email, status: 'true' })
        if (existingUser) {
            if (existingUser.isActive) {
                bcrypt.compare(req.body.password, existingUser.password).then(async(status) => {
                    if (status) {
                        console.log('user exist ');
                        req.session.user = existingUser;
                        req.session.user.loggedIn = true;
                        console.log(req.session.user,"//////user");
                        await User.updateOne(
                            { _id: req.session.user._id },
                            { $pull: { appliedCoupon: { status: false } } }
                          );
                        res.redirect('/')
                    } else {
                        console.log('password is not matching');
                        req.session.logginErr = 'password is not matching';
                        res.status(400).redirect('/login');
                    }
                })
            } else {
                console.log('your account has been blocked, contact admin');
                req.session.logginErr = 'your account has been blocked, contact admin';
                res.status(400).redirect('/login');
            }

        } else {
            console.log('not valid email');
            req.session.logginErr = 'invalid email or passaword';
            res.status(400).redirect('/login');
        }

    } catch (error) {
        console.log(error)
    }

}
exports.logout = async (req, res) => {
    req.session.tempUser = null;
    req.session.user = null;
    res.redirect('/');
}


exports.forgetPassword = async(req,res)=>{
    res.render('user/forgetPassword',{noShow:true})
}



exports.userProfile = async(req,res)=>{

    let currentAddress =await User.findOne({_id:req.session.user._id});
    res.render('user/userprofile',{currentAddress})
}
  
exports.editUserProfile = async(req,res)=>{
    console.log(req.body,'userr');
    const userProfile = await User.findOneAndUpdate(
        {_id: req.params.id}, // filter object
        {    name:req.body.name,
            email:req.body.email,
            phone:req.body.phone} // update object
      );
    res.redirect('/profile');
}







exports.updateUserAddress =async(req,res)=>{
       console.log(req.body.userId,'idddd')
       let user = req.session.user;
      const address = await User.findOneAndUpdate({ _id: user._id }, 
         { $push: {
             address: {
                 name:req.body.name,
                 mobile:req.body.mobile,
                 addressDetails:req.body.addressDetails,
                 city:req.body.city,
                 state:req.body.state,
                 zip: req.body.zip,
                 typeOfAddress:req.body.typeOfAddress

             } } }, 
         { new: true });
       console.log(address,'address')
       res.json(address); 
}

exports.deleteUserAddress = async(req,res)=>{
    
      
      try {
        let user = req.session.user;
        await User.findByIdAndUpdate({_id:user._id}, { $pull: { address: { _id: req.params.id } } }, { new: true });
        res.redirect("/profile");
  
      } catch (error) {
        console.log(error)
      }

}
  

exports.sendOtpEmail = async(req,res)=>{
  console.log(req.body.email,'jds')
  let email =req.body.email;
  let verifiedUser = await User.findOne({ email:req.body.email , status: 'true' })
  console.log(verifiedUser,'tell me  the user id')
  if(verifiedUser){
    req.session.verifiedUserEmail = verifiedUser
    req.session.emailOtp = otplib.authenticator.generate(secret);
    let emailOtp =   req.session.emailOtp 
    console.log(emailOtp,'otp')
    const nodemailer = require("nodemailer");
    let transporter = nodemailer.createTransport({
      service: 'gmail',
  
      auth: {
        user: 'countuptheperfectoutfit@gmail.com', 
        pass: 'srynvyqblcbbluak', 
      },
    });
  
    
    let mailOptions = await transporter.sendMail({
      from: 'countuptheperfectoutfit@gmail.com',
      to: `${email}`,
      subject: "Reset password - verification code",
      text:'verification', 
      html: `Your email verification code is <b>${emailOtp}</b>`, 
    });
  
    transporter.sendMail(mailOptions,function(error,info){
      if(error){
          console.log(error);
      }else{
          console.log('Email address :' + info.response);
          res.json(true)
      }
    });
  }else{
    console.log('hello')
    res.json({message:'please enter registered email'})
  }
  



}

exports.verifyEmailOtp = async(req,res)=>{
    console.log(req.body.otp,'otp')
    if(req.session.emailOtp === req.body.otp){
        res.json(true)
    }else{
        res.json({message:'otp incorrect'})
    }
  
}


exports.resetPassword = async(req,res)=>{
    if(req.session.verifiedUserEmail){
        res.render('user/resetPassword',{noShow:true})
    }else{
        res.redirect('/login')
    }
   
}

exports.resetNewPassword = async(req,res)=>{

    console.log(req.body.password,'paswword')
    console.log(req.session.verifiedUserEmail,'fadsf')
    if(req.session.verifiedUserEmail){
        console.log(req.session.verifiedUserEmail)
        const hashPassword = await bcrypt.hash(req.body.password, 10);

         let result = await User.findOneAndUpdate(
        {_id: req.session.verifiedUserEmail._id}, // filter object
        {password: hashPassword} // update object
      );
       console.log(result,'result')
        res.redirect('/login')
    }else{
        res.redirect('/login')
    }
  
}


exports.confirmAndUpdatePassword = async(req,res)=>{
     
   
     let verifiedUser = await User.findOne({_id:req.session.user._id });
    
     bcrypt.compare(req.body.currentpassword, verifiedUser.password).then(async(status) => {
        if (status) {
            let hashPassword = await bcrypt.hash(req.body.newpassword, 10);
       
           await User.findOneAndUpdate(
            {_id: req.session.user._id}, // filter object
            {password: hashPassword} // update object
          );

           console.log('huihadsfasdfasd')
            res.json(true)
        } else {
            console.log('password is not matching');
           
            res.json({message:'not matching'})
        }
    })

}

exports.errorPage404 = async(req,res)=>{
    
        if(req.session.admin){
            res.locals.admin=true
        }
        res.status(404).render('user/404',{noShow:true})
}


//admin side user controller


exports.userslist = async(req,res)=>{
    try{
      let adminDetails =req.session.admin;
        const userList = await User.find({});
        res.render('admin/userListView',{userList,admin:true,adminDetails});
      }catch(error){
        console.log(error);
      }
    
  }
   exports.blockUser = async(req,res)=>{
      await User.updateOne({_id: req.params.id}, { isActive: false });
      res.redirect('/admin/users')
   }
   exports.unBlockUser = async(req,res)=>{
      await User.updateOne({_id: req.params.id}, { isActive: true });
      res.redirect('/admin/users')
  }
  
  exports.deleteUser = async (req,res)=>{
    try{
  
     await User.deleteOne({_id: req.params.id});
     
     res.redirect("/admin/Users");
  
    }catch(error){
     console.log(error)
    }
  }
  






