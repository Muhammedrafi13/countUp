const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const otpController = require('../controllers/otpController');
const productController = require('../controllers/productController');


/* GET home page. */

router.get('/', userController.HomePage);
router.get('/login', userController.LoginPage);
router.post('/login',userController.postlogin);
router.get('/logout',userController.logout);
router.get('/signUp', userController.signUpPage)
router.post('/signup',userController.postSignUP);

//otp controller 
router.get('/otp',userController.verifyLogin,otpController.otpPage);
router.post('/otp',otpController.postOtp);

//prodcut controller

router.get('/menCollection',productController.mensPage);
router.get('/womenCollection',productController.womensPage);
router.get('/kidsCollection',productController.kidsPage);
router.get('/image/:id',productController.viewImage);


module.exports = router;
