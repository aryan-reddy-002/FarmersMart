const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true 
    },

    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true
        },
        
        name: { type: String, required: true }, 
        price: { type: Number, required: true }, 
        quantity: { type: Number, required: true, min: 1 }
      }
    ],

    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },

    
    shippingAddress: {
      type: String,
      required: true
    },


    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending"
    },

    orderStatus: {
      type: String,
      enum: ["processing", "shipped", "delivered","cancelled"],
      default: "processing"
    },

    paymentMethod: {
      type: String,
      required: true,
      enum: ["COD", "UPI", "Card"]
    },
    

    deliveryToken: {
      type: String,
      unique: true,
      sparse: true 
    },


    deliveredAt: {
      type: Date
    },

   
    transactionId: {
      type: String
    }
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;