# ClickOpticx - Complete ISP Management System

A comprehensive Internet Service Provider (ISP) management platform built with Node.js, Express.js, and MySQL. This system provides end-to-end management capabilities for ISPs including customer management, billing operations, network equipment tracking, and comprehensive customer support.

## 🌟 Key Features

### 🔐 User Authentication & Management
- Secure user registration with email verification
- Role-based access control system
- Password recovery with OTP verification
- Profile management with image uploads (Cloudinary integration)

### 💰 Billing & Payment System
- Flexible internet package management
- Payment tracking and history
- Automated billing notifications
- Discount and promotion management

### 🛠️ Equipment Management
- Network equipment inventory tracking
- Customer equipment assignment
- Equipment recovery management
- Real-time status monitoring

### 🎫 Customer Support System
- Complaint management and tracking
- Team-based ticket assignment
- Task management with completion tracking
- Automated notification system

### 🎨 Customization & Branding
- Homepage slider management
- Custom branding and logo uploads
- Header/footer customization
- User dashboard personalization

### 🕌 Islamic Features Integration
- Prayer times with location support
- Integrated Quran reader
- Digital Tasbeeh counter
- Weather information display

## 📋 System Requirements

- **Node.js**: v14.0 or higher
- **MySQL**: v8.0 or higher
- **RAM**: Minimum 512MB
- **Storage**: 1GB+ available space
- **Network**: Internet connection for external API services

## 🚀 Installation Guide

### 1. Clone Repository
```bash
git clone https://github.com/your-username/clickopticx.git
cd clickopticx
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Database Setup
Create MySQL database and configure connection in `src/config/db.js`:
```javascript
const mysql = require('mysql2');
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'your_username',
    password: 'your_password',
    database: 'clickopticx_db'
});
```

### 4. Environment Configuration
Create `.env` file:
```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=clickopticx_db

# Cloudinary Settings
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email Configuration
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

### 5. Start Application
```bash
npm start
```

Access your application at `http://localhost:3000`

## 👥 User Roles & Permissions

### 🔵 Regular User (`user`)
**Standard Customer Account**
- ✅ Register and verify email account
- ✅ View available internet packages and pricing
- ✅ Submit payment requests for services
- ✅ File complaints and support tickets
- ✅ Access Islamic features (Prayer, Quran, Tasbeeh)
- ✅ View weather information
- ✅ Track personal service history
- ✅ Update personal profile and contact information
- ✅ View billing history and payment status

### 🟡 Team Member (`Team`)
**Customer Support Staff**
- ✅ Access dedicated team dashboard
- ✅ View and manage assigned customer complaints
- ✅ Update support ticket status and resolution
- ✅ Track task completion and performance metrics
- ✅ Access customer information for support purposes
- ✅ Handle equipment-related customer inquiries
- ✅ Escalate complex issues to administrators
- ✅ Generate support reports and statistics

### 🔴 Administrator (`admin`)

## 🛡️ COMPLETE ADMIN AUTHORITIES

**When you create an Administrator account, you gain TOTAL SYSTEM CONTROL with unrestricted access to ALL platform functions:**

---

### 👤 **FULL USER MANAGEMENT CONTROL**
**Complete authority over all user accounts:**
- ✅ **View ALL users** - Access complete user database with advanced filtering
  - Filter by: Active, Expired, Verified, Non-verified, Payment status
  - Search by: Username, Email, Phone number, Registration date
- ✅ **Create unlimited user accounts** - Generate accounts with ANY role
  - Create regular users, team members, or other administrators
  - Set custom usernames, emails, passwords, and roles
- ✅ **Modify ANY user data**:
  - Update usernames, email addresses, phone numbers
  - Change user roles (user ↔ Team ↔ admin)
  - Modify service plans and package assignments
  - Set/update account expiry dates
  - Adjust remaining data allowances
- ✅ **Delete users permanently** - Remove accounts and all associated data
- ✅ **Force email verification** - Manually verify any user account
- ✅ **Reset user passwords** - Generate new passwords for any account
- ✅ **Resend verification emails** - Trigger email verification process
- ✅ **Track user activity** - Monitor login history and system usage
- ✅ **Manage user profile images** - Upload, update, or delete profile photos
- ✅ **Control user access** - Enable/disable accounts instantly

---

### 👥 **COMPLETE TEAM MANAGEMENT AUTHORITY**
**Full control over staff and support team:**
- ✅ **View all team members** - Access complete staff directory
- ✅ **Hire new team members** - Create team accounts with department assignments
- ✅ **Update team information**:
  - Modify roles and permissions
  - Change department assignments
  - Update contact information and profiles
- ✅ **Remove team members** - Delete staff accounts from system
- ✅ **Verify team accounts** - Approve new team member registrations
- ✅ **Assign support roles** - Define specific responsibilities and access levels
- ✅ **Monitor performance** - Track team member activity and productivity
- ✅ **Manage team hierarchy** - Organize reporting structure and supervision

---

### 📦 **COMPLETE PACKAGE & SERVICE CONTROL**
**Total authority over service offerings:**
- ✅ **Create unlimited packages**:
  - Set custom pricing for any service level
  - Define internet speeds (upload/download)
  - Set data limits and fair usage policies
  - Configure package validity periods
- ✅ **Modify existing packages**:
  - Update pricing instantly across the system
  - Change speed allocations and data limits
  - Modify package descriptions and features
- ✅ **Delete packages** - Remove services entirely from system
- ✅ **Apply discounts**:
  - Create percentage-based discounts
  - Set promotional pricing for specific periods
  - Generate discount codes for marketing campaigns
- ✅ **Monitor package performance**:
  - Track package popularity and usage statistics
  - Analyze revenue per package type
  - View customer satisfaction by service level
- ✅ **Create specialized packages** - Design custom services for specific customer segments

---

### 💳 **COMPLETE FINANCIAL & BILLING AUTHORITY**
**Unrestricted access to all financial operations:**
- ✅ **View ALL payment data**:
  - Complete transaction history across entire system
  - Individual customer payment records
  - Revenue tracking and financial analytics
- ✅ **Manage payment requests**:
  - Approve or reject pending payments
  - Process manual payment entries
  - Handle payment disputes and adjustments
- ✅ **Control payment statuses**:
  - Mark payments as Paid/Unpaid/Failed
  - Process refunds and chargebacks
  - Update transaction records manually
- ✅ **Generate financial reports**:
  - Monthly, quarterly, and annual revenue reports
  - Customer payment behavior analysis
  - Overdue accounts and collection reports
- ✅ **Manage billing cycles**:
  - Track subscription expiry dates
  - Send automated expiry warnings (7-day alerts)
  - Process renewals and plan changes
- ✅ **Export financial data** - Generate CSV/Excel reports for accounting
- ✅ **Configure payment methods** - Set up and modify payment gateways

---

### 🛠️ **COMPLETE EQUIPMENT & INVENTORY CONTROL**
**Full authority over network infrastructure:**
- ✅ **Manage equipment inventory**:
  - Add new network equipment (routers, modems, switches)
  - Track equipment serial numbers and specifications
  - Monitor equipment condition and age
- ✅ **Equipment assignment control**:
  - Assign equipment to specific customers
  - Track equipment location and installation status
  - Manage equipment transfers between customers
- ✅ **Equipment recovery operations**:
  - Process equipment returns from customers
  - Track recovered equipment condition
  - Manage refurbishment and redeployment
- ✅ **Team equipment tracking**:
  - Monitor which team member has which equipment
  - Track equipment checkout/check-in
  - Manage mobile equipment for field technicians
- ✅ **Maintenance scheduling**:
  - Plan equipment maintenance and upgrades
  - Track repair history and costs
  - Monitor equipment warranty status
- ✅ **Generate equipment reports**:
  - Utilization reports by equipment type
  - Maintenance cost analysis
  - Equipment lifecycle and replacement planning

---

### 🎫 **COMPLETE CUSTOMER SUPPORT AUTHORITY**
**Total control over customer service operations:**
- ✅ **View ALL customer complaints**:
  - Access complete complaint database
  - Filter by status, priority, date, team member
  - Search complaints by customer or issue type
- ✅ **Complaint assignment control**:
  - Assign complaints to specific team members
  - Reassign tickets based on expertise or workload
  - Set complaint priority levels (Low/Medium/High/Critical)
- ✅ **Manage complaint resolution**:
  - Update complaint status throughout lifecycle
  - Add internal notes and customer communications
  - Close resolved complaints with resolution details
- ✅ **Track support metrics**:
  - Monitor average response times
  - Measure complaint resolution rates
  - Analyze customer satisfaction scores
- ✅ **Escalation management**:
  - Create escalation workflows for complex issues
  - Set automatic escalation triggers
  - Manage VIP customer complaint handling
- ✅ **Generate support reports**:
  - Team performance analytics
  - Complaint trend analysis
  - Customer satisfaction reports

---

### 🎨 **COMPLETE CONTENT & BRANDING CONTROL**
**Full authority over platform appearance and content:**
- ✅ **Homepage management**:
  - Upload and manage slider images
  - Update promotional banners and content
  - Control featured package displays
- ✅ **Brand identity control**:
  - Upload and change company logos
  - Modify brand colors and themes
  - Update company information and contact details
- ✅ **Navigation customization**:
  - Modify header menu items and links
  - Customize footer content and links
  - Control sidebar navigation elements
- ✅ **User interface customization**:
  - Modify user dashboard layouts
  - Customize admin panel appearance
  - Update form layouts and styling
- ✅ **Content management**:
  - Create and manage promotional content
  - Update terms of service and privacy policies
  - Manage help documentation and FAQs
- ✅ **Media asset control**:
  - Upload and organize image libraries
  - Manage document templates
  - Control downloadable resources for customers

---

### 📊 **COMPLETE SYSTEM ADMINISTRATION**
**Unrestricted access to all system functions:**
- ✅ **Real-time dashboard access**:
  - Monitor live system metrics and performance
  - View user activity and system load
  - Track real-time revenue and transactions
- ✅ **Comprehensive analytics**:
  - User registration and activity trends
  - Revenue analytics and financial KPIs
  - System performance and uptime monitoring
- ✅ **Automated notification control**:
  - Receive instant notifications for:
    - New user registrations and verifications
    - Payment requests and transaction alerts
    - New customer complaints and critical issues
    - System errors, security alerts, and warnings
    - Subscription expiry warnings and renewals
    - Equipment failures and maintenance alerts
- ✅ **Notification management**:
  - Customize notification preferences and timing
  - Set up email and SMS notification channels
  - Create custom notification rules and triggers
- ✅ **Data export capabilities**:
  - Export user data, payment records, and analytics
  - Generate custom reports in multiple formats
  - Schedule automated report generation and delivery
- ✅ **System configuration**:
  - Modify core system settings and parameters
  - Configure security settings and access controls
  - Manage API integrations and third-party services

---

### 🔐 **COMPLETE DATABASE & SYSTEM ACCESS**
**Full backend system control:**
- ✅ **Direct database access**:
  - Execute custom SQL queries on all tables
  - View, modify, and delete any database records
  - Access user passwords (hashed), payment data, and all sensitive information
- ✅ **System data management**:
  - Backup and restore complete system data
  - Manage database optimization and maintenance
  - Monitor database performance and storage usage
- ✅ **Log file access**:
  - View application logs and error reports
  - Monitor user activity logs and system events
  - Access security logs and audit trails
- ✅ **Server configuration**:
  - Modify server settings and configurations
  - Manage SSL certificates and security settings
  - Control system resources and performance tuning
- ✅ **Security management**:
  - Monitor failed login attempts and security threats
  - Manage IP blocking and access restrictions
  - Configure firewall rules and security policies

---

### 📈 **COMPLETE BUSINESS INTELLIGENCE**
**Advanced analytics and business insights:**
- ✅ **Customer analytics**:
  - Monitor total users, active subscribers, and growth metrics
  - Track customer acquisition costs and lifetime value
  - Analyze customer behavior and usage patterns
- ✅ **Financial intelligence**:
  - Track payment trends, revenue patterns, and financial KPIs
  - Monitor profit margins and cost analysis
  - Forecast revenue and growth projections
- ✅ **Operational analytics**:
  - Analyze complaint patterns and resolution efficiency
  - Monitor team productivity and performance metrics
  - Track service quality and customer satisfaction
- ✅ **Equipment intelligence**:
  - View equipment utilization rates and ROI analysis
  - Monitor maintenance costs and equipment lifecycle
  - Plan equipment investments and replacements
- ✅ **Comprehensive reporting**:
  - Generate monthly, quarterly, and yearly business reports
  - Create custom dashboards for specific business needs
  - Monitor system performance, uptime, and technical metrics
- ✅ **Predictive analytics**:
  - Track customer lifecycle, retention, and churn analytics
  - Identify at-risk customers and revenue opportunities
  - Analyze market trends and competitive positioning

---

## ⚠️ CRITICAL SECURITY NOTICE

**There is NO "Super Admin" role in this system.** The `admin` role represents the **ABSOLUTE HIGHEST LEVEL OF ACCESS** with **COMPLETE, UNRESTRICTED CONTROL** over:

- 🔴 **All user accounts and personal data**
- 🔴 **All financial transactions and payment information** 
- 🔴 **All business operations and customer communications**
- 🔴 **All system configurations and security settings**
- 🔴 **Complete database with ALL sensitive information**

**Admin accounts should be created with extreme caution and only for trusted personnel.**

---

## 🛠️ Technology Stack

### Backend Technologies
- **Node.js** - Server runtime environment
- **Express.js** - Web application framework
- **MySQL2** - Database management system
- **bcrypt** - Password hashing and security
- **JWT** - JSON Web Token authentication
- **Multer** - File upload handling
- **Nodemailer** - Email service integration

### Frontend Technologies
- **EJS** - Server-side templating engine
- **Bootstrap 4** - Responsive CSS framework
- **jQuery** - JavaScript library
- **DataTables** - Advanced table functionality
- **Chart.js** - Data visualization and analytics
- **Font Awesome** - Icon library

### Third-Party Integrations
- **Cloudinary** - Image storage and optimization
- **Google APIs** - Maps and location services
- **Weather APIs** - Real-time weather data
- **Prayer Time APIs** - Islamic prayer calculations

## 📁 Project Architecture

```
ClickOpticx/
├── index.js                     # Application entry point
├── package.json                 # Dependencies and configuration
├── src/
│   ├── config/
│   │   ├── db.js               # Database connection configuration
│   │   └── cloudinary.js       # Cloudinary setup
│   ├── controllers/            # Business logic handlers
│   │   ├── authController.js   # Authentication logic
│   │   ├── AdminUserController.js # User management
│   │   ├── packageController.js # Package management
│   │   ├── ComplaintController.js # Support system
│   │   └── [35+ other controllers]
│   ├── models/                 # Database models
│   │   ├── users.js           # User data model
│   │   ├── packages.js        # Package data model
│   │   ├── payments.js        # Payment data model
│   │   └── [other models]
│   ├── routes/                # API route definitions
│   │   ├── authRoutes.js      # Authentication routes
│   │   ├── AdminUserRoutes.js # Admin user routes
│   │   └── [40+ route files]
│   ├── middlewares/           # Custom middleware
│   │   ├── authMiddleware.js  # Authentication middleware
│   │   └── uploadMiddleware.js # File upload middleware
│   └── services/              # Business services
│       └── notificationService.js # Email notifications
├── view/                      # EJS template files
│   ├── login/                 # Authentication pages
│   ├── adminIndex/            # Admin dashboard
│   ├── AddUsers/              # User management UI
│   ├── Billing-Payments/      # Payment interfaces
│   └── [25+ view directories]
└── public/                    # Static assets
    ├── css/                   # Stylesheets
    ├── js/                    # Client-side JavaScript
    ├── images/                # Image assets
    └── vendors/               # Third-party libraries
```

## 🔒 Security Features

### Authentication Security
- **bcrypt password hashing** with salt rounds
- **JWT token-based authentication**
- **Session management** with secure cookies
- **Email verification** required for account activation
- **OTP-based password recovery**

### Data Protection
- **Input validation** and sanitization
- **SQL injection prevention** with parameterized queries
- **XSS protection** headers
- **File upload validation** with type restrictions
- **Secure file storage** via Cloudinary

### Access Control
- **Role-based permissions** (user/Team/admin)
- **Route-level authentication** middleware
- **Session timeout** management
- **Failed login attempt** monitoring

## 📧 Email Notification System

Automated emails are sent for:
- **Account verification** upon registration
- **Password reset** requests with OTP
- **Payment confirmations** and receipts
- **Service expiry warnings** (7 days advance)
- **Complaint updates** and resolutions
- **System alerts** and security notifications

## 🌍 API Documentation

### Authentication Endpoints
```
POST /login          - User authentication
POST /signup         - User registration  
POST /logout         - User session termination
POST /verify-otp     - Email/SMS verification
POST /forgot-password - Password recovery
```

### User Management (Admin Only)
```
GET /AdminUser       - List all users with filtering
POST /AddUser        - Create new user account
PUT /users/:id       - Update user information
DELETE /users/:id    - Delete user account
GET /ActiveUser      - View active users only
GET /ExpiredUser     - View expired users only
```

### Package Management
```
GET /package         - View available packages
POST /package        - Create new package (Admin)
PUT /package/:id     - Update package (Admin)
DELETE /package/:id  - Delete package (Admin)
```

### Payment System
```
GET /paymentshistory - Payment history
GET /pandingpayments - Pending payments
POST /payment        - Process payment
PUT /payment/:id     - Update payment status
```

## 🚀 Deployment Guide

### Production Setup
1. **Server Requirements**:
   - Ubuntu 18.04+ or CentOS 7+
   - Node.js v16+, MySQL 8.0+
   - SSL certificate for HTTPS
   - Domain name configuration

2. **Environment Configuration**:
```bash
# Production environment variables
NODE_ENV=production
PORT=80
DB_HOST=your-db-host
DB_USER=your-db-user
DB_PASSWORD=your-secure-password
DB_NAME=clickopticx_production
```

3. **Security Hardening**:
   - Enable firewall (UFW/iptables)
   - Configure SSL/TLS certificates
   - Set up automated backups
   - Monitor system logs

### Cloud Deployment Options
- **Railway** - Free tier available
- **Heroku** - Easy deployment
- **DigitalOcean** - VPS hosting
- **AWS EC2** - Scalable cloud hosting

## 📊 Database Schema

### Core Tables Structure
```sql
-- Users table with role-based access
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    Username VARCHAR(255) NOT NULL,
    Email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    Number VARCHAR(20),
    plan VARCHAR(255),
    role ENUM('user', 'Team', 'admin') DEFAULT 'user',
    remaining_gb INT(11) DEFAULT 0,
    invoice ENUM('Paid', 'Unpaid') DEFAULT 'Unpaid',
    user_img VARCHAR(255),
    transaction_id VARCHAR(255),
    amount DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    verification_token VARCHAR(255),
    verified BOOLEAN DEFAULT FALSE,
    expiry_date DATE
);

-- Packages table for service plans
CREATE TABLE packages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    Package VARCHAR(255) NOT NULL,
    Price DECIMAL(10,2) NOT NULL,
    Speed VARCHAR(255) NOT NULL,
    Data_Used VARCHAR(255) NOT NULL,
    Offer_Valid VARCHAR(255) NOT NULL,
    limits VARCHAR(255) NOT NULL,
    user_id INT,
    discountPercentage DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payments tracking table
CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    package_id INT,
    amount DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'paid', 'failed') DEFAULT 'pending',
    transaction_id VARCHAR(255),
    payment_method VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## 🎯 Business Benefits

### For ISP Owners
- **Complete operational control** over all business aspects
- **Real-time financial tracking** and revenue monitoring  
- **Automated billing** and payment processing
- **Customer service optimization** with complaint tracking
- **Equipment management** reducing operational costs
- **Data-driven insights** for business growth

### For Customers  
- **Easy online registration** and account management
- **Transparent billing** and payment history
- **Quick complaint resolution** through support system
- **Islamic features** for community engagement
- **Weather integration** for daily convenience

### For Support Teams
- **Organized ticket management** system
- **Clear task assignment** and tracking
- **Performance monitoring** and metrics
- **Streamlined customer communication**

## 📞 Support & Maintenance

### Technical Support
- **Email**: support@clickopticx.com
- **Documentation**: Built-in help system
- **Issue Tracking**: GitHub issues
- **Community Forum**: User discussion board

### Maintenance Schedule
- **Daily**: Automated backups
- **Weekly**: System performance monitoring
- **Monthly**: Security updates and patches
- **Quarterly**: Feature updates and improvements

## 📄 License & Legal

This project is proprietary software designed specifically for ISP management. 

**Usage Rights:**
- ✅ Use for commercial ISP operations
- ✅ Customize for business needs  
- ✅ Deploy on internal servers
- ❌ Redistribute source code
- ❌ Sell or sublicense system
- ❌ Remove copyright notices

## 🔄 Version History

- **v1.0** - Initial release with core ISP management features
- **v1.1** - Added Islamic features and weather integration  
- **v1.2** - Enhanced admin controls and equipment management
- **v1.3** - Improved security and payment processing
- **v1.4** - Advanced analytics and reporting features

---

**🎉 ClickOpticx - Your Complete ISP Management Solution**

*Empowering Internet Service Providers with comprehensive tools for customer management, billing operations, and business growth.*