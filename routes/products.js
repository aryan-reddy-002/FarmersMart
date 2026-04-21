// const express = require("express");
// const router = express.Router();

// const wrapAsync = require("../utils/wrapasync.js");
// const { validateProduct, validateReview, validateObjectId } = require("../utils/validation.js");
// const { isOwner } = require("../utils/isowner.js");
// const { upload } = require("../cloudConfig.js");

// const productController = require("../controllers/productController");

// router.get("/", wrapAsync(productController.index));

// router.get("/new", productController.newForm);

// router.get("/cart", wrapAsync(productController.cart));

// router.get("/category/:catName", wrapAsync(productController.category));

// router.post("/cart/update/:id", wrapAsync(productController.updateCart));

// router.post("/cart/remove/:id", wrapAsync(productController.removeCart));

// router.post("/cart/:action/:id", wrapAsync(productController.changeQty));

// router.get("/cart/:id", wrapAsync(productController.addToCart));

// router.post("/new", isOwner, validateProduct, upload.single('product[image]'), wrapAsync(productController.createProduct));

// router.get("/:id", wrapAsync(productController.showProduct));

// router.get("/:id/edit", isOwner, wrapAsync(productController.editForm));

// router.put("/:id", isOwner, validateProduct, wrapAsync(productController.updateProduct));

// router.delete("/:id", isOwner, wrapAsync(productController.deleteProduct));

// router.post("/:id/review", validateReview, wrapAsync(productController.addReview));

// router.delete("/:productId/reviews/:reviewId", wrapAsync(productController.deleteReview));

// router.get("/:id/review/show", wrapAsync(productController.showReviews));

// module.exports = router;






const express = require("express");
const router = express.Router();

const wrapAsync = require("../utils/wrapasync.js");
const { validateProduct, validateReview } = require("../utils/validation.js");
const { isOwner } = require("../utils/isowner.js");
const { upload } = require("../cloudConfig.js");

const productController = require("../controllers/productController");

router.get("/", wrapAsync(productController.index));

router.get("/new", productController.newForm);

router.get("/cart", wrapAsync(productController.cart));

router.get("/category/:catName", wrapAsync(productController.category));

router.post("/cart/update/:id", wrapAsync(productController.updateCart));

router.post("/cart/remove/:id", wrapAsync(productController.removeCart));

router.post("/cart/:action/:id", wrapAsync(productController.changeQty));

router.get("/cart/:id", wrapAsync(productController.addToCart));

router.post("/new", isOwner, validateProduct, upload.single('product[image]'), wrapAsync(productController.createProduct));

router.post("/:id/review", validateReview, wrapAsync(productController.addReview));

router.delete("/:productId/reviews/:reviewId", wrapAsync(productController.deleteReview));

router.get("/:id/review/show", wrapAsync(productController.showReviews));

router.get("/:id/edit", isOwner, wrapAsync(productController.editForm));

router.put("/:id", isOwner, validateProduct, wrapAsync(productController.updateProduct));

router.delete("/:id", isOwner, wrapAsync(productController.deleteProduct));

router.get("/:id", wrapAsync(productController.showProduct));

module.exports = router;