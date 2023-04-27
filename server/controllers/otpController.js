
const User = require('../models/userSchema');
const Product = require('../models/productSchema');
const Otp = require('../models/otpSchema')
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const fast2sms = require("fast-two-sms");
const otplib = require('otplib');
const secret = otplib.authenticator.generateSecret();



exports.otpPage = async (req, res) => {

    const phoneNumber = req.session.tempUser.phone
    res.render("user/otpPage", { phoneNumber});
}

exports.postOtp = async (req, res) => {

    const submittedOtp = parseInt(req.body.number1 + req.body.number2 + req.body.number3 + req.body.number4 + req.body.number5 + req.body.number6);
    console.log(submittedOtp) //otp that you entered in the page
    let userEmail;
    if( req.session.tempUser){
        userEmail = req.session.tempUser.email;
    }
  
    const verifiedUser = await Otp.findOne({ email: userEmail }, { _id: 0, otp: 1 });
    if (verifiedUser) {
        console.log(verifiedUser.otp)
        if (verifiedUser.otp == submittedOtp) { //checking the otp's
            await User.updateOne({ email: userEmail }, { status: true });
            req.session.user = req.session.tempUser;
            req.session.tempUser = null;
            req.session.user.loggedIn = true;
            console.log("Verified"); // if the otp matches sending data
           
            await User.deleteMany({ email: userEmail, status: false });

            res.redirect("/")
        } else {
            res.render("user/otpPage", { message: "you have enterd the wrong otp" }) //if the otp doesnt match sending message
        }
    } else {
        res.render("user/otpPage", { message: "your otp time is expired " }) //if the otp doesnt match sending message
    }

}
