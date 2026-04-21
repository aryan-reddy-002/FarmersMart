const Order = require("../models/order");
const User = require("../models/user");
const Product = require("../models/product");

const QRCode = require("qrcode");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const axios = require("axios");

// ---------------- EMAIL SETUP ----------------
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// ---------------- HELPERS ----------------

async function getCoordinates(address) {
    const apiKey = process.env.OPENCAGE_API_KEY;
    const encodedAddress = encodeURIComponent(address);
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodedAddress}&key=${apiKey}`;

    const response = await axios.get(url);

    if (response.data.results.length === 0) {
        throw new Error("Address not found");
    }

    return response.data.results[0].geometry;
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;

    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

// ---------------- CONTROLLERS ----------------

// ✅ CHECKOUT
module.exports.checkout = async (req, res) => {
    console.log("---- CHECKOUT BUTTON WAS CLICKED1! ----");

    if (!req.user) {
        req.flash("error", "You must be logged in to checkout.");
        return res.redirect("/login");
    }

    const user = await User.findById(req.user._id).populate("cart.product");

    if (!user.cart || user.cart.length === 0) {
        req.flash("error", "Your cart is empty.");
        return res.redirect("/products/cart");
    }

    console.log("---- CHECKOUT BUTTON WAS CLICKED!2 ----");

    let totalAmount = 0;
    const orderItems = [];

    for (const item of user.cart) {
        const product = item.product;

        if (!product || product.quantity < item.quantity) {
            req.flash("error", `Not enough stock for ${product ? product.name : "an item"}.`);
            return res.redirect("/products/cart");
        }

        totalAmount += product.price * item.quantity;

        orderItems.push({
            product: product._id,
            name: product.name,
            price: product.price,
            quantity: item.quantity
        });

        product.quantity -= item.quantity;
        product.sold_count = (product.sold_count || 0) + item.quantity;
        await product.save();
    }

    const STORE_LAT = 13.1137;
    const STORE_LNG = 77.6368;

    const userAddress = user.address;

    let cleanAddress = userAddress
        .replace(/near/gi, "")
        .replace(/opposite/gi, "")
        .replace(/behind/gi, "")
        .replace(/\s\s+/g, ' ')
        .trim();

    try {
        console.log("Verifying Customer Address:", cleanAddress);

        const userCoords = await getCoordinates(cleanAddress);

        const distance = calculateDistance(
            STORE_LAT, STORE_LNG,
            userCoords.lat, userCoords.lng
        );

        console.log(`✅ Distance: ${distance.toFixed(2)} km`);

        if (distance > 800) {
            req.flash("error", `Too far! We only deliver within 10km. You are ${distance.toFixed(1)}km away.`);
            return res.render("products/sorry");
        }

        console.log("Success! Proceeding to order creation...");

    } catch (error) {
        console.error("CRITICAL ERROR IN ADDRESS VERIFICATION:", error.message);
        req.flash("error", "Address verification failed. Please check your address or API key.");
        return res.redirect("/products/cart");
    }

    console.log("---- CHECKOUT BUTTON WAS CLICKED4 ----");

    const deliveryToken = crypto.randomBytes(16).toString("hex");

    const newOrder = new Order({
        buyer: user._id,
        items: orderItems,
        totalAmount,
        shippingAddress: user.address,
        paymentMethod: "COD",
        paymentStatus: "pending",
        deliveryToken : deliveryToken
    });

    await newOrder.save();

const NGROK_URL = "https://jogging-mournful-nutrient.ngrok-free.dev";
const qrUrl = `${NGROK_URL}/orders/verify/${newOrder._id}/${deliveryToken}`;
    const qrCodeBuffer = await QRCode.toBuffer(qrUrl);

    const mailOptions = {
        from: `"FarmersMart Support" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: `Order Confirmed - #${newOrder._id.toString().slice(-6)}`,
        html: `
            <div style="font-family: sans-serif; border: 1px solid #ddd; padding: 20px;">
                <h2 style="color: #28a745;">Order Confirmed!</h2>
                <p>Hi ${user.username}, show this QR code to the delivery partner:</p>
                <div style="text-align: center;">
                    <img src="cid:deliveryQR" style="width: 200px;" />
                </div>
            </div>`,
        attachments: [{
            filename: 'delivery-qr.png',
            content: qrCodeBuffer,
            cid: 'deliveryQR'
        }]
    };

    await transporter.sendMail(mailOptions);

    user.orders.push(newOrder._id);
    user.cart = [];
    await user.save();

    req.flash("success", "Order placed! Check your email for the QR code.");
    res.redirect(`/orders/${newOrder._id}`);
};


// ✅ SHOW ORDER
module.exports.showOrder = async (req, res) => {
    const order = await Order.findById(req.params.id).populate("buyer");

    if (!order) return res.redirect("/");

    if (!req.user || !order.buyer._id.equals(req.user._id)) {
        return res.redirect("/");
    }

    const BASE_URL = process.env.BASE_URL;
    const qrUrl = `${BASE_URL}/orders/verify/${order._id}/${order.deliveryToken}`;
    const qrCodeUrl = await QRCode.toDataURL(qrUrl);

    res.render("orders/show", { order, qrCodeUrl });
};


// ✅ VERIFY
module.exports.verifyOrder = async (req, res) => {
    const { id, token } = req.params;

    const order = await Order.findById(id);

    if (!order) {
        return res.render("products/error", { message: "Order not found" });
    }

    if (order.deliveryToken !== token) {
        return res.render("products/error", { message: "Invalid QR" });
    }

    if (order.orderStatus === "delivered") {
        return res.render("products/completed", { order });
    }

    order.orderStatus = "delivered";
    order.paymentStatus = "completed";
    order.deliveredAt = new Date();

    await order.save();

    res.render("products/success", { order });
};