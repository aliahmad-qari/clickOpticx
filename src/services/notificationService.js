const db = require("../config/db");
const nodemailer = require("nodemailer");
require("dotenv").config();

// Email configuration
const emailTransporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.GMAIL_USER || 'your-email@gmail.com',
    pass: process.env.GMAIL_PASS || 'your-app-password'
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Test email configuration
emailTransporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email transporter verification failed:', error.message);
  } else {
    console.log('✅ Email transporter is ready to send emails');
  }
});

// Get admin email from database
const getAdminEmail = () => {
  return new Promise((resolve, reject) => {
    // First, let's see all admin users
    const debugQuery = "SELECT id, Username, Email, role FROM users WHERE role = 'admin'";
    db.query(debugQuery, (err, debugResults) => {
      if (err) {
        console.error("Error in debug query:", err);
      } else {
        console.log("🔍 All admin users found:", debugResults);
      }
    });

    // Get the specific admin email (abdulhadi86411@gmail.com)
    const adminQuery = "SELECT Email FROM users WHERE role = 'admin' AND Email = 'abdulhadi86411@gmail.com' LIMIT 1";
    db.query(adminQuery, (err, results) => {
      if (err) {
        console.error("Error fetching admin email:", err);
        reject(err);
      } else if (results.length > 0) {
        resolve(results[0].Email);
      } else {
        // Fallback to any admin if the specific one doesn't exist
        const fallbackQuery = "SELECT Email FROM users WHERE role = 'admin' LIMIT 1";
        db.query(fallbackQuery, (err2, results2) => {
          if (err2) {
            reject(err2);
          } else if (results2.length > 0) {
            resolve(results2[0].Email);
          } else {
            resolve(null);
          }
        });
      }
    });
  });
};

// Send email notification
const sendEmailNotification = async (to, subject, message, userDetails = {}) => {
  try {
    console.log(`📧 Attempting to send email to: ${to}`);
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <div style="background: linear-gradient(135deg, #6a11cb, #2575fc); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h2 style="margin: 0;">🔔 ClickOpticx Admin Notification</h2>
        </div>
        
        <div style="padding: 20px; background: #f9f9f9;">
          <h3 style="color: #333; margin-bottom: 15px;">📢 ${subject}</h3>
          
          <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
            <p style="color: #555; font-size: 16px; line-height: 1.5; margin: 0;">
              ${message}
            </p>
          </div>
          
          ${Object.keys(userDetails).length > 0 ? `
          <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
            <h4 style="color: #333; margin-bottom: 10px;">👤 User Details:</h4>
            ${userDetails.username ? `<p style="margin: 5px 0;"><strong>Username:</strong> ${userDetails.username}</p>` : ''}
            ${userDetails.email ? `<p style="margin: 5px 0;"><strong>Email:</strong> ${userDetails.email}</p>` : ''}
            ${userDetails.phone ? `<p style="margin: 5px 0;"><strong>Phone:</strong> ${userDetails.phone}</p>` : ''}
            ${userDetails.package ? `<p style="margin: 5px 0;"><strong>Package:</strong> ${userDetails.package}</p>` : ''}
            ${userDetails.amount ? `<p style="margin: 5px 0;"><strong>Amount:</strong> ${userDetails.amount}</p>` : ''}
            ${userDetails.complaint ? `<p style="margin: 5px 0;"><strong>Complaint:</strong> ${userDetails.complaint}</p>` : ''}
            ${userDetails.description ? `<p style="margin: 5px 0;"><strong>Description:</strong> ${userDetails.description}</p>` : ''}
            ${userDetails.status ? `<p style="margin: 5px 0;"><strong>Status:</strong> <span style="background: ${userDetails.status === 'pending' ? '#ffc107' : userDetails.status === 'resolved' ? '#28a745' : '#6c757d'}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px;">${userDetails.status}</span></p>` : ''}
          </div>
          ` : ''}
          
          <div style="text-align: center; margin-top: 20px;">
            <p style="color: #888; font-size: 14px;">
              📅 ${new Date().toLocaleString()}<br>
              🌐 ClickOpticx Admin Panel
            </p>
          </div>
        </div>
      </div>
    `;

    const mailOptions = {
      from: process.env.GMAIL_USER || 'noreply@clickopticx.com',
      to: to,
      subject: `🔔 ClickOpticx - ${subject}`,
      html: emailContent
    };

    console.log(`📧 Mail options:`, {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject
    });

    const result = await emailTransporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${to}`, result.messageId);
    return true;
  } catch (error) {
    console.error("❌ Error sending email:", error.message);
    console.error("❌ Full error:", error);
    return false;
  }
};

// Main notification service
class NotificationService {
  
  // Send notification to admin (both database and email)
  static async notifyAdmin(message, userDetails = {}, emailSubject = "New User Activity") {
    try {
      // 1. Insert into admin notifications table
      const adminNotifQuery = `
        INSERT INTO notifications (username, message, is_read, created_at) 
        VALUES (?, ?, 0, NOW())
      `;
      
      db.query(adminNotifQuery, ['Admin', message], (err) => {
        if (err) {
          console.error("❌ Error inserting admin notification:", err);
        } else {
          console.log("✅ Admin notification inserted successfully");
        }
      });

      // 2. Send email to admin
      const adminEmail = await getAdminEmail();
      console.log(`🔍 Admin email found: ${adminEmail}`);
      if (adminEmail) {
        const emailSent = await sendEmailNotification(adminEmail, emailSubject, message, userDetails);
        console.log(`📧 Email sending result: ${emailSent}`);
      } else {
        console.warn("⚠️ Admin email not found");
      }

    } catch (error) {
      console.error("❌ Error in notifyAdmin:", error);
    }
  }

  // Send notification to specific user
  static notifyUser(userId, message) {
    const userNotifQuery = `
      INSERT INTO notifications_user (user_id, message, is_read, created_at) 
      VALUES (?, ?, 0, NOW())
    `;
    
    db.query(userNotifQuery, [userId, message], (err) => {
      if (err) {
        console.error("❌ Error inserting user notification:", err);
      } else {
        console.log("✅ User notification inserted successfully");
      }
    });
  }

  // Handle new complaint
  static async handleNewComplaint(complaintData) {
    const message = `🚨 New complaint received from ${complaintData.username}`;
    const emailSubject = "New User Complaint";
    
    const userDetails = {
      username: complaintData.username,
      email: complaintData.email,
      phone: complaintData.phone,
      complaint: complaintData.complaint,
      description: complaintData.description || complaintData.complaint_description,
      status: complaintData.status || 'pending'
    };

    await this.notifyAdmin(message, userDetails, emailSubject);
  }

  // Handle new package request
  static async handlePackageRequest(requestData) {
    const message = `📦 New package request from ${requestData.username} for ${requestData.package_name}`;
    const emailSubject = "New Package Request";
    
    const userDetails = {
      username: requestData.username,
      email: requestData.email,
      package: requestData.package_name,
      amount: requestData.amount
    };

    await this.notifyAdmin(message, userDetails, emailSubject);
  }

  // Handle new payment
  static async handleNewPayment(paymentData) {
    const message = `💰 New payment received from ${paymentData.username} - Amount: ${paymentData.amount}`;
    const emailSubject = "New Payment Received";
    
    const userDetails = {
      username: paymentData.username,
      email: paymentData.email,
      amount: paymentData.amount,
      package: paymentData.package_name
    };

    await this.notifyAdmin(message, userDetails, emailSubject);
  }

  // Handle new user registration
  static async handleNewUserRegistration(userData) {
    const message = `👤 New user registered: ${userData.username}`;
    const emailSubject = "New User Registration";
    
    const userDetails = {
      username: userData.username,
      email: userData.email,
      phone: userData.phone
    };

    await this.notifyAdmin(message, userDetails, emailSubject);
  }

  // Handle equipment request
  static async handleEquipmentRequest(equipmentData) {
    const message = `🔧 New equipment request from ${equipmentData.username}`;
    const emailSubject = "New Equipment Request";
    
    const userDetails = {
      username: equipmentData.username,
      email: equipmentData.email,
      equipment: equipmentData.equipment_type
    };

    await this.notifyAdmin(message, userDetails, emailSubject);
  }

  // Handle task submission
  static async handleTaskSubmission(taskData) {
    const message = `📋 New task submitted by ${taskData.username}: ${taskData.title}`;
    const emailSubject = "New Task Submission";
    
    const userDetails = {
      username: taskData.username,
      email: taskData.email,
      task: taskData.title
    };

    await this.notifyAdmin(message, userDetails, emailSubject);
  }

  // Handle contact form submission
  static async handleContactForm(contactData) {
    const message = `📨 New contact form submission from ${contactData.name}`;
    const emailSubject = "New Contact Form Submission";
    
    const userDetails = {
      username: contactData.name,
      email: contactData.email,
      phone: contactData.phone,
      message: contactData.message
    };

    await this.notifyAdmin(message, userDetails, emailSubject);
  }

  // Mark notification as read
  static markAsRead(notificationId, isAdminNotification = false) {
    const table = isAdminNotification ? 'notifications' : 'notifications_user';
    const updateQuery = `UPDATE ${table} SET is_read = 1 WHERE id = ?`;
    
    db.query(updateQuery, [notificationId], (err) => {
      if (err) {
        console.error("❌ Error marking notification as read:", err);
      } else {
        console.log("✅ Notification marked as read");
      }
    });
  }

  // Mark all notifications as read for admin
  static markAllAdminNotificationsAsRead() {
    const updateQuery = `UPDATE notifications SET is_read = 1 WHERE is_read = 0`;
    
    db.query(updateQuery, (err) => {
      if (err) {
        console.error("❌ Error marking all admin notifications as read:", err);
      } else {
        console.log("✅ All admin notifications marked as read");
      }
    });
  }

  // Mark all notifications as read for user
  static markAllUserNotificationsAsRead(userId) {
    const updateQuery = `UPDATE notifications_user SET is_read = 1 WHERE user_id = ? AND is_read = 0`;
    
    db.query(updateQuery, [userId], (err) => {
      if (err) {
        console.error("❌ Error marking all user notifications as read:", err);
      } else {
        console.log("✅ All user notifications marked as read");
      }
    });
  }
}

module.exports = NotificationService;