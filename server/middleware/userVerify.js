const wishlist = require('../models/wishlistSchema')
const Cart = require('../models/cartSchema')
const User = require('../models/userSchema')

exports.verifyUserLogin =async (req, res, next) => {
    if (req.session.user) {
        
        next();
    } else {
        res.redirect('/login');
    }
};

exports.wishListCount = async(req,res,next)=>{
    if (req.session.user) {
       
        console.log()
        let wishListCount = 0
        const wishItem = await wishlist.findOne({user_id:req.session.user._id})
        const user = await User.findOne({_id:req.session.user._id})
        res.locals.user = user
        if(wishItem){
            wishListCount = wishItem.products.length;
            req.session.user.wishListCount = wishListCount;
            res.locals.wishListCount=req.session.user.wishListCount;
        }
       
        next();
    } else{
        next();
    }
}


exports.cartCount = async(req,res,next)=>{

    if(req.session.user){
         let count = 0;
         let cart = await Cart.findOne({user:req.session.user._id})
        if(cart){
            count = cart.products.reduce((acc, product) => acc + product.quantity, 0);
            req.session.user.count = count;
            res.locals.count=req.session.user.count;
        }
        next();
    } else{
        next();
    }
}