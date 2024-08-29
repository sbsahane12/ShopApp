const User = require('../models/user');
const Order = require('../models/order');
const Item = require('../models/item');
const Category = require('../models/category');
const { itemSchema, orderSchema } = require('../validation/validationSchemas');
const getDashboard = async (req, res) => {
  res.render('admin/dashboard');
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: 'user' });
    const usersWithRewards = await Promise.all(
      users.map(async user => {
        const orders = await Order.find({ user: user._id });
        const totalRewardPoints = orders.reduce(
          (acc, order) => acc + (order.totalRewardPoints || 0),
          0,
        );
        return { user, totalRewardPoints };
      }),
    );

    res.render('admin/user', { usersWithRewards });
  } catch (error) {
    req.flash('error', 'Failed to fetch users or reward points.');
    res.redirect('/admin/users');
  }
};
const manageItems = async (req, res) => {
  try {
    const items = await Item.find().populate('categories');
    res.render('admin/items', { items });
  } catch (error) {
    req.flash('error', 'Failed to fetch items.');
    res.redirect('/admin/items');
  }
};

const deleteItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.itemId);
    if (!item) {
      req.flash('error', 'Item not found.');
      return res.redirect('/admin/items');
    }
    await Promise.all([
      Order.deleteMany({ 'items.item': req.params.itemId }),
      Category.deleteMany({ _id: { $in: item.categories } }),
      Item.findByIdAndDelete(req.params.itemId),
    ]);
    req.flash('success', 'Item deleted successfully.');
    res.redirect('/admin/items');
  } catch (error) {
    req.flash('error', 'Failed to delete the item.');
    res.redirect('/admin/items');
  }
};

const getOrderDetails = async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const startOfDay = new Date().setHours(0, 0, 0, 0);
    const endOfDay = new Date().setHours(23, 59, 59, 999);

    // Fetch and populate orders
    const [last7DaysOrders, todayOrders, allOrders] = await Promise.all([
      Order.find({ status: 'Pending', createdAt: { $gte: sevenDaysAgo } }),
      Order.find({
        status: 'Pending',
        createdAt: { $gte: startOfDay, $lte: endOfDay },
      }),
      Order.find()
        .populate({
          path: 'items.item',
          populate: {
            path: 'categories',
            model: 'Category',
          },
        })
        .populate('user')
        .exec(),
    ]);

    // Fetch categories for each item
    for (const order of allOrders) {
      for (const orderItem of order.items) {
        if (orderItem.item && orderItem.item.selectedCategory) {
          const category = await Category.findById(
            orderItem.item.selectedCategory,
          ).exec();
          orderItem.item.selectedCategoryName = category
            ? category.category
            : 'Unknown';
        }
      }
    }

    res.render('admin/orderHistory', {
      allOrders,
      last7DaysOrders,
      todayOrders,
    });
  } catch (error) {
    req.flash('error', 'Failed to fetch orders.');
    res.redirect('/admin/orderHistory');
  }
};

const createItem = async (req, res) => {
  try {
    const { error } = itemSchema.validate(req.body);
    if (error) {
      console.log('Item validation error:', error.details);
      req.flash('error', error.details[0].message);
      return res.redirect('/admin/items');
    }

    const { name, description, categories } = req.body;
    const categoryObjects = categories.split(',').map(cat => {
      const [category, price, rewardPoints] = cat.trim().split('-');
      return {
        category,
        price: parseFloat(price),
        reward: parseFloat(rewardPoints),
      };
    });
    const savedCategories = await Category.insertMany(categoryObjects);
    const item = new Item({
      name,
      description,
      categories: savedCategories.map(cat => cat._id),
      selectedCategory: savedCategories[0]._id,
    });
    await item.save();
    req.flash('success', 'Item created successfully.');
    res.redirect('/admin/items');
  } catch (error) {
    console.log('Error creating item:', error);
    req.flash('error', 'Failed to create the item.');
    res.redirect('/admin/items');
  }
};

const updateItem = async (req, res) => {
  try {
    const { error } = itemSchema.validate(req.body);
    if (error) {
      console.log('Item validation error:', error.details);
      req.flash('error', error.details[0].message);
      return res.redirect('/admin/items');
    }

    const { name, description, categories } = req.body;
    const categoryIds = await Promise.all(
      categories.split(',').map(async cat => {
        const [category, price, reward] = cat.trim().split('-');
        let existingCategory = await Category.findOne({
          category,
          price: parseFloat(price),
          reward,
        });
        if (!existingCategory) {
          existingCategory = await new Category({
            category,
            price: parseFloat(price),
            reward,
          }).save();
        }
        return existingCategory._id;
      }),
    );
    await Item.findByIdAndUpdate(req.params.itemId, {
      name,
      description,
      categories: categoryIds,
    });
    req.flash('success', 'Item updated successfully.');
    res.redirect('/admin/items');
  } catch (error) {
    console.log('Error updating item:', error);
    req.flash('error', 'Failed to update the item.');
    res.redirect('/admin/items');
  }
};

const updateOrder = async (req, res) => {
  try {
    const { error } = orderSchema.validate(req.body);
    if (error) {
      console.log('Order validation error:', error.details);
      req.flash('error', error.details[0].message);
      return res.redirect('/admin/orderHistory');
    }

    const { status, paymentStatus } = req.body;
    const updateData = { status, paymentStatus };
    await Order.findByIdAndUpdate(req.params.orderId, updateData);
    req.flash('success', 'Order updated successfully.');
    res.redirect('/admin/orderHistory');
  } catch (error) {
    console.log('Error updating order:', error);
    req.flash('error', 'Failed to update the order.');
    res.redirect('/admin/orderHistory');
  }
};

const deleteOrder = async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.orderId);
    req.flash('success', 'Order deleted successfully.');
    res.redirect('/admin/orderHistory');
  } catch (error) {
    console.log('Error deleting order:', error);
    req.flash('error', 'Failed to delete the order.');
    res.redirect('/admin/orderHistory');
  }
};

module.exports = {
  getDashboard,
  getAllUsers,
  updateOrder,
  deleteOrder,
  manageItems,
  createItem,
  updateItem,
  deleteItem,
  getOrderDetails,
};
