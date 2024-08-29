const Order = require('../models/order');
const Item = require('../models/item');
const ExpressError = require('../utils/ExpressError');

const getItems = async (req, res, next) => {
  try {
    const items = await Item.find().populate('categories');
    res.render('user/items', { items });
  } catch (error) {
    next(new ExpressError('Failed to retrieve items.', 500));
  }
};

const getOrderHistory = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id }).populate(
      'items.item',
    );
    res.render('user/orderHistory', { orders });
  } catch (error) {
    console.error('Error fetching order history:', error);
    req.flash('error', 'Failed to fetch order history.');
    res.redirect('/user/dashboard');
  }
};

const viewBill = async (req, res, next) => {
  try {
    const selectedItems = Object.values(req.body.items).filter(
      item => item.selected === 'true',
    );
    if (!selectedItems.length) {
      req.flash('error', 'No items selected for billing.');
      return res.redirect('/user/items');
    }

    const items = await Item.find({
      _id: { $in: selectedItems.map(item => item.itemId) },
    }).populate('categories');
    let totalAmount = 0,
      totalRewardPoints = 0;

    const orderItems = selectedItems.map(item => {
      const foundItem = items.find(i => i._id.toString() === item.itemId);
      const category = foundItem?.categories.find(
        cat => cat._id.toString() === item.categoryId,
      );

      if (!foundItem || !category)
        throw new ExpressError('Item or Category not found', 400);

      const quantity = parseInt(item.quantity);
      totalAmount += category.price * quantity;
      totalRewardPoints += category.reward * quantity;

      return {
        itemId: item.itemId,
        itemName: foundItem.name,
        categoryId: item.categoryId,
        categoryName: category.category,
        quantity,
        price: category.price,
      };
    });

    res.cookie(
      'orderDetails',
      JSON.stringify({ orderItems, totalAmount, totalRewardPoints }),
      { maxAge: 60000 },
    );
    res.render('user/bill', { orderItems, totalAmount, totalRewardPoints });
  } catch (error) {
    console.error('Error displaying bill:', error);
    req.flash('error', error.message || 'Failed to view the bill.');
    res.redirect('/user/items');
  }
};

const placeOrder = async (req, res, next) => {
  try {
    const { paymentOption } = req.body;
    if (!req.cookies.orderDetails) {
      req.flash('error', 'No items selected for billing.');
      return res.redirect('/user/items');
    }

    const { orderItems, totalAmount, totalRewardPoints } = JSON.parse(
      req.cookies.orderDetails,
    );

    await new Order({
      user: req.user._id,
      items: orderItems.map(item => ({
        item: item.itemId,
        quantity: item.quantity,
        price: item.price,
      })),
      totalAmount,
      totalRewardPoints,
      paymentOption,
      paymentStatus: paymentOption === 'PhonePe' ? 'Completed' : 'Pending',
    }).save();

    res.clearCookie('orderDetails');
    req.flash('success', 'Order placed successfully.');
    res.redirect('/user/orderHistory');
  } catch (error) {
    console.error('Error placing order:', error);
    req.flash('error', 'Failed to place the order.');
    res.redirect('/user/items');
  }
};

const rewardPoints = async (req, res, next) => {
  try {
    const totalRewardPoints = await Order.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: null,
          totalRewardPoints: { $sum: '$totalRewardPoints' },
        },
      },
    ]).then(results => results[0]?.totalRewardPoints || 0);

    res.render('user/reward', { totalRewardPoints });
  } catch (error) {
    console.error('Error fetching reward points:', error);
    req.flash('error', 'Failed to fetch reward points.');
    res.redirect('/user/dashboard');
  }
};

module.exports = {
  getItems,
  getOrderHistory,
  viewBill,
  placeOrder,
  rewardPoints,
};
