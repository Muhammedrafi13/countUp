
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





//user controller 

exports.verifyLogin = (req, res, next) => {
    if (req.session.tempUser) {
        next();
    } else {
        res.redirect('/');
    }
};

exports.HomePage = async (req, res) => {
    req.session.tempUser = null;
    let user = req.session.user;
    res.render('user/index', { user });
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
        const existingUser = await User.findOne({ email: req.body.email })
        if (existingUser) {
            console.log(`A user with email ${req.body.email} already exists`);
            req.session.logginErr = 'Email id is already used';
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
                var options = {
                    authorization: process.env.SMS_KEY1, //fill this with your api
                    message: `your OTP verification code is ${token}`,
                    numbers: [mobile],
                };
                //send this message
                fast2sms
                    .sendMessage(options)
                    .then((response) => {
                        console.log(response);
                    })
                    .catch((error) => {
                        console.log(error);
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
                bcrypt.compare(req.body.password, existingUser.password).then((status) => {
                    if (status) {
                        console.log('user exist ');
                        req.session.user = existingUser;
                        req.session.user.loggedIn = true;
                        console.log(req.session.user);
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
  





//otp controller 



//product controller 

