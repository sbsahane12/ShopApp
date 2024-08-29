const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authMiddleware } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

router.get('/user/dashboard', authMiddleware, (req, res) => {
  res.render('user/home');
});

router.get("/user/support",authMiddleware,(req,res)=>{
  res.render('user/support')
})

router.get(
  '/user/items',
  authMiddleware,
  asyncHandler(userController.getItems),
);
router.post(
  '/user/items/viewBill',
  authMiddleware,
  asyncHandler(userController.viewBill),
);
router.post(
  '/user/items/placeOrder',
  authMiddleware,
  asyncHandler(userController.placeOrder),
);
router.get(
  '/user/orderHistory',
  authMiddleware,
  asyncHandler(userController.getOrderHistory),
);
router.get(
  '/user/rewardPoints',
  authMiddleware,
  asyncHandler(userController.rewardPoints),
);

module.exports = router;
