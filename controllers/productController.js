




const Review = require("../models/review.js");
const Product = require("../models/product.js");
const User = require("../models/user.js");
const ExpressError = require("../utils/ExpressError.js");

module.exports.index = async (req, res) => {
    const { q } = req.query;
    let filter = {};
    if (q) filter.name = { $regex: q, $options: "i" };

    const allProducts = await Product.find(filter);
    const categories = await Product.distinct("category");

    const catImages = {
        Fruits: "https://cdn-icons-png.flaticon.com/512/3194/3194591.png",
        Vegetables: "https://cdn-icons-png.flaticon.com/512/2329/2329903.png",
        Leafy: "https://cdn-icons-png.flaticon.com/512/2329/2329865.png",
        Roots: "https://cdn-icons-png.flaticon.com/512/1041/1041344.png",
        Grocery: "https://cdn-icons-png.flaticon.com/512/3724/3724720.png",
        Grains: "https://cdn-icons-png.flaticon.com/512/3228/3228387.png"
    };

    res.render("products/index.ejs", { allProducts, categories, catImages, q });
};

module.exports.newForm = (req, res) => {
    res.render("products/new.ejs");
};

module.exports.cart = async (req, res) => {
    let cartData = req.user ? req.user.cart : (req.session.cartItems || []);
    const productIds = cartData.map(item => item.product);
    const products = await Product.find({ _id: { $in: productIds } });

    res.render("products/cart.ejs", { cartItems: cartData, products });
};

module.exports.category = async (req, res) => {
    const { catName } = req.params;
    const catProducts = await Product.find({ category: catName });
    res.render("products/category.ejs", { catProducts });
};

module.exports.updateCart = async (req, res) => {
    const { id } = req.params;
    const { action } = req.body;
    const user = req.user;

    if (user) {
        const cartItem = user.cart.find(item => item.product.equals(id));
        const product = await Product.findById(cartItem.product);

        if (cartItem && product) {
            if (action === "inc") {
                if (cartItem.quantity < product.quantity) {
                    cartItem.quantity += 1;
                } else {
                    return res.json({ success: false, message: `Only ${product.quantity} items in stock.` });
                }
            } else if (action === "dec" && cartItem.quantity > 1) {
                cartItem.quantity -= 1;
            }
            await user.save();
        }
    } else {
        if (req.session.cartItems) {
            const cartItem = req.session.cartItems.find(item => item.product.toString() === id.toString());
            if (cartItem) {
                if (action === "inc") cartItem.quantity += 1;
                else if (action === "dec" && cartItem.quantity > 1) cartItem.quantity -= 1;
            }
        }
    }

    return res.json({
        success: true,
        cartCount: user ? user.cart.length : req.session.cartItems.length
    });
};

module.exports.changeQty = async (req, res) => {
    const { action, id } = req.params;
    const dbProduct = await Product.findById(id);

    if (!dbProduct) return res.json({ success: false });

    const price = dbProduct.price;
    const discount = dbProduct.discount || 0;
    const finalPrice = price - (price * discount / 100);

    if (req.user) {
        const cartItem = req.user.cart.find(item => item.product.equals(id));
        if (!cartItem) return res.json({ success: false });

        if (action === "increasing") {
            if (cartItem.quantity < dbProduct.quantity) {
                cartItem.quantity += 1;
            } else {
                return res.json({ success: false, message: `Only ${dbProduct.quantity} items in stock.` });
            }
        } else if (action === "decreasing") {
            if (cartItem.quantity > 1) {
                cartItem.quantity -= 1;
            } else {
                req.user.cart = req.user.cart.filter(item => !item.product.equals(id));
                await req.user.save();

                let total = 0;
                for (let item of req.user.cart) {
                    const p = await Product.findById(item.product);
                    const fp = p.price - (p.price * (p.discount || 0) / 100);
                    total += item.quantity * fp;
                }

                return res.json({
                    success: true,
                    removed: true,
                    totalPrice: total,
                    cartCount: req.user.cart.length
                });
            }
        }

        await req.user.save();

        const itemSubtotal = cartItem.quantity * finalPrice;

        let total = 0;
        for (let item of req.user.cart) {
            const p = await Product.findById(item.product);
            const fp = p.price - (p.price * (p.discount || 0) / 100);
            total += item.quantity * fp;
        }

        return res.json({
            success: true,
            newQty: cartItem.quantity,
            itemSubtotal,
            totalPrice: total,
            cartCount: req.user.cart.length
        });

    } else {
        if (!req.session.cartItems) req.session.cartItems = [];

        const cartItem = req.session.cartItems.find(item => item.product == id);
        if (!cartItem) return res.json({ success: false });

        if (action === "increasing") {
            if (cartItem.quantity < dbProduct.quantity) {
                cartItem.quantity += 1;
            } else {
                return res.json({ success: false, message: `Only ${dbProduct.quantity} items in stock.` });
            }
        } else if (action === "decreasing") {
            if (cartItem.quantity > 1) {
                cartItem.quantity -= 1;
            } else {
                req.session.cartItems = req.session.cartItems.filter(item => item.product != id);

                let total = 0;
                for (let item of req.session.cartItems) {
                    const p = await Product.findById(item.product);
                    const fp = p.price - (p.price * (p.discount || 0) / 100);
                    total += item.quantity * fp;
                }

                return res.json({
                    success: true,
                    removed: true,
                    totalPrice: total,
                    cartCount: req.session.cartItems.length
                });
            }
        }

        const itemSubtotal = cartItem.quantity * finalPrice;

        let total = 0;
        for (let item of req.session.cartItems) {
            const p = await Product.findById(item.product);
            const fp = p.price - (p.price * (p.discount || 0) / 100);
            total += item.quantity * fp;
        }

        return res.json({
            success: true,
            newQty: cartItem.quantity,
            itemSubtotal,
            totalPrice: total,
            cartCount: req.session.cartItems.length
        });
    }
};

module.exports.removeCart = async (req, res) => {
    const { id } = req.params;

    if (req.user) {
        req.user.cart = req.user.cart.filter(item => !item.product.equals(id));
        await req.user.save();
    } else if (req.session.cartItems) {
        req.session.cartItems = req.session.cartItems.filter(item => item.product.toString() !== id.toString());
    }

    res.redirect("/products/cart");
};

module.exports.addToCart = async (req, res) => {
    const { id } = req.params;

    if (req.user) {
        const cartItem = req.user.cart.find(item => item.product.equals(id));
        if (cartItem) cartItem.quantity += 1;
        else req.user.cart.push({ product: id, quantity: 1 });

        await req.user.save();
    } else {
        if (!req.session.cartItems) req.session.cartItems = [];

        const item = req.session.cartItems.find(i => i.product == id);
        if (item) item.quantity += 1;
        else req.session.cartItems.push({ product: id, quantity: 1 });
    }

    res.json({
        success: true,
        quantity: 1,
        cartCount: req.user ? req.user.cart.length : req.session.cartItems.length
    });
};

module.exports.createProduct = async (req, res) => {

    let url = "";
    let filename = "";

    if (req.file) {
        url = req.file.path;
        filename = req.file.filename;
    }

    const newProduct = new Product({
        ...req.body.product,
        image: { url, filename }
    });

    await newProduct.save();

    req.flash("success", "Product Successfully Created !!");
    res.redirect("/products");
};

module.exports.showProduct = async (req, res) => {
    const { id } = req.params;
    const item = await Product.findById(id).populate("reviews");
    const category = item.category;
    const catProducts = await Product.find({ category });

    res.render("products/show.ejs", { item, catProducts });
};

module.exports.editForm = async (req, res) => {
    const { id } = req.params;
    const product = await Product.findById(id);
    res.render("products/edit.ejs", { product });
};

module.exports.updateProduct = async (req, res) => {
    const { id } = req.params;
    await Product.findByIdAndUpdate(id, { ...req.body.product }, { new: true, runValidators: true });

    req.flash("success", "Product Successfully Updated !!");
    res.redirect("/products");
};

module.exports.deleteProduct = async (req, res) => {
    const { id } = req.params;
    await Product.findByIdAndDelete(id);

    req.flash("success", "Product Successfully Deleted!!");
    res.redirect("/products");
};

module.exports.addReview = async (req, res) => {
    const { id } = req.params;

    if (!req.user) return res.redirect("/login");

    const product = await Product.findById(id);

    const newReview = new Review({
        ...req.body.review,
        user: req.user._id
    });

    await newReview.save();

    product.reviews.push(newReview._id);
    await product.save();

    res.redirect(`/products/${id}`);
};

module.exports.deleteReview = async (req, res) => {
    const { productId, reviewId } = req.params;

    const product = await Product.findById(productId).populate({
        path: "reviews",
        populate: { path: "user", select: "username" }
    });

    const review = product.reviews.find(r => r._id.toString() === reviewId);

    if (!review) return res.redirect(`/products/${productId}`);

    if (review.user.username === req.user.username) {
        await Review.findByIdAndDelete(reviewId);
        await Product.findByIdAndUpdate(productId, { $pull: { reviews: reviewId } });
    }

    res.redirect(`/products/${productId}`);
};

module.exports.showReviews = async (req, res) => {
    const { id } = req.params;

    const product = await Product.findById(id).populate({
        path: "reviews",
        populate: { path: "user", select: "username" }
    });

    if (!req.user) return res.redirect("/login");

    res.render("products/reviews", { product });
};