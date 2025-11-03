# 🔐 User Credentials for P.E. Industrial Automation

## Default Login Credentials

### 👑 Admin Accounts (Full Dashboard Access)

| Username | Password    | Full Name            | Role  | Dashboard Access |
| -------- | ----------- | -------------------- | ----- | ---------------- |
| `admin`  | `admin123`  | System Administrator | admin | ✅ Yes           |
| `dulara` | `dulara123` | Dulara Mihiran       | admin | ✅ Yes           |
| `pasan`  | `pasan123`  | Pasan Enterprises    | admin | ✅ Yes           |

### Employee Account (No Dashboard Access)

| Username   | Password      | Full Name      | Role     | Dashboard Access |
| ---------- | ------------- | -------------- | -------- | ---------------- |
| `employee` | `employee123` | Staff Employee | employee | ❌ No            |

---

## 🔄 How to Create/Seed Users

### Method 1: Run the Seed Script

```bash
cd backend
npm run seed-users
```

This will:

- Create all the default users listed above
- Skip users that already exist (won't create duplicates)
- Show a summary of created/skipped users

### Method 2: Create Manually via API

**POST** `http://localhost:5000/api/users`

**Body:**

```json
{
  "username": "newuser",
  "password": "password123",
  "fullName": "New User Name",
  "role": "employee",
  "isActive": true
}
```

**Available Roles:**

- `admin` - Full access (Dashboard + All Pages) - **ONLY role with Dashboard access**
- `employee` - Limited access (All Pages EXCEPT Dashboard)

---

## 📊 Access Control Matrix

| Page/Feature   | Admin | Employee |
| -------------- | ----- | -------- |
| Dashboard      | ✅    | ❌       |
| View Inventory | ✅    | ✅       |
| Sell Item      | ✅    | ✅       |
| Past Orders    | ✅    | ✅       |
| Add Inventory  | ✅    | ✅       |
| Customers      | ✅    | ✅       |

---

## 🧪 Testing Different User Roles

### Test Admin Access:

1. Login with `admin` / `admin123`
2. ✅ Dashboard menu item should be **visible**
3. ✅ Can access dashboard page
4. ✅ All features available

### Test Employee Access:

1. Login with `employee` / `employee123`
2. ❌ Dashboard menu item should be **hidden**
3. ❌ Cannot access dashboard (shows "Access Denied" if tried)
4. ✅ Can access all other pages

---

## 🔒 Security Notes

1. **Password Hashing**: All passwords are hashed with bcrypt (cost factor: 10)
2. **JWT Tokens**: Stored in sessionStorage, expire in 24 hours
3. **Role Validation**: Both frontend (UI) and backend (API) check roles
4. **Active Status**: Users can be soft-deleted by setting `isActive: false`

---

## 🛠️ Password Management

### Change Password (Manual - MongoDB)

Since there's no password change UI yet, use MongoDB directly:

```javascript
// In MongoDB Shell or Compass
const bcrypt = require("bcrypt");
const newPassword = await bcrypt.hash("newpassword123", 12);

db.users.updateOne({ username: "admin" }, { $set: { password: newPassword } });
```

### Reset All Passwords

Run the seed script again - it will skip existing users but you can modify the script to force update.

---

## 📝 Creating Additional Users

### Via Seed Script:

Edit `backend/seedUsers.js` and add more users:

```javascript
{
  username: 'yourname',
  password: 'yourpassword',
  fullName: 'Your Full Name',
  role: 'admin',  // or 'employee'
  isActive: true
}
```

Then run: `npm run seed-users`

### Via API (Postman/Thunder Client):

```bash
POST http://localhost:5000/api/users
Content-Type: application/json

{
  "username": "yourname",
  "password": "yourpassword",
  "fullName": "Your Full Name",
  "role": "admin",
  "isActive": true
}
```

---

## ⚠️ Important Notes

1. **Default Passwords**: Change these default passwords in production!
2. **Username Uniqueness**: Usernames must be unique (3-50 characters)
3. **Password Length**: Minimum 6 characters
4. **Role Default**: If no role specified, defaults to 'employee'
5. **Active Status**: Users with `isActive: false` cannot login

---

## 🔍 Checking Existing Users

### View All Users in Database:

```bash
# In backend directory
node -e "
const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const users = await User.find({});
  console.table(users.map(u => ({
    username: u.username,
    fullName: u.fullName,
    role: u.role,
    isActive: u.isActive
  })));
  process.exit(0);
});
"
```

### Via API:

```bash
GET http://localhost:5000/api/users
Authorization: Bearer YOUR_JWT_TOKEN
```

---

**Last Updated:** October 30, 2025  
**Version:** 1.0
