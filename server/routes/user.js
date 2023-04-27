const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const otpController = require('../controllers/otpController');
const productController = require('../controllers/productController');
const cartController = require('../controllers/cartController');
const orderController = require('../controllers/orderController');
const couponController = require('../controllers/couponController');
const tempUserVerify = require('../middleware/tempUserVerify');
const userVerify = require('../middleware/userVerify');
const wishlistController = require('../controllers/wishlistController');

/* GET home page. */

router.use(userVerify.wishListCount);
router.use(userVerify.cartCount);
router.get('/', userController.HomePage);
router.get('/login', userController.LoginPage);
router.post('/login',userController.postlogin);
router.get('/logout',userController.logout);
router.get('/signUp', userController.signUpPage)
router.post('/signup',userController.postSignUP);
router.get('/forgetPassword',userController.forgetPassword);
router.get('/profile',userVerify.verifyUserLogin,userController.userProfile);
router.patch('/address',userController.updateUserAddress);
router.delete('/address/:id',userController.deleteUserAddress);
router.patch('/profile/:id',userController.editUserProfile);
router.post('/email-otp',userController.sendOtpEmail);
router.post('/email-otp-verify',userController.verifyEmailOtp);
router.get('/reset-password',userController.resetPassword);
router.post('/reset-password',userController.resetNewPassword);
router.post('/update-user-password',userController.confirmAndUpdatePassword);

//otp controller 
router.get('/otp',tempUserVerify.verifyTempLogin,otpController.otpPage);
router.post('/otp',otpController.postOtp);


//prodcut controller

router.get('/menCollection',productController.mensPage);
router.get('/womenCollection',productController.womensPage);
router.get('/kidsCollection',productController.kidsPage);
router.get('/image/:id',productController.viewImage);
router.get('/shop',productController.shopPage);
router.post('/shop',productController.postSearch);
router.get('/gender-shop/:gender?/:category?',productController.genderFilter);


//cart controller
router.get('/cart',userVerify.verifyUserLogin,cartController.getCartProducts);
router.get('/add-to-Cart/:id/',cartController.addToCart);
router.post('/change-product-quantity',cartController.changeProductQuantity);


router.post('/remove-product-cart',cartController.removeProductCart);
router.get('/checkout',userVerify.verifyUserLogin,cartController.checkOutPage);
router.get('/product-size-selector/:id/',cartController.productSizeSelector)

  
//order controller
router.post('/place-order',orderController.placeOrder);
router.get('/order-success',userVerify.verifyUserLogin,orderController.orderSuccess);
router.get('/orders',userVerify.verifyUserLogin,orderController.orderDetails);
router.get('/view-placed-orders/:id',userVerify.verifyUserLogin,orderController.viewPlacedOrder);
router.post('/verify-payment',orderController.paymentVerify);
router.post('/delivery-address',orderController.deliveryAddressSave);
router.get('/paymentsuccess/',userVerify.verifyUserLogin,orderController.successPagePayPal);
router.get('/paypal-cancel/',userVerify.verifyUserLogin,orderController.cancelPagePayPal)
router.get('/payment-failed',userVerify.verifyUserLogin,orderController.paymentFailed);
router.post('/orders',orderController.orderSearch);
router.post('/orders/date',orderController.sortOrders);
router.get('/invoice/',userVerify.verifyUserLogin,orderController.invoice);
router.get('/cancel-order/',userVerify.verifyUserLogin,orderController.cancelOrder);
router.get('/order-cancelled-list',userVerify.verifyUserLogin,orderController.listOfCancelledOrder);
router.get('/order-not-shipped',userVerify.verifyUserLogin,orderController.listOfNotShippedOrder);
router.get('/return-order/',userVerify.verifyUserLogin,orderController.returnOrder);
router.get('/order-returned-list',userVerify.verifyUserLogin,orderController.listOfReturnedOrder);
router.get('/order-summary',userVerify.verifyUserLogin,orderController.orderSummary);



//coupon controller
router.post('/apply-coupon',couponController.applyCoupon);
router.get('/remove-coupon',couponController.removeCoupon);

//wishlist
router.get('/add-to-wishlist/:id',wishlistController.addToWishList);
router.get('/wishlist',wishlistController.wishListPage);
router.get('/wishlist/:id',wishlistController.removeFromWishlist);
router.get('/wishlist-to-cart/:id',wishlistController.wishlistToProDetails);



module.exports = router;
