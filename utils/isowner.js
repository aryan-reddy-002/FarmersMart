// middleware.js
module.exports.isOwner = (req, res, next) => {
    // Check if user is logged in
    if (!req.isAuthenticated()) {
        req.flash("error", "You must be logged in first!");
        return res.redirect("/login");
    }
    
    //  Check if the user is the owner
    //  Use your specific owner logic here
    if (req.user.role !== "owner" || req.user.username !== "farmersmart") {
        req.flash("error", "Access Denied: You do not have permission to do that!");
        return res.redirect(`/products/${req.params.id}`);
    }
    
    //  If they are the owner, proceed to the next function
    next();
};