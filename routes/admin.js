const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

router.get(
  '/dashboard',
  authMiddleware,
  adminMiddleware,
  asyncHandler(adminController.getDashboard),
);

router.get(
  '/users',
  authMiddleware,
  adminMiddleware,
  asyncHandler(adminController.getAllUsers),
);

router.get(
  '/orderHistory',
  authMiddleware,
  adminMiddleware,
  asyncHandler(adminController.getOrderDetails),
);
router.post(
  '/orders/:orderId/update',
  authMiddleware,
  adminMiddleware,
  asyncHandler(adminController.updateOrder),
);
router.post(
  '/orders/:orderId/delete',
  authMiddleware,
  adminMiddleware,
  asyncHandler(adminController.deleteOrder),
);

router.get(
  '/items',
  authMiddleware,
  adminMiddleware,
  asyncHandler(adminController.manageItems),
);
router.post(
  '/items/create',
  authMiddleware,
  adminMiddleware,
  asyncHandler(adminController.createItem),
);
router.post(
  '/items/:itemId/update',
  authMiddleware,
  adminMiddleware,
  asyncHandler(adminController.updateItem),
);
router.post(
  '/items/:itemId/delete',
  authMiddleware,
  adminMiddleware,
  asyncHandler(adminController.deleteItem),
);

module.exports = router;
