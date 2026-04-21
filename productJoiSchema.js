const Joi = require("joi");
const productJoiSchema = Joi.object({
  product: Joi.object({
    name: Joi.string().trim().min(3).required(),
    price: Joi.number().min(0).required(),
    discount: Joi.number().min(0).max(90),
    quantity: Joi.number().min(0).required(),
    category: Joi.string().required(),
    description: Joi.string().allow(""),
    image: Joi.string().uri().allow("")
  }).required()
});

module.exports = productJoiSchema;

