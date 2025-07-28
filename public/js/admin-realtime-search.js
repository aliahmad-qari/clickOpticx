/**
 * Universal Real-time Search Component for Admin Panel
 * Provides instant search functionality with debouncing
 */

class AdminRealtimeSearch {
  constructor(options = {}) {
    this.searchInput = options.searchInput;
    this.searchInputId = options.searchInputId;
    this.dataSource = options.dataSource || []; // Array of data
    this.apiEndpoint = options.apiEndpoint; // API endpoint for dynamic data
    this.displayFunction = options.displayFunction; // Function to display results
    this.searchFields = options.searchFields || []; // Fields to search in
    this.debounceTime = options.debounceTime || 300; // Debounce delay in ms
    this.minSearchLength = options.minSearchLength || 0; // Minimum characters to start search
    this.caseSensitive = options.caseSensitive || false;
    this.exactMatch = options.exactMatch || false;
    
    this.originalData = [];
    this.debounceTimer = null;
    this.isSearching = false;
    
    this.init();
  }
  
  init() {
    // Get search input element
    if (this.searchInputId) {
      this.searchInput = document.getElementById(this.searchInputId);
    }
    
    if (!this.searchInput) {
      console.warn('AdminRealtimeSearch: Search input not found');
      return;
    }
    
    // Store original data
    this.originalData = [...this.dataSource];
    
    // Add event listeners
    this.addEventListeners();
    
    // Add visual indicators
    this.addSearchIndicators();
    
    console.log('AdminRealtimeSearch initialized for:', this.searchInput.id || 'unnamed input');
  }
  
  addEventListeners() {
    // Main search event with debouncing
    this.searchInput.addEventListener('input', (e) => {
      this.handleSearch(e.target.value);
    });
    
    // Clear search on escape key
    this.searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.clearSearch();
      }
    });
    
    // Prevent form submission on enter
    this.searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
      }
    });
  }
  
  addSearchIndicators() {
    // Add search icon if not present
    const container = this.searchInput.parentElement;
    if (!container.querySelector('.search-icon')) {
      const icon = document.createElement('i');
      icon.className = 'fas fa-search search-icon';
      icon.style.cssText = `
        position: absolute;
        left: 12px;
        top: 50%;
        transform: translateY(-50%);
        color: #999;
        pointer-events: none;
      `;
      container.style.position = 'relative';
      container.appendChild(icon);
      
      // Add padding to input for icon
      this.searchInput.style.paddingLeft = '35px';
    }
    
    // Add clear button
    const clearBtn = document.createElement('button');
    clearBtn.className = 'search-clear-btn';
    clearBtn.innerHTML = '<i class="fas fa-times"></i>';
    clearBtn.style.cssText = `
      position: absolute;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: #999;
      cursor: pointer;
      padding: 4px;
      border-radius: 50%;
      display: none;
      z-index: 1;
    `;
    clearBtn.addEventListener('click', () => this.clearSearch());
    container.appendChild(clearBtn);
    
    // Show/hide clear button based on input value
    this.searchInput.addEventListener('input', (e) => {
      clearBtn.style.display = e.target.value ? 'block' : 'none';
    });
  }
  
  handleSearch(searchTerm) {
    // Clear previous debounce timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    
    // Set loading state
    this.setLoadingState(true);
    
    // Debounce the search
    this.debounceTimer = setTimeout(() => {
      this.performSearch(searchTerm);
    }, this.debounceTime);
  }
  
  async performSearch(searchTerm) {
    try {
      // Check minimum search length
      if (searchTerm.length < this.minSearchLength) {
        if (searchTerm.length === 0) {
          // Show all data when search is empty
          this.displayResults(this.originalData);
        }
        this.setLoadingState(false);
        return;
      }
      
      let results = [];
      
      if (this.apiEndpoint) {
        // API-based search
        results = await this.searchAPI(searchTerm);
      } else {
        // Local data search
        results = this.searchLocal(searchTerm);
      }
      
      this.displayResults(results);
      this.setLoadingState(false);
      
    } catch (error) {
      console.error('Search error:', error);
      this.setLoadingState(false);
      this.showError('Search failed. Please try again.');
    }
  }
  
  searchLocal(searchTerm) {
    if (!this.originalData || this.originalData.length === 0) {
      return [];
    }
    
    const term = this.caseSensitive ? searchTerm : searchTerm.toLowerCase();
    
    return this.originalData.filter(item => {
      // If no search fields specified, search all string properties
      let fieldsToSearch = this.searchFields;
      if (fieldsToSearch.length === 0) {
        fieldsToSearch = Object.keys(item).filter(key => 
          typeof item[key] === 'string' || typeof item[key] === 'number'
        );
      }
      
      return fieldsToSearch.some(field => {
        let fieldValue = item[field];
        if (fieldValue == null) return false;
        
        fieldValue = this.caseSensitive ? fieldValue.toString() : fieldValue.toString().toLowerCase();
        
        if (this.exactMatch) {
          return fieldValue === term;
        } else {
          return fieldValue.includes(term);
        }
      });
    });
  }
  
  async searchAPI(searchTerm) {
    const url = this.apiEndpoint.includes('?') 
      ? `${this.apiEndpoint}&search=${encodeURIComponent(searchTerm)}`
      : `${this.apiEndpoint}?search=${encodeURIComponent(searchTerm)}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API search failed: ${response.status}`);
    }
    
    return await response.json();
  }
  
  displayResults(results) {
    if (this.displayFunction && typeof this.displayFunction === 'function') {
      this.displayFunction(results);
    } else {
      console.warn('AdminRealtimeSearch: No display function provided');
    }
    
    // Emit custom event
    this.searchInput.dispatchEvent(new CustomEvent('searchResults', {
      detail: { results, searchTerm: this.searchInput.value }
    }));
  }
  
  setLoadingState(isLoading) {
    this.isSearching = isLoading;
    const loadingClass = 'searching';
    
    if (isLoading) {
      this.searchInput.classList.add(loadingClass);
    } else {
      this.searchInput.classList.remove(loadingClass);
    }
    
    // Update search icon
    const icon = this.searchInput.parentElement.querySelector('.search-icon');
    if (icon) {
      if (isLoading) {
        icon.className = 'fas fa-spinner fa-spin search-icon';
      } else {
        icon.className = 'fas fa-search search-icon';
      }
    }
  }
  
  showError(message) {
    // Create or update error message
    let errorDiv = this.searchInput.parentElement.querySelector('.search-error');
    if (!errorDiv) {
      errorDiv = document.createElement('div');
      errorDiv.className = 'search-error';
      errorDiv.style.cssText = `
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
        border-radius: 4px;
        padding: 8px 12px;
        font-size: 0.875rem;
        z-index: 1000;
        margin-top: 2px;
      `;
      this.searchInput.parentElement.appendChild(errorDiv);
    }
    
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    
    // Auto-hide error after 3 seconds
    setTimeout(() => {
      if (errorDiv) {
        errorDiv.style.display = 'none';
      }
    }, 3000);
  }
  
  clearSearch() {
    this.searchInput.value = '';
    this.displayResults(this.originalData);
    this.searchInput.focus();
    
    // Hide clear button
    const clearBtn = this.searchInput.parentElement.querySelector('.search-clear-btn');
    if (clearBtn) {
      clearBtn.style.display = 'none';
    }
    
    // Hide error
    const errorDiv = this.searchInput.parentElement.querySelector('.search-error');
    if (errorDiv) {
      errorDiv.style.display = 'none';
    }
  }
  
  updateData(newData) {
    this.originalData = [...newData];
    this.dataSource = [...newData];
    
    // If no current search, display all data
    if (!this.searchInput.value) {
      this.displayResults(this.originalData);
    } else {
      // Re-run current search with new data
      this.performSearch(this.searchInput.value);
    }
  }
  
  destroy() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    
    // Remove event listeners would require storing references
    // For now, just clear the timer
    console.log('AdminRealtimeSearch destroyed');
  }
}

// Global helper function to create search instances
window.createAdminSearch = function(options) {
  return new AdminRealtimeSearch(options);
};

// CSS for search states
const searchStyles = `
  .searching {
    background-image: linear-gradient(45deg, transparent 25%, rgba(255,255,255,.2) 25%, rgba(255,255,255,.2) 75%, transparent 75%, transparent),
                      linear-gradient(45deg, transparent 25%, rgba(255,255,255,.2) 25%, rgba(255,255,255,.2) 75%, transparent 75%, transparent);
    background-size: 30px 30px;
    background-position: 0 0, 15px 15px;
    animation: searchProgress 2s linear infinite;
  }
  
  @keyframes searchProgress {
    0% { background-position: 0 0, 15px 15px; }
    100% { background-position: 30px 30px, 45px 45px; }
  }
  
  .search-clear-btn:hover {
    background-color: rgba(0,0,0,0.1) !important;
  }
`;

// Inject styles
if (!document.querySelector('#admin-search-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'admin-search-styles';
  styleSheet.textContent = searchStyles;
  document.head.appendChild(styleSheet);
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AdminRealtimeSearch;
}