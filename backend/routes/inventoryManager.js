const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryManager');

router.post('/items', inventoryController.createInventoryItem);
router.get('/items', inventoryController.getAllInventoryItems);
router.get('/items/:id', inventoryController.getInventoryItemById);
router.put('/items/:id', inventoryController.updateInventoryItem);

router.post('/transactions', inventoryController.recordStockTransaction);
router.get('/transactions/:itemId', inventoryController.getTransactionsByItem);

module.exports = router;
