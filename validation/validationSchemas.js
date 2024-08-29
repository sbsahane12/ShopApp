const Joi = require('joi');

const categorySchema = Joi.object({
  category: Joi.string().required().messages({
    'string.empty': 'Category is required.',
  }),
  price: Joi.number().positive().required().messages({
    'number.base': 'Price must be a number.',
    'number.positive': 'Price must be positive.',
    'any.required': 'Price is required.',
  }),
  reward: Joi.number().integer().positive().required().messages({
    'number.base': 'Reward must be a number.',
    'number.positive': 'Reward must be positive.',
    'any.required': 'Reward is required.',
  }),
});

const itemSchema = Joi.object({
  name: Joi.string().required().messages({
    'string.empty': 'Name is required.',
  }),
  description: Joi.string().optional(),
  categories: Joi.string().required().messages({
    'string.empty': 'categories is required.',
  }),
  selectedCategory: Joi.string().optional(),
});

const orderSchema = Joi.object({
  status: Joi.string()
    .valid('Pending', 'Completed', 'Cancelled')
    .required()
    .messages({
      'any.only': 'Invalid status.',
      'string.empty': 'Status is required.',
    }),
  paymentStatus: Joi.string()
    .valid('Pending', 'Completed')
    .required()
    .messages({
      'any.only': 'Invalid payment status.',
      'string.empty': 'Payment Status is required.',
    }),
});

module.exports = { orderSchema, categorySchema, itemSchema };
