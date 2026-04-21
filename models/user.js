const mongoose = require("mongoose");
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    role: { 
      type: String, 
      enum: ["user", "owner"], 
      default: "user" 
    },
    cart: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        quantity: { type: Number, default: 1 }
      }
    ],
    // LINK ADDED HERE: Array of Order ObjectIds
    orders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order"
      }
    ],
    address: { type: String, required: true },
    phoneNumber: { 
      type: String, 
      minLength: 10,
      maxLength: 10,
      required: true 
    }
  },
  { timestamps: true }
);

const pluginFunction = typeof passportLocalMongoose === 'function' 
  ? passportLocalMongoose 
  : passportLocalMongoose.default;

userSchema.plugin(pluginFunction);

const User = mongoose.model("User", userSchema);
module.exports = User;