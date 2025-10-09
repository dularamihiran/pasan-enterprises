# Total Annual Revenue Feature

## Overview
Replaced the "Total Orders" dashboard card with "Total Annual Revenue" to display the total revenue generated in the current year.

## Implementation Details

### Backend Changes

#### 1. Controller: `backend/controllers/dashboardController.js`
- **New Function**: `getAnnualRevenue()`
- **Route**: `GET /api/dashboard/annual-revenue`
- **Logic**:
  - Fetches all orders where `createdAt` falls within the current year
  - Filters orders from January 1st to December 31st of current year
  - Calculates total revenue by summing `finalTotal` field from all orders
  - Returns: revenue amount, order count, year, and description

```javascript
const getAnnualRevenue = async (req, res) => {
  // Get current year dates
  const currentYear = today.getFullYear();
  const yearStart = new Date(currentYear, 0, 1);
  const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59);
  
  // Fetch orders from current year
  const yearOrders = await PastOrder.find({
    createdAt: { $gte: yearStart, $lte: yearEnd }
  });
  
  // Sum up finalTotal from all orders
  const annualRevenue = yearOrders.reduce((sum, order) => {
    return sum + (order.finalTotal || order.total || 0);
  }, 0);
}
```

#### 2. Routes: `backend/routes/dashboard.js`
- Added route: `router.get('/annual-revenue', getAnnualRevenue);`
- Exported `getAnnualRevenue` from controller

### Frontend Changes

#### 3. Dashboard Component: `frontend/src/pages/Dashboard.js`

**State Management**:
```javascript
const [annualRevenue, setAnnualRevenue] = useState(null);
```

**Data Fetching**:
```javascript
// Fetch Annual Revenue in useEffect
const response = await api.get('/dashboard/annual-revenue');
if (response.data.success) {
  setAnnualRevenue(response.data.data);
}
```

**UI Card**:
- **Title**: Total Annual Revenue
- **Value**: Formatted with `formatCurrencyNoDecimals()` (no decimals)
- **Subtitle**: "This year (2025)"
- **Icon**: ShoppingCartIcon (blue gradient)

## API Response Format

```json
{
  "success": true,
  "data": {
    "revenue": 1250000,
    "orderCount": 45,
    "year": 2025,
    "description": "Total revenue for 2025"
  }
}
```

## Display Format

**Before**: 
- Total Orders: LKR 5,000,000 (All time revenue)

**After**:
- Total Annual Revenue: LKR 1,250,000 (This year - 2025)

## Features

✅ Automatically filters orders by current year
✅ Calculates revenue using `finalTotal` (includes VAT, discounts, extras)
✅ Displays without decimal places to save space
✅ Shows current year dynamically
✅ Includes console logging for debugging
✅ Graceful error handling with partial error display

## Testing

1. **Backend**: Test the endpoint
   ```
   GET http://localhost:5000/api/dashboard/annual-revenue
   ```

2. **Frontend**: Check the dashboard
   - Navigate to Dashboard page
   - Verify "Total Annual Revenue" card displays
   - Confirm it shows current year's revenue only
   - Check browser console for API logs

## Calculation Logic

1. Get current year (e.g., 2025)
2. Define date range: Jan 1, 2025 00:00:00 to Dec 31, 2025 23:59:59
3. Query MongoDB for orders within this range
4. Sum up `finalTotal` from each order
5. Return total with order count

## Notes

- **Year Boundary**: Automatically updates each new year
- **Fallback**: Uses `order.total` if `finalTotal` is not available
- **Performance**: Uses MongoDB date indexing for fast queries
- **Logging**: Includes detailed console logs for debugging

## Future Enhancements

- Add year selector dropdown to view previous years
- Add comparison with last year's revenue
- Add month-by-month breakdown for current year
- Add growth percentage indicator

---

**Created**: October 10, 2025  
**Feature**: Total Annual Revenue Dashboard Card
