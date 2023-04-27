const Wishlist = require('../models/wishlistSchema');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const Product = require('../models/productSchema')

exports.addToWishList = async(req,res)=>{

    try{

      if(req.session.user){
        let prdId = new ObjectId(req.params.id)
        let proItmes = {
            product_id : prdId
        }

        let wishListItem = await Wishlist.findOne({ user_id: req.session.user._id})
        
        console.log(wishListItem,'ewich lsit')
        if(wishListItem){
           const productIndex = wishListItem.products.findIndex(product =>String(product.product_id) === String(prdId));
           console.log(productIndex,'value of exist or not')
    
           if(productIndex !== -1){
              return  res.json({status:false})
           }else{
            await Wishlist.updateOne({user_id:req.session.user._id},{$push:{products:proItmes}})
             return res.json({status:true})
           }
      

        }else{
            const newItem = new Wishlist({
                user_id :req.session.user._id,
                products : [proItmes]
            })
            await Wishlist.create(newItem)
           return res.json({status:true})
        }
      }else{
        console.log('hello')
        return res.json(false)
      }
       
    }catch(error){
        console.log(error)
    }

}

exports.wishListPage = async(req,res)=>{

    try{
       if(req.session.user){
           const wishItems = await Wishlist.findOne({ user_id: req.session.user._id }).populate('products.product_id');
          if (!wishItems) {
            // Handle the case when no wishlist is found
            console.log(wishItem,'newone')
            return res.render('user/wishList')
          }else {
            
            console.log(wishItems,'wishisi')
            return res.render('user/wishList',{wishItems})
          }
          
         } else{
            return res.redirect('/login')
        }
      

    }catch(error){
         console.log(error)
    }
  
}

exports.removeFromWishlist = async(req,res)=>{
    try{
        let productIdToRemove =req.params.id;
      let updatedDoc =  await Wishlist.findOneAndUpdate(
        { user_id: req.session.user._id },
        { $pull: { products: { product_id: productIdToRemove } } },
        { new: true }
      );
     console.log(updatedDoc)
      res.redirect('/wishlist')
    }catch(error){
        console.log(error)
    }
}

exports.wishlistToProDetails = async (req, res) => {
    try {
   
      let productIdToRemove =req.params.id;
      let updatedDoc =  await Wishlist.findOneAndUpdate(
        { user_id: req.session.user._id },
        { $pull: { products: { product_id: productIdToRemove } } },
        { new: true }
      );
      console.log(updatedDoc)
      const productDetails = await Product.findOne({ _id: req.params.id });
      res.render("user/productDetails", { productDetails });
    } catch (error) {
      console.log(error)
    }
  
  }