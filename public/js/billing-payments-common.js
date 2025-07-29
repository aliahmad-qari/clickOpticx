// Common JavaScript functionality for billing payment pages

// SIDEBAR FUNCTIONALITY - COMPATIBLE WITH EXISTING SYSTEM
// This works with the existing off-canvas.js jQuery system
function initializeSideboard() {
  // Only initialize if jQuery and the existing off-canvas system isn't working
  if (typeof $ === 'undefined') {
    console.warn('jQuery not found - initializing fallback sidebar functionality');
    
    // Fallback implementation for rare cases where jQuery is not available
    const toggleButtons = document.querySelectorAll('[data-toggle="offcanvas"]');
    toggleButtons.forEach(button => {
      button.addEventListener('click', function() {
        const sidebar = document.querySelector('.sidebar-offcanvas');
        if (sidebar) {
          sidebar.classList.toggle('active');
        }
      });
    });
  }
  
  // Enhanced responsive behavior for billing pages
  handleResponsiveSidebar();
}

// Enhanced responsive sidebar behavior
function handleResponsiveSidebar() {
  // Auto-hide sidebar when clicking on nav links (mobile)
  if (window.innerWidth <= 991) {
    const sidebarLinks = document.querySelectorAll('.sidebar .nav-link');
    
    sidebarLinks.forEach(link => {
      // Only add if not already added
      if (!link.hasAttribute('data-billing-listener')) {
        link.setAttribute('data-billing-listener', 'true');
        link.addEventListener('click', function() {
          // Don't hide sidebar for dropdown toggles
          if (!this.getAttribute('data-toggle') && !this.getAttribute('data-bs-toggle')) {
            setTimeout(() => {
              if (typeof $ !== 'undefined') {
                $('.sidebar-offcanvas').removeClass('active');
              } else {
                const sidebar = document.querySelector('.sidebar-offcanvas');
                if (sidebar) sidebar.classList.remove('active');
              }
            }, 300); // Small delay to allow navigation
          }
        });
      }
    });
  }

  // Handle window resize properly
  const handleResize = () => {
    const sidebar = document.querySelector('.sidebar-offcanvas');
    const overlay = document.getElementById('sidebarOverlay');
    
    if (window.innerWidth > 991) {
      if (sidebar) sidebar.classList.remove('active');
      if (overlay) overlay.classList.remove('active');
    }
  };

  // Remove existing listener if any, then add new one
  window.removeEventListener('resize', handleResize);
  window.addEventListener('resize', handleResize);
}

// Common table responsive functionality
function makeTablesResponsive() {
  // Ensure tables are properly responsive
  const tables = document.querySelectorAll('.table-responsive');
  tables.forEach(table => {
    // Add horizontal scroll for small screens
    table.style.overflowX = 'auto';
    table.style.webkitOverflowScrolling = 'touch';
  });
}

// Common error handling for API calls
function handleApiError(error, context = 'API call') {
  console.error(`Error in ${context}:`, error);
  
  // Show user-friendly error message
  const errorMessage = document.createElement('div');
  errorMessage.className = 'alert alert-danger alert-dismissible fade show';
  errorMessage.innerHTML = `
    <strong>Error!</strong> Failed to load data. Please refresh the page or contact support.
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  
  // Insert at top of content area
  const contentWrapper = document.querySelector('.content-wrapper');
  if (contentWrapper) {
    contentWrapper.insertBefore(errorMessage, contentWrapper.firstChild);
  }
}

// Common loading state
function showLoadingState(containerId) {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = `
      <div class="text-center p-4">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-2">Loading data...</p>
      </div>
    `;
  }
}

// Common no data state with consistent styling
function showNoDataState(containerId, message = 'No data available') {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = `
      <div class="billing-empty-state">
        <i class="fas fa-inbox"></i>
        <h5>${message}</h5>
        <p>Try refreshing the page or checking back later.</p>
      </div>
    `;
  }
}

// Inject consistent empty state CSS
function injectEmptyStateCSS() {
  if (!document.getElementById('billing-empty-state-css')) {
    const style = document.createElement('style');
    style.id = 'billing-empty-state-css';
    style.textContent = `
      .billing-empty-state {
        text-align: center;
        padding: 3rem 2rem;
        color: #6c757d;
        background: #f8f9fa;
        border-radius: 8px;
        margin: 1rem 0;
      }
      
      .billing-empty-state i {
        font-size: 3.5rem;
        color: #dee2e6;
        margin-bottom: 1.5rem;
        display: block;
      }
      
      .billing-empty-state h5 {
        color: #495057;
        font-weight: 600;
        margin-bottom: 0.5rem;
        font-size: 1.1rem;
      }
      
      .billing-empty-state p {
        color: #6c757d;
        margin-bottom: 0;
        font-size: 0.9rem;
      }
      
      /* Table empty state */
      .billing-table-empty {
        text-align: center;
        padding: 2rem;
        color: #6c757d;
      }
      
      .billing-table-empty i {
        font-size: 3rem;
        color: #dee2e6;
        margin-bottom: 1rem;
        display: block;
      }
      
      .billing-table-empty h6 {
        color: #495057;
        font-weight: 600;
        margin-bottom: 0.5rem;
      }
      
      .billing-table-empty p {
        color: #6c757d;
        margin-bottom: 0;
        font-size: 0.9rem;
      }
    `;
    document.head.appendChild(style);
  }
}

// Common export functionality
function exportToCSV(data, filename, headers) {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  const csvContent = [
    headers,
    ...data
  ].map(row => row.join(',')).join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
}

// Common search functionality
function setupSearch(inputId, originalData, displayFunction) {
  const searchInput = document.getElementById(inputId);
  if (searchInput) {
    searchInput.addEventListener('input', function(e) {
      const searchTerm = e.target.value.toLowerCase();
      const filteredData = originalData.filter(item => {
        return Object.values(item).some(value => 
          value && value.toString().toLowerCase().includes(searchTerm)
        );
      });
      displayFunction(filteredData);
    });
  }
}

// Auto-initialize real-time search for common patterns
function autoInitializeSearch() {
  // Common search input patterns
  const searchInputSelectors = [
    '#search-input',
    '#user-search-input',
    '#usernameSearch',
    '.search-input[type="text"]'
  ];
  
  searchInputSelectors.forEach(selector => {
    const input = document.querySelector(selector);
    if (input && !input.hasAttribute('data-search-initialized')) {
      input.setAttribute('data-search-initialized', 'true');
      
      // Try to detect what type of data we're searching
      const context = detectSearchContext(input);
      if (context) {
        console.log(`Auto-initializing search for: ${selector} (${context.type})`);
        initializeContextualSearch(input, context);
      }
    }
  });
}

function detectSearchContext(input) {
  const page = window.location.pathname;
  const tableRows = document.querySelectorAll('tbody tr');
  
  if (page.includes('paid-users') || page.includes('User') || page.includes('ActiveUser')) {
    return {
      type: 'users',
      rows: Array.from(tableRows),
      searchFields: ['username', 'email', 'role', 'plan']
    };
  } else if (page.includes('manual-package') || page.includes('package')) {
    return {
      type: 'packages', 
      rows: Array.from(tableRows),
      searchFields: ['package_name', 'user_name', 'status']
    };
  } else if (page.includes('payment')) {
    return {
      type: 'payments',
      rows: Array.from(tableRows), 
      searchFields: ['username', 'amount', 'status', 'date']
    };
  }
  
  return null;
}

function initializeContextualSearch(input, context) {
  if (!window.createAdminSearch) return;
  
  const data = context.rows.map(row => {
    const cells = row.querySelectorAll('td');
    const item = { element: row };
    
    // Extract text from each cell
    cells.forEach((cell, index) => {
      const text = cell.textContent.trim();
      item[`field_${index}`] = text;
      
      // Add common field names based on content
      if (text.includes('@')) item.email = text;
      if (text.match(/^\d+$/)) item.id = text;
      if (index === 1) item.name = text; // Usually name/username is in second column
    });
    
    return item;
  });
  
  window.createAdminSearch({
    searchInput: input,
    dataSource: data,
    searchFields: Object.keys(data[0] || {}).filter(key => key !== 'element'),
    displayFunction: function(filteredItems) {
      context.rows.forEach(row => row.style.display = 'none');
      filteredItems.forEach(item => {
        if (item.element) item.element.style.display = '';
      });
    },
    debounceTime: 200,
    minSearchLength: 0
  });
}

// Professional UI/UX Components for Package Management System
class ProfessionalNotification {
  static show(message, type = 'info', duration = 5000) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type} show`;
    notification.innerHTML = `
      <div class="notification-content">
        <i class="notification-icon ${this.getIcon(type)}"></i>
        <span class="notification-message">${message}</span>
        <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    if (duration > 0) {
      setTimeout(() => notification.remove(), duration);
    }
    
    return notification;
  }
  
  static getIcon(type) {
    const icons = {
      success: 'fas fa-check-circle',
      error: 'fas fa-times-circle',
      warning: 'fas fa-exclamation-triangle',
      info: 'fas fa-info-circle'
    };
    return icons[type] || icons.info;
  }
}

class DataFormatter {
  static currency(amount, currency = 'PKR') {
    const formatted = new Intl.NumberFormat('en-PK').format(amount);
    return `${currency} ${formatted}`;
  }
  
  static date(dateString, format = 'short') {
    const date = new Date(dateString);
    if (format === 'relative') {
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) return 'Yesterday';
      if (diffDays <= 7) return `${diffDays} days ago`;
      if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
      return date.toLocaleDateString('en-GB');
    }
    
    return date.toLocaleDateString('en-GB');
  }
  
  static status(status) {
    const statusMap = {
      pending: { class: 'warning', icon: 'fas fa-clock', text: 'Pending' },
      approved: { class: 'success', icon: 'fas fa-check', text: 'Approved' },
      rejected: { class: 'danger', icon: 'fas fa-times', text: 'Rejected' },
      paid: { class: 'success', icon: 'fas fa-check-circle', text: 'Paid' },
      active: { class: 'success', icon: 'fas fa-check-circle', text: 'Active' },
      inactive: { class: 'secondary', icon: 'fas fa-pause-circle', text: 'Inactive' }
    };
    
    const config = statusMap[status.toLowerCase()] || statusMap.pending;
    return `<span class="badge bg-${config.class}"><i class="${config.icon}"></i> ${config.text}</span>`;
  }
}

class LoadingManager {
  static show(containerId, message = 'Loading...') {
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = `
        <div class="loading-container">
          <div class="loading-spinner"></div>
          <p class="loading-message">${message}</p>
        </div>
      `;
    }
  }
  
  static hide(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
      const loading = container.querySelector('.loading-container');
      if (loading) loading.remove();
    }
  }
}

class BillingAPI {
  static async fetchData(endpoint, options = {}) {
    try {
      const response = await fetch(endpoint, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API fetch error:', error);
      throw error;
    }
  }
  
  static async updatePaymentStatus(paymentId, status) {
    return this.fetchData(`/api/payments/${paymentId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  }
  
  static async updatePackageRequest(requestId, data) {
    return this.fetchData(`/api/package-requests/${requestId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }
}

class FormValidator {
  static validateRequired(form) {
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
      const value = field.value.trim();
      if (!value) {
        this.showFieldError(field, 'This field is required');
        isValid = false;
      } else {
        this.clearFieldError(field);
      }
    });
    
    return isValid;
  }
  
  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  static showFieldError(field, message) {
    field.classList.add('is-invalid');
    let errorDiv = field.parentNode.querySelector('.invalid-feedback');
    if (!errorDiv) {
      errorDiv = document.createElement('div');
      errorDiv.className = 'invalid-feedback';
      field.parentNode.appendChild(errorDiv);
    }
    errorDiv.textContent = message;
  }
  
  static clearFieldError(field) {
    field.classList.remove('is-invalid');
    const errorDiv = field.parentNode.querySelector('.invalid-feedback');
    if (errorDiv) errorDiv.remove();
  }
}

class ModalManager {
  static show(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      const bsModal = new bootstrap.Modal(modal);
      bsModal.show();
    }
  }
  
  static hide(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      const bsModal = bootstrap.Modal.getInstance(modal);
      if (bsModal) bsModal.hide();
    }
  }
  
  static populateForm(modalId, data) {
    const modal = document.getElementById(modalId);
    if (modal) {
      Object.keys(data).forEach(key => {
        const field = modal.querySelector(`[name="${key}"], #${key}`);
        if (field) {
          field.value = data[key];
        }
      });
    }
  }
}

// Professional Statistics Dashboard
class StatsDashboard {
  static createStatsCard(title, value, icon, color = 'primary', trend = null) {
    return `
      <div class="stats-card stats-${color}">
        <div class="stats-icon">
          <i class="${icon}"></i>
        </div>
        <div class="stats-content">
          <h3 class="stats-value">${value}</h3>
          <p class="stats-title">${title}</p>
          ${trend ? `<div class="stats-trend ${trend.direction}">
            <i class="fas fa-arrow-${trend.direction === 'up' ? 'up' : 'down'}"></i>
            ${trend.percentage}%
          </div>` : ''}
        </div>
      </div>
    `;
  }
  
  static updateStats(containerId, stats) {
    const container = document.getElementById(containerId);
    if (container && stats) {
      const statsHtml = stats.map(stat => 
        this.createStatsCard(stat.title, stat.value, stat.icon, stat.color, stat.trend)
      ).join('');
      container.innerHTML = statsHtml;
    }
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  // Initialize enhanced sidebar functionality (compatible with existing system)
  initializeSideboard();
  makeTablesResponsive();
  
  // Inject consistent empty state CSS
  injectEmptyStateCSS();
  
  // Auto-initialize search after a small delay to ensure other scripts have loaded
  setTimeout(autoInitializeSearch, 500);
});

// Ensure all utilities are available globally
if (typeof window !== 'undefined') {
  window.initializeSideboard = initializeSideboard;
  window.handleResponsiveSidebar = handleResponsiveSidebar;
  window.makeTablesResponsive = makeTablesResponsive;
  window.handleApiError = handleApiError;
  window.showLoadingState = showLoadingState;
  window.showNoDataState = showNoDataState;
  window.injectEmptyStateCSS = injectEmptyStateCSS;
  window.exportToCSV = exportToCSV;
  window.setupSearch = setupSearch;
  
  // Professional utilities
  window.ProfessionalNotification = ProfessionalNotification;
  window.DataFormatter = DataFormatter;
  window.LoadingManager = LoadingManager;
  window.BillingAPI = BillingAPI;
  window.FormValidator = FormValidator;
  window.ModalManager = ModalManager;
  window.StatsDashboard = StatsDashboard;
}