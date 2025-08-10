# ClickOpticx - ISP Management System

A comprehensive Internet Service Provider (ISP) management system built with Node.js, Express.js, and MySQL. This application provides a complete solution for managing ISP operations including user management, billing, equipment tracking, and customer support.

## 🚀 Railway Free Deployment Guide

### 📋 Prerequisites
- ✅ GitHub account (free)
- ✅ Railway account (free - railway.app) 
- ✅ Cloudinary account (free - cloudinary.com)
- ✅ Your project pushed to GitHub

### 🔧 Step 1: Prepare Project for Deployment

1. **Update package.json start script:**
```json
"start": "node index.js"  // Change from nodemon to node
```

2. **Update port in index.js:**
```javascript
const port = process.env.PORT || 3000;  // Add PORT env support
```

3. **Commit to GitHub:**
```bash
git add .
git commit -m "Prepare for Railway deployment"
git push origin main
```

### 🚀 Step 2: Deploy on Railway

1. **Go to [railway.app](https://railway.app)**
2. **Sign up** with GitHub
3. **Click "Start a New Project"**
4. **Select "Deploy from GitHub repo"** 
5. **Choose your ClickOpticx repository**
6. **Railway auto-detects** Node.js project

### 🗄️ Step 3: Add MySQL Database

1. **In Railway dashboard:**
   - Click **"+ New Service"**
   - Select **"Database"** → **"MySQL"**
2. **Copy database credentials** from Variables tab

### 🔑 Step 4: Set Environment Variables

In your **Node.js service** → **Variables** tab, add:

**Database Variables:**
```env
HOST=your-railway-mysql-host
USER=root
PASSWORD=your-railway-mysql-password
DATABASE=railway
Port=3306
```

**Cloudinary Variables:**
```env
CLOUDINARY_CLOUD_NAME=dzzuvb4fg
CLOUDINARY_API_KEY=946697296522253
CLOUDINARY_API_SECRET=AHcpyhnG_xRgTPTp_LrsSgVwWI8
```

**Payment & Email Variables:**
```env
PAYFAST_MERCHANT_ID=26995
PAYFAST_SECURED_KEY=fts432DwdbTzWo0q714sOTgb
PAYFAST_API_URL=https://ipg1.apps.net.pk/Ecommerce/api/Transaction
GMAIL_USER=clickopticx@gmail.com
GMAIL_PASS=qjnm esst kuxp kabq
```

### ✅ Step 5: Complete Deployment

1. **Railway auto-deploys** after adding variables
2. **Monitor build logs** in Deployments tab
3. **Get your app URL** from Railway dashboard
4. **Import database tables** via MySQL client

### 🧪 Step 6: Test Your Deployed App

- ✅ Homepage loads
- ✅ User registration/login works
- ✅ Image uploads go to Cloudinary
- ✅ Database operations work
- ✅ Static assets load properly

### 💡 Railway Free Tier Benefits

- ✅ $5 monthly credit (resets each month)
- ✅ Up to 3 projects
- ✅ Custom domains
- ✅ Automatic HTTPS
- ✅ Auto-deployments from GitHub

**🎉 Your app is now live on Railway for FREE!**

---

## 🚀 Features

### Core Features
- **User Authentication & Authorization** - Secure login/registration with JWT tokens
- **Admin Dashboard** - Comprehensive admin panel for system management
- **User Management** - Create, manage, and track user accounts
- **Package Management** - Define and manage internet packages
- **Billing System** - Payment tracking and invoice management
- **Equipment Management** - Track and assign network equipment
- **Support System** - Customer complaint and request management

### Islamic Features
- **Prayer Times** - Islamic prayer time tracking
- **Quran Reader** - Built-in Quran reading interface
- **Tasbeeh Counter** - Digital prayer counter
- **Mosque Integration** - Prayer-related functionality

### Additional Features
- **Weather App** - Weather information display
- **File Upload** - Profile and document management
- **Team Management** - Staff and team organization
- **Promotional System** - Marketing and promotions management
- **Customization Tools** - Branding and UI customization

## 📁 Project Structure

```
ClickOpticx/
├── index.js                    # Main application entry point
├── package.json                # Dependencies and scripts
├── public/                     # Static assets
│   ├── css/                   # Stylesheets
│   ├── js/                    # Client-side JavaScript
│   ├── images/                # Image assets
│   └── uploads/               # User uploaded files
├── src/
│   ├── config/
│   │   └── db.js              # Database configuration
│   ├── controllers/           # Business logic controllers
│   │   ├── authController.js  # Authentication logic
│   │   ├── packageController.js
│   │   ├── paymentshistroyController.js
│   │   └── [30+ other controllers]
│   ├── models/                # Database models
│   │   ├── users.js           # User model/schema
│   │   ├── packages.js        # Package model
│   │   ├── payments.js        # Payment model
│   │   └── [other models]
│   ├── routes/                # API route definitions
│   │   ├── authRoutes.js      # Authentication routes
│   │   ├── packageRoutes.js   # Package management
│   │   └── [30+ route files]
│   └── middlewares/           # Custom middleware
│       ├── authMiddleware.js  # Authentication middleware
│       └── uploadMiddleware.js # File upload handling
└── view/                      # EJS templates
    ├── login/                 # Authentication pages
    ├── adminIndex/            # Admin dashboard
    ├── package/               # Package management UI
    ├── Billing-Payments/      # Billing interface
    └── [20+ view directories]
```

## 🛠️ Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MySQL2** - Database driver
- **EJS** - Template engine
- **JWT** - Authentication tokens
- **bcrypt** - Password hashing
- **Multer** - File upload handling
- **Nodemailer** - Email functionality

### Frontend
- **Bootstrap** - CSS framework
- **jQuery** - JavaScript library
- **DataTables** - Table enhancement
- **Chart.js** - Data visualization
- **Font Awesome** - Icons
- **Material Design Icons** - Additional icons

### Development Tools
- **Nodemon** - Development server
- **dotenv** - Environment variables
- **Body-parser** - Request parsing
- **Express-session** - Session management

## 📋 Prerequisites

- Node.js (v14 or higher)
- MySQL (v8.0 or higher)
- npm or yarn package manager

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/clickopticx.git
   cd clickopticx
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   HOST=localhost
   USER=your_mysql_username
   PASSWORD=your_mysql_password
   DATABASE=clickopticx_db
   ```

4. **Database Setup**
   - Create a MySQL database named `clickopticx_db`
   - The application will automatically create necessary tables on first run

5. **Start the application**
   ```bash
   npm start
   ```

6. **Access the application**
   Open your browser and navigate to `http://localhost:3000`

## 📚 API Endpoints

### Authentication
- `POST /login` - User login
- `POST /register` - User registration
- `POST /logout` - User logout
- `GET /verify-otp` - OTP verification

### User Management
- `GET /admin/users` - List all users
- `POST /admin/users/add` - Add new user
- `PUT /admin/users/:id` - Update user
- `DELETE /admin/users/:id` - Delete user

### Package Management
- `GET /packages` - List packages
- `POST /packages/add` - Create package
- `PUT /packages/:id` - Update package
- `DELETE /packages/:id` - Delete package

### Billing & Payments
- `GET /payments/history` - Payment history
- `GET /payments/pending` - Pending payments
- `POST /payments/process` - Process payment

### Equipment Management
- `GET /equipment` - List equipment
- `POST /equipment/add` - Add equipment
- `PUT /equipment/:id/assign` - Assign equipment
- `GET /equipment/status` - Equipment status

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    Username VARCHAR(255) NOT NULL,
    Email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    Number INT(11),
    plan VARCHAR(255) NOT NULL,
    role VARCHAR(11) DEFAULT 'user',
    remaining_gb INT(11) NOT NULL,
    invoice VARCHAR(255) DEFAULT 'Unpaid',
    user_img VARCHAR(255) NOT NULL,
    transaction_id VARCHAR(255) NOT NULL,
    amount VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Packages Table
```sql
CREATE TABLE packages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    Package VARCHAR(255) NOT NULL,
    Price INT(11) NOT NULL,
    Speed VARCHAR(255) NOT NULL,
    Data_Used VARCHAR(255) NOT NULL,
    Offer_Valid VARCHAR(255) NOT NULL,
    limits VARCHAR(255) NOT NULL,
    user_id INT NOT NULL,
    discountPercentage DECIMAL(10,0) NOT NULL
);
```

## 🔐 Security Features

- **Password Hashing** - bcrypt for secure password storage
- **JWT Authentication** - Secure token-based authentication
- **Session Management** - Express-session for user sessions
- **Input Validation** - Server-side validation for all inputs
- **File Upload Security** - Multer with file type restrictions
- **SQL Injection Prevention** - Parameterized queries

## 👥 User Roles

### Admin
- Full system access
- User management
- Package configuration
- Billing oversight
- Equipment management
- System customization

### User
- Personal dashboard
- Package viewing
- Payment history
- Complaint submission
- Profile management

## 🎨 Customization Features

- **Branding** - Custom logos and brand colors
- **Header/Footer** - Customizable navigation
- **Dashboard Layout** - Configurable user interface
- **Promotional Banners** - Marketing content management

## 📱 Responsive Design

The application is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile devices
- All modern web browsers

## 🧪 Development

### Scripts
- `npm start` - Start the production server
- `npm run dev` - Start development server with nodemon

### File Structure Guidelines
- Controllers: Business logic and request handling
- Routes: API endpoint definitions
- Models: Database schema and queries
- Views: EJS templates for UI
- Public: Static assets (CSS, JS, images)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License - see the LICENSE file for details.

## 📞 Support

For support and questions:
- Email: support@clicktaketec.com
- Create an issue in the GitHub repository

## 🔄 Recent Updates

- Enhanced payment management system
- Improved admin user complaint handling
- Updated payment history tracking
- Enhanced pending payments functionality
- Improved user interface responsiveness

## 🚦 Status

This project is actively maintained and regularly updated with new features and security improvements.

---

**Note**: This is an ISP management system designed for small to medium-sized Internet Service Providers. It includes specialized features for Islamic communities and comprehensive business management tools.
