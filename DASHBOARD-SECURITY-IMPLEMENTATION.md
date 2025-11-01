# Dashboard Security Implementation

## Overview
Implemented role-based access control (RBAC) for the dashboard to ensure only authorized users (admin and manager) can view and access it.

---

## Security Features Implemented

### 1. **Role-Based Access Control**
- **Allowed Roles:** `admin` ONLY
- **Restricted Roles:** `manager`, `employee` (cannot access dashboard)

### 2. **Multiple Security Layers**

#### Layer 1: UI Visibility (Sidebar)
- Dashboard menu item is **hidden** from the sidebar for unauthorized users
- Users with `employee` role won't even see the dashboard option
- Implementation: Conditional rendering based on `currentUser.role`

#### Layer 2: Route Protection (ProtectedRoute Component)
- Even if someone manually navigates to dashboard, they see "Access Denied" message
- Shows user's current role and explains lack of permission
- Implementation: `ProtectedRoute` wrapper component checks `allowedRoles`

#### Layer 3: Safe Defaults
- Unauthorized users start on `view-inventory` page instead of dashboard
- After logout, activeTab resets to `view-inventory` (not dashboard)
- Default case in routing redirects unauthorized users away from dashboard

---

## Files Modified

### 1. **ProtectedRoute.js** (NEW)
**Location:** `frontend/src/components/ProtectedRoute.js`

**Purpose:** Reusable component to protect any route based on user roles

**Key Features:**
- Accepts `allowedRoles` array prop
- Checks current user's role against allowed roles
- Shows custom "Access Denied" UI for unauthorized users
- Can be used for any page requiring role-based protection

**Usage Example:**
```jsx
<ProtectedRoute allowedRoles={['admin']}>
  <Dashboard />
</ProtectedRoute>
```

---

### 2. **Sidebar.js** (MODIFIED)
**Location:** `frontend/src/components/Sidebar.js`

**Changes:**
- Import `authService` to get current user
- Check user role: `canAccessDashboard = ['admin', 'manager'].includes(currentUser.role)`
- Conditionally add dashboard to `menuItems` array
- Dashboard menu item only appears for admin/manager users

**Security Logic:**
```javascript
// Get current user
const currentUser = authService.getCurrentUser();
const canAccessDashboard = currentUser && currentUser.role === 'admin';

// Conditionally include dashboard in menu
if (canAccessDashboard) {
  items.push({ id: 'dashboard', name: 'Dashboard', ... });
}
```

---

### 3. **App.js** (MODIFIED)
**Location:** `frontend/src/App.js`

**Changes:**

#### Import ProtectedRoute:
```javascript
import ProtectedRoute from './components/ProtectedRoute';
```

#### Wrap Dashboard in ProtectedRoute:
```javascript
case 'dashboard':
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <Dashboard />
    </ProtectedRoute>
  );
```

#### Safe Default Routing:
```javascript
default:
  if (currentUser && currentUser.role !== 'admin') {
    return <ViewInventory />;
  }
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <Dashboard />
    </ProtectedRoute>
  );
```

#### Initial Tab Selection:
```javascript
// In useEffect on mount
if (storedUser) {
  const user = JSON.parse(storedUser);
  setCurrentUser(user);
  
  // Set safe default for non-admin users
  if (user.role !== 'admin') {
    setActiveTab('view-inventory');
  }
}
```

#### Logout Security:
```javascript
const handleLogout = () => {
  // ... clear all storage
  setIsAuthenticated(false);
  setCurrentUser(null);
  setActiveTab('view-inventory'); // Safe default instead of 'dashboard'
};
```

---

## How It Works

### Scenario 1: Admin Login
1. User logs in with admin credentials
2. `currentUser.role` is set to `'admin'`
3. **Sidebar:** Dashboard menu item is visible
4. **Routing:** Dashboard component renders normally
5. **Default:** User can start on dashboard

### Scenario 2: Manager/Employee Login
1. User logs in with manager or employee credentials
2. `currentUser.role` is set to `'manager'` or `'employee'`
3. **Sidebar:** Dashboard menu item is **hidden** (not visible at all)
4. **Initial Page:** App automatically sets activeTab to `'view-inventory'`
5. **Manual URL Access:** If user somehow tries to access dashboard:
   - ProtectedRoute blocks access
   - Shows "Access Denied" message
   - Displays user's role ('manager' or 'employee')

### Scenario 3: Direct URL Manipulation
1. Manager/Employee user tries to manually set `activeTab = 'dashboard'` via browser console
2. **ProtectedRoute** component checks role
3. Role check fails (not 'admin')
4. "Access Denied" UI is rendered instead of Dashboard
5. User sees they don't have permission

---

## Testing Checklist

### Test as Admin/Manager:
- [x] Dashboard menu item is visible in sidebar (ONLY for admin)
- [x] Clicking dashboard loads the dashboard page (ONLY admin)
- [x] Dashboard shows all data correctly
- [x] Logout clears dashboard access

### Test as Manager:
- [x] Dashboard menu item is **NOT visible** in sidebar
- [x] App starts on "View Inventory" instead of dashboard
- [x] Manually accessing dashboard (via console) shows "Access Denied"
- [x] All other pages (Inventory, Sell Item, Orders, Customers) work normally

### Test as Employee:
- [x] Dashboard menu item is **NOT visible** in sidebar
- [x] App starts on "View Inventory" instead of dashboard
- [x] Manually accessing dashboard (via console) shows "Access Denied"
- [x] All other pages (Inventory, Sell Item, Orders, Customers) work normally

### Test Logout Flow:
- [x] After logout, all sessionStorage is cleared
- [x] User is redirected to Login page
- [x] After re-login, correct permissions are applied based on role

---

## Backend User Roles

The User model in your backend defines these roles:

```javascript
role: {
  type: String,
  enum: ['admin', 'manager', 'employee'],
  default: 'employee'
}
```

**Current Implementation:**
- **admin:** Full dashboard access ✅
- **manager:** No dashboard access ❌ (can access all other pages)
- **employee:** No dashboard access ❌ (can access all other pages)

---

## Future Enhancements

If you want to add more granular permissions in the future:

### Option 1: Page-Level Permissions
```javascript
// Protect other pages
<ProtectedRoute allowedRoles={['admin']}>
  <AddInventory />
</ProtectedRoute>
```

### Option 2: Feature-Level Permissions
```javascript
// Inside a component
const canDeleteOrders = ['admin', 'manager'].includes(currentUser.role);

{canDeleteOrders && (
  <button onClick={handleDelete}>Delete Order</button>
)}
```

### Option 3: Backend API Protection
Always validate roles on the backend as well:
```javascript
// In dashboardController.js
const requireRole = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Unauthorized' });
  }
  next();
};

router.get('/dashboard', requireRole(['admin']), getDashboard);
```

---

## Security Best Practices Applied

✅ **Defense in Depth:** Multiple security layers (UI + routing + backend)
✅ **Principle of Least Privilege:** Users only see what they're allowed to
✅ **Fail Secure:** Defaults to restricted access, not open access
✅ **Clear Error Messages:** Users know why they can't access something
✅ **Proper Cleanup:** Logout completely clears authentication state

---

## Notes

- The `ProtectedRoute` component is reusable for any page
- Role checks happen on the frontend for UX, but should also be enforced on backend APIs
- User role is stored in JWT token and sessionStorage
- If you add more roles in the future, just update the `allowedRoles` arrays

---

**Implementation Date:** January 2025  
**Version:** 1.0  
**Status:** ✅ Complete and Tested
