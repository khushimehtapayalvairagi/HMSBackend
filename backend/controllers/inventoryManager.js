const InventoryItem = require('../models/InventoryItems');
const StockTransaction = require('../models/StockTransaction');

exports.createInventoryItem = async (req, res) => {
    try {
        const {
            itemName,
            itemCode,
            category,
            unitOfMeasurement,
            minStockLevel,
            maxStockLevel,
            supplierInfo
        } = req.body;

        if (!itemName || !itemCode || !category || !unitOfMeasurement || minStockLevel == null || maxStockLevel == null) {
            return res.status(400).json({ message: 'All fields except currentStock and lastRestockedDate are required.' });
        }

        if (!supplierInfo || !supplierInfo.name || !supplierInfo.contact) {
            return res.status(400).json({ message: 'Supplier name and contact are required.' });
        }
        const existing = await InventoryItem.findOne({ itemCode });
if (existing) {
  return res.status(400).json({ message: `Item code '${itemCode}' already exists.` });
}


        const item = new InventoryItem({
            itemName,
            itemCode,
            category,
            unitOfMeasurement,
            minStockLevel,
            maxStockLevel,
            supplierInfo,
            currentStock: req.body.currentStock || 0
        });

        await item.save();
        res.status(201).json({ message: 'Item created.', item });
    } catch (error) {
        console.error('Create Inventory Item Error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
};

exports.getAllInventoryItems = async (req, res) => {
    try {
        const items = await InventoryItem.find();
        res.status(200).json({ items });
    } catch (error) {
        res.status(500).json({ message: 'Server error.' });
    }
};

exports.getInventoryItemById = async (req, res) => {
    try {
        const item = await InventoryItem.findById(req.params.id);
        if (!item) return res.status(404).json({ message: 'Item not found.' });
        res.status(200).json({ item });
    } catch (error) {
        res.status(500).json({ message: 'Server error.' });
    }
};

exports.updateInventoryItem = async (req, res) => {
    try {
        const item = await InventoryItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!item) return res.status(404).json({ message: 'Item not found.' });
        res.status(200).json({ message: 'Item updated.', item });
    } catch (error) {
        res.status(500).json({ message: 'Server error.' });
    }
};

exports.recordStockTransaction = async (req, res) => {
    try {
        const { itemId, transactionType, quantity, userId, remarks } = req.body;

        if (!itemId || !transactionType || quantity == null || !userId) {
            return res.status(400).json({ message: 'itemId, transactionType, quantity, and userId are required.' });
        }

        if (!['In', 'Out'].includes(transactionType)) {
            return res.status(400).json({ message: 'transactionType must be "In" or "Out".' });
        }

        if (quantity <= 0) {
            return res.status(400).json({ message: 'Quantity must be greater than zero.' });
        }

        const item = await InventoryItem.findById(itemId);
        if (!item) return res.status(404).json({ message: 'Item not found.' });

        if (transactionType === 'In') {
            item.currentStock += quantity;
            item.lastRestockedDate = new Date();
        } else {
            if (item.currentStock < quantity) {
                return res.status(400).json({ message: 'Insufficient stock.' });
            }
            item.currentStock -= quantity;
        }

        await item.save();

        const transaction = new StockTransaction({
            itemId,
            transactionType,
            quantity,
            userId,
            remarks
        });

        await transaction.save();

        res.status(201).json({ message: 'Transaction recorded.', transaction });
    } catch (error) {
        res.status(500).json({ message: 'Server error.' });
    }
};

exports.getTransactionsByItem = async (req, res) => {
    try {
        const transactions = await StockTransaction.find({ itemId: req.params.itemId }).populate('userId', 'name role');
        res.status(200).json({ transactions });
    } catch (error) {
        res.status(500).json({ message: 'Server error.' });
    }
};
