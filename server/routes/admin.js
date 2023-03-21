const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const userController = require('../controllers/userController');
const productController = require('../controllers/productController');

/* GET users listing. */

//admin Controller
router.get('/', adminController.adminLogin);
router.post('/', adminController.postAdminlogin);


router.use(verifyAdminLogin = (req, res, next) => {
    if (req.session.admin) {
      next();
    } else {
      res.redirect('/admin');
    }
 });
 
router.get('/dashboard',adminController.getDashboard);
router.get('/logout',adminController.logout);

//productController
router.get('/Product',productController.addProductPage);
router.post('/Product',productController.postProduct);
router.get('/viewProduct',productController.viewProduct);
router.get('/viewProduct/men',productController.men);
router.get('/viewProduct/women',productController.women);
router.get('/viewProduct/kid',productController.kid);
router.get('/edit/:id',productController.getEditProductPage);
router.delete('/edit/:id',productController.deleteProduct);
router.put('/edit/:id',productController.editProduct);

//userController
router.get('/users',userController.userslist);
router.get('/block/:id',userController.blockUser);
router.get('/unBlock/:id',userController.unBlockUser);
router.delete('/delete/:id',userController.deleteUser);



module.exports = router;
