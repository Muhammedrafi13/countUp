const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const userController = require('../controllers/userController');
const productController = require('../controllers/productController');
const categoryController = require('../controllers/categoryController');
const couponController = require('../controllers/couponController');
const adminVerify = require('../middleware/adminVerify');
const orderController = require('../controllers/orderController');
/* GET users listing. */
 
//admin Controller
router.get('/', adminController.adminLogin);
router.post('/', adminController.postAdminlogin);

//middleware for admin verification
router.use(adminVerify.verifyAdmin);
 
router.get('/dashboard',adminController.getDashboard);
router.get('/logout',adminController.logout);

//productController
router.get('/Product',productController.addProductPage);
router.post('/Product',productController.postProduct);
router.get('/viewProduct',productController.viewProduct);
// router.get('/viewProduct/men',productController.men);
// router.get('/viewProduct/women',productController.women);
// router.get('/viewProduct/kid',productController.kid);
router.get('/edit/:id',productController.getEditProductPage);
router.delete('/edit/:id',productController.deleteProduct);
router.put('/edit/:id',productController.editProduct);
router.get('/enable-product/:id',productController.enableProduct);

//userController
router.get('/users',userController.userslist);
router.get('/block/:id',userController.blockUser);
router.get('/unBlock/:id',userController.unBlockUser);

router.delete('/delete/:id',userController.deleteUser);


//category Controller 
router.get('/category',categoryController.categoryPage);
router.post('/category',categoryController.postCategory);


//coupon Controller
router.get('/coupon',couponController.couponPage);
router.post('/coupon',couponController.postCoupon);
router.patch('/coupon-disable/:id',couponController.disableCoupon);
router.patch('/coupon-enable/:id',couponController.enableCoupon);
router.get('/edit-coupon',couponController.editCoupon);
router.post('/update-coupon',couponController.updateCoupon);

//orders
router.get('/orders',orderController.ordersAdminPanal);
router.post('/order-details/',orderController.orderDetailsAdmin);
router.post('/sales-report',orderController.salesReport);
router.get('/sales-report',orderController.salesSummary);




module.exports = router;

