const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0
    },

    discount: {
      type: Number,
      default: 0,
      min: 0,
      max: 90
    },

    quantity: {
      type: Number,
      required: true,
      min: 0
    },

    sold_count: {
      type: Number,
      default: 0,
      min: 0
    },

    category: {
      type: String,
      required: true,
      index: true
    },

    description: {
      type: String,
      default: ""
    },

   image: {
  url: {
    type: String,
    default: "https://cdn-icons-png.flaticon.com/512/679/679922.png"
  },
  filename: {
    type: String,
    default: ""
  }
},

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
     
    },

    isActive: {
      type: Boolean,
      default: true
    },
    reviews : [
      {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Review",
      }
    ]
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);
module.exports = Product