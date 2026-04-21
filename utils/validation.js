const reviewJoiSchema = require("../reviewJoiSchema.js")
const productJoiSchema = require("../productJoiSchema")
const ExpressError = require("./ExpressError.js");
const mongoose = require("mongoose");

function validateProduct(req,res,next) {
  const { error } = productJoiSchema.validate(req.body);

  if (error) {
    const msg = error.details.map(e => e.message).join(",");
    return next(new ExpressError(400, msg));
  }

  next();
}


function validateReview(req,res,next) {
  const { error } = reviewJoiSchema.validate(req.body);

  if (error) {
    const msg = error.details.map(e => e.message).join(",");
    return next(new ExpressError(400, msg));
  }

  next();
}


const validateObjectId = (id)=>{
    return mongoose.Types.ObjectId.isValid(id);
}




module.exports = {validateReview ,validateProduct,validateObjectId};