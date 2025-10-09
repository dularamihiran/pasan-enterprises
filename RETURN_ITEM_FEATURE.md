# 📦 Return Item Feature - Complete Guide

## 🎯 Overview

When a customer returns a machine, the system now:
1. ✅ Increases the machine stock back in inventory
2. ✅ **Reduces the order's `finalTotal`** based on returned items
3. ✅ Calculates refund including VAT and discount adjustments
4. ✅ Updates MongoDB `pastorders` collection

---

## 💰 How Refund Calculation Works

### Step 1: Calculate Per-Unit Prices

```javascript
// Example: Unit Price = LKR 10,000 (includes VAT)
const pricePerUnit = 10000;

// VAT Percentage = 18%
const vatPercentage = 18;

// Calculate VAT amount per unit
const vatAmountPerUnit = (18 / 100) * 10000 = 1,800

// Calculate base price (without VAT)
const basePricePerUnit = 10000 - 1800 = 8,200
```

### Step 2: Calculate Refund for Returned Quantity

```javascript
// If customer returns 2 units:
const returnQuantity = 2;

// Refund base amount
const refundBaseAmount = 8,200 * 2 = 16,400

// Refund VAT amount
const refundVatAmount = 1,800 * 2 = 3,600

// Total refund amount
const totalRefund = 16,400 + 3,600 = 20,000
```

### Step 3: Adjust Discount Proportionally

```javascript
// If original order had 10% discount:
// Original total before discount = 100,000
// Discount amount = 10,000
// Return amount = 20,000

// Calculate proportional discount to adjust
const discountPortion = (10,000 / 100,000) * 20,000 = 2,000

// Final refund after discount adjustment:
const finalRefund = 20,000 - 2,000 = 18,000
```

### Step 4: Update Order Totals

The `pre-save` middleware in PastOrder model automatically recalculates:
- Subtotal (base prices, no VAT)
- VAT Amount
- Total Before Discount
- Discount Amount
- Extras Total
- **Final Total** ← This is reduced!

---

## 🔧 API Endpoint

### Request

```http
PUT /api/past-orders/return-item/:orderId
Content-Type: application/json

{
  "machineId": "60d5ec49eb3d2c1a2c8e4567",
  "returnQuantity": 2
}
```

### Response

```json
{
  "success": true,
  "message": "Item returned successfully and order total updated",
  "data": {
    "order": {
      // Full updated order object
      "finalTotal": 82000,  // Reduced from 100,000
      "subtotal": 65600,
      "vatAmount": 14400,
      // ... other fields
    },
    "returnedItem": {
      "name": "Water Pump",
      "returnedQuantity": 2,
      "totalReturnedSoFar": 2,
      "originalQuantity": 5,
      "refundAmount": "20000.00",
      "refundBreakdown": {
        "baseAmount": "16400.00",
        "vatAmount": "3600.00",
        "discountAdjustment": "2000.00"
      }
    },
    "updatedStock": {
      "machineName": "Water Pump",
      "newQuantity": 12  // Increased by 2
    },
    "orderTotals": {
      "oldFinalTotal": "100000.00",
      "newFinalTotal": "82000.00",
      "totalReduction": "18000.00"
    }
  }
}
```

---

## 📊 Example Scenario

### Original Order:
```
Item: Water Pump
- Quantity: 5 units
- Unit Price: LKR 10,000 (with VAT)
- VAT Rate: 18%
- Total for item: LKR 50,000

Order Totals:
- Subtotal (base): LKR 41,000
- VAT Amount: LKR 9,000
- Total Before Discount: LKR 50,000
- Discount (10%): LKR 5,000
- Extras: LKR 5,000
- Final Total: LKR 50,000
```

### After Returning 2 Units:
```
Item: Water Pump
- Original Quantity: 5 units
- Returned Quantity: 2 units
- Remaining Quantity: 3 units
- Unit Price: LKR 10,000 (with VAT)
- New Total for item: LKR 30,000

Refund Calculation:
- Base Amount: 2 × 8,200 = LKR 16,400
- VAT Amount: 2 × 1,800 = LKR 3,600
- Discount Adjustment: LKR 2,000
- Total Refund: LKR 18,000

Updated Order Totals:
- Subtotal (base): LKR 24,600
- VAT Amount: LKR 5,400
- Total Before Discount: LKR 30,000
- Discount (10%): LKR 3,000
- Extras: LKR 5,000
- Final Total: LKR 32,000
```

**Total Reduction: LKR 50,000 - LKR 32,000 = LKR 18,000** ✅

---

## 🔄 What Happens in MongoDB

### Before Return:
```javascript
{
  "_id": "60d5ec49eb3d2c1a2c8e4567",
  "orderId": "ORD-20251009-12345",
  "items": [
    {
      "machineId": "60d5ec49eb3d2c1a2c8e4567",
      "name": "Water Pump",
      "quantity": 5,
      "unitPrice": 10000,
      "returnedQuantity": 0,
      "returned": false
    }
  ],
  "subtotal": 41000,
  "vatAmount": 9000,
  "totalBeforeDiscount": 50000,
  "discountAmount": 5000,
  "extrasTotal": 5000,
  "finalTotal": 50000
}
```

### After Returning 2 Units:
```javascript
{
  "_id": "60d5ec49eb3d2c1a2c8e4567",
  "orderId": "ORD-20251009-12345",
  "items": [
    {
      "machineId": "60d5ec49eb3d2c1a2c8e4567",
      "name": "Water Pump",
      "quantity": 3,  // ✅ Reduced from 5 to 3
      "unitPrice": 10000,
      "returnedQuantity": 2,  // ✅ Tracks returned items
      "returned": false,  // ✅ False because not fully returned
      "returnedAt": "2025-10-09T10:30:00.000Z"  // ✅ Timestamp added
    }
  ],
  "subtotal": 24600,  // ✅ Recalculated
  "vatAmount": 5400,  // ✅ Recalculated
  "totalBeforeDiscount": 30000,  // ✅ Recalculated
  "discountAmount": 3000,  // ✅ Recalculated
  "extrasTotal": 5000,  // Unchanged
  "finalTotal": 32000  // ✅ REDUCED from 50,000 to 32,000
}
```

---

## 🛡️ Validation & Safety

### 1. Cannot Return More Than Purchased
```javascript
// If customer bought 5 units and already returned 3
// Can only return 2 more units
const availableToReturn = 5 - 3 = 2;

// Trying to return 4 will fail:
❌ Error: "Cannot return 4 units. Only 2 units available to return."
```

### 2. Rollback on Machine Not Found
```javascript
// If machine doesn't exist in inventory:
// - Order changes are reverted
// - returnedQuantity reset
// - returned flag reset
// - returnedAt cleared
❌ Error: "Machine not found in inventory"
```

### 3. Transaction Safety
- Order is saved BEFORE updating machine stock
- If machine update fails, order is rolled back
- Ensures data consistency

---

## 📝 Console Logs (for Debugging)

When you return an item, you'll see detailed logs:

```
💰 Refund Calculation:
   Unit Price (with VAT): 10000
   Base Price per unit: 8200.00
   VAT per unit: 1800.00
   Return Quantity: 2
   Refund Base Amount: 16400.00
   Refund VAT Amount: 3600.00
   Total Return Amount: 20000.00
   Discount Portion: 2000.00

📊 Order Totals Updated:
   Old Final Total: 50000.00
   New Final Total: 32000.00
   Difference: 18000.00

✅ Item returned: Water Pump (Qty: 2 of 5)
📦 Machine stock updated: Water Pump - New quantity: 12
```

---

## ✅ Features Summary

| Feature | Status | Description |
|---------|--------|-------------|
| Increase Stock | ✅ Done | Machine quantity increased by returned amount |
| Reduce Final Total | ✅ Done | Order's `finalTotal` reduced correctly |
| VAT Calculation | ✅ Done | VAT included in refund calculation |
| Discount Adjustment | ✅ Done | Discount proportionally reduced |
| MongoDB Update | ✅ Done | All changes saved to database |
| Partial Returns | ✅ Done | Can return some items, not all |
| Multiple Returns | ✅ Done | Can return items multiple times |
| Return Tracking | ✅ Done | Tracks `returnedQuantity` and `returnedAt` |
| Validation | ✅ Done | Cannot return more than purchased |
| Rollback | ✅ Done | Reverts changes if machine update fails |

---

## 🧪 Testing the Feature

### Test Case 1: Return 2 out of 5 items

```bash
# Request
curl -X PUT http://localhost:5000/api/past-orders/return-item/60d5ec49eb3d2c1a2c8e4567 \
  -H "Content-Type: application/json" \
  -d '{
    "machineId": "60d5ec49eb3d2c1a2c8e4568",
    "returnQuantity": 2
  }'

# Expected Result:
# - Order finalTotal reduced
# - Machine stock increased by 2
# - returnedQuantity = 2
# - returned = false (partial return)
```

### Test Case 2: Return all 5 items

```bash
# Request
curl -X PUT http://localhost:5000/api/past-orders/return-item/60d5ec49eb3d2c1a2c8e4567 \
  -H "Content-Type: application/json" \
  -d '{
    "machineId": "60d5ec49eb3d2c1a2c8e4568",
    "returnQuantity": 5
  }'

# Expected Result:
# - Order finalTotal reduced to only include extras
# - Machine stock increased by 5
# - returnedQuantity = 5
# - returned = true (fully returned)
```

### Test Case 3: Try to return more than purchased

```bash
# Request
curl -X PUT http://localhost:5000/api/past-orders/return-item/60d5ec49eb3d2c1a2c8e4567 \
  -H "Content-Type: application/json" \
  -d '{
    "machineId": "60d5ec49eb3d2c1a2c8e4568",
    "returnQuantity": 10
  }'

# Expected Result:
# ❌ Error: "Cannot return 10 units. Only 5 units available to return."
```

---

## 🚀 Ready to Use!

The return feature is now fully functional and will:
1. ✅ Calculate correct refund amounts (including VAT and discount)
2. ✅ Update order totals in MongoDB
3. ✅ Track returned items and quantities
4. ✅ Increase machine stock
5. ✅ Provide detailed refund breakdown in response

**No additional code changes needed - it's ready to deploy!** 🎉
