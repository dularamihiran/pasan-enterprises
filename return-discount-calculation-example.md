# Return Item Discount Calculation - CORRECT Implementation

## ✅ Core Formula

```
Step 1: originalTotalBeforeDiscount = sum of (unitPriceInclVAT × originalQuantity)
Step 2: discountAmount = originalTotalBeforeDiscount × discountRate (FIXED - never changes)
Step 3: finalTotalBeforeReturn = originalTotalBeforeDiscount - discountAmount + extras
Step 4: returnedValue = sum of (unitPriceInclVAT × returnedQuantity)
Step 5: finalTotalAfterReturn = finalTotalBeforeReturn - returnedValue
Step 6: remainingPayment = finalTotalAfterReturn - totalPaid
```

**Key Rule**: Discount is calculated ONCE from the original total, then we subtract returned items from the final total.

---

## 🎯 User's Example: Centrifugal Water Pump

### Original Order:
- **Item**: Centrifugal Water Pump
- **Quantity**: 2
- **Unit Price (incl. VAT)**: Rs. 45,000
- **Discount**: 11.8%

**Calculation:**
```
Original Total Before Discount = 45,000 × 2 = Rs. 90,000
Discount Amount = 90,000 × 0.118 = Rs. 10,620
Final Total Before Return = 90,000 - 10,620 = Rs. 79,380
```

### After Return (1 item returned):
```
Returned Value = 45,000 × 1 = Rs. 45,000
Final Total After Return = 79,380 - 45,000 = Rs. 34,380 ✅
```

**Display:**
```
Subtotal (Machine Prices): Rs. 18,450  (remaining 1 item, excl VAT)
Total VAT: Rs. 4,050                    (remaining 1 item VAT)
Total Before Discount: Rs. 22,500       (remaining 1 item incl VAT)
Discount (11.8%): -Rs. 10,620           (FIXED - from original Rs. 90,000)
Final Total: Rs. 34,380                 (After Returns) ✅
```

---

## Test Case 1: Single Item - Full Return
**Scenario**: Item price is Rs. 1,000, customer returns it.

### Original Order:
- Item: 1 × Rs. 1,000 = Rs. 1,000
- Discount (10%): Rs. 100
- Final Before Return: Rs. 1,000 - Rs. 100 = Rs. 900

### After Return:
- Returned Value: Rs. 1,000
- **Final After Return**: Rs. 900 - Rs. 1,000 = Rs. 0 (capped at 0)
- **Status**: "Fully Returned"

---

## Test Case 2: Two Different Items - One Returned
**Scenario**: Order has Rs. 1,000 item and Rs. 2,000 item. Return the Rs. 1,000 item.

### Original Order:
- Item A: 1 × Rs. 1,000 = Rs. 1,000
- Item B: 1 × Rs. 2,000 = Rs. 2,000
- **Original Total**: Rs. 3,000
- Discount (10%): Rs. 300
- Final Before Return: Rs. 3,000 - Rs. 300 = Rs. 2,700

### After Return (Item A):
- Returned Value: Rs. 1,000
- **Final After Return**: Rs. 2,700 - Rs. 1,000 = **Rs. 1,700** ✅

**Verification:**
- Discount stays Rs. 300 (10% of original Rs. 3,000)
- Customer pays for Rs. 2,000 item minus Rs. 300 discount = Rs. 1,700

---

## Test Case 3: Same Item Multiple Quantities - Partial Return
**Scenario**: Order has 3 items at Rs. 2,000 each. Return 1 item.

### Original Order:
- Item: 3 × Rs. 2,000 = Rs. 6,000
- Discount (10%): Rs. 600
- Final Before Return: Rs. 6,000 - Rs. 600 = Rs. 5,400

### After Return (1 item):
- Returned Value: Rs. 2,000
- **Final After Return**: Rs. 5,400 - Rs. 2,000 = **Rs. 3,400** ✅

**Verification:**
- Discount stays Rs. 600 (10% of original Rs. 6,000)
- Customer pays for 2 items (Rs. 4,000) minus Rs. 600 discount = Rs. 3,400

---

## Test Case 4: Multiple Items, Multiple Quantities - Partial Return
**Scenario**: 
- 3 items at Rs. 1,000 each = Rs. 3,000
- 4 items at Rs. 2,000 each = Rs. 8,000
- Return 1 × Rs. 1,000 item

### Original Order:
- Item A: 3 × Rs. 1,000 = Rs. 3,000
- Item B: 4 × Rs. 2,000 = Rs. 8,000
- **Original Total**: Rs. 11,000
- Discount (10%): Rs. 1,100
- Final Before Return: Rs. 11,000 - Rs. 1,100 = Rs. 9,900

### After Return:
- Returned Value: Rs. 1,000
- **Final After Return**: Rs. 9,900 - Rs. 1,000 = **Rs. 8,900** ✅

**Verification:**
- Discount stays Rs. 1,100 (10% of original Rs. 11,000)
- Customer pays for Rs. 10,000 worth minus Rs. 1,100 discount = Rs. 8,900

---

## Test Case 5: Partial Payments with Returns
**Scenario**: 
- Original Total: Rs. 10,000
- Discount (10%): Rs. 1,000
- Final: Rs. 9,000
- Paid: Rs. 5,000
- Remaining: Rs. 4,000
- Return Rs. 2,000 item

### After Return:
- Returned Value: Rs. 2,000
- **New Final Total**: Rs. 9,000 - Rs. 2,000 = **Rs. 7,000**
- **Paid**: Rs. 5,000 (unchanged)
- **New Remaining**: Rs. 7,000 - Rs. 5,000 = **Rs. 2,000** ✅
- **Payment Status**: "Partial"

### If Customer Pays Remaining:
- Total Paid: Rs. 7,000
- Remaining: Rs. 0
- **Payment Status**: "Full"
- **Order Status**: "Completed"

---

## Implementation Code

### Frontend (`calculateOrderTotals`):
```javascript
// Calculate original total
items.forEach(item => {
  originalTotal += unitPriceInclVAT * originalQuantity;
  returnedValue += unitPriceInclVAT * returnedQuantity;
  currentTotal += unitPriceInclVAT * remainingQuantity;
});

// Discount from original total (FIXED)
const discountAmount = originalTotal * discountRate;

// Final total calculation
const finalBeforeReturn = originalTotal - discountAmount + extras;
const finalAfterReturn = finalBeforeReturn - returnedValue;
```

### Backend (`PastOrder.js` pre-save):
```javascript
// Step 1: Calculate original total
const originalTotal = originalSubtotal + originalVat;

// Step 2: Fixed discount
const discountAmount = originalTotal * (discountPercentage / 100);

// Step 3: Final before returns
const finalBeforeReturn = originalTotal - discountAmount + extras;

// Step 4: Calculate returned value
let returnedValue = 0;
items.forEach(item => {
  returnedValue += item.unitPrice * item.returnedQuantity;
});

// Step 5: Final after returns
this.finalTotal = finalBeforeReturn - returnedValue;
```

---

## ✅ Summary

| Step | Formula | Example (2 × Rs. 45,000, 11.8% discount, return 1) |
|------|---------|-----------------------------------------------------|
| 1. Original Total | qty × price | 2 × 45,000 = Rs. 90,000 |
| 2. Discount | original × rate | 90,000 × 0.118 = Rs. 10,620 |
| 3. Final Before Return | original - discount | 90,000 - 10,620 = Rs. 79,380 |
| 4. Returned Value | returned qty × price | 1 × 45,000 = Rs. 45,000 |
| 5. **Final After Return** | final - returned | **79,380 - 45,000 = Rs. 34,380** ✅ |

**The discount (Rs. 10,620) NEVER changes - it's always 11.8% of the original Rs. 90,000!**


