const Joi = require("joi");
const reviewJoiSchema = Joi.object({
  review: Joi.object({
    comment: Joi.string().min(5).required(),
    rating: Joi.number().min(1).max(5).required()
  }).required()
});

module.exports = reviewJoiSchema;