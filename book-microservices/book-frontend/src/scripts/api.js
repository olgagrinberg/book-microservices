// scripts/api.js
// Book Microservice Dashboard API - Spring Boot Backend Client

// Configuration
const API_CONFIG = {
    baseURL: 'http://localhost:8080/api/books', // Adjust port if needed
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
};

// Global variables
let currentSearchTerm = '';
let allBooks = [];

// HTTP Client Utility
class HttpClient {
    static async request(url, options = {}) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);
        
        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
                headers: {
                    ...API_CONFIG.headers,
                    ...options.headers
                }
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
            }
            
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            }
            
            return await response.text();
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('Request timeout - please check if the server is running');
            }
            throw error;
        }
    }
    
    static async get(endpoint) {
        return this.request(`${API_CONFIG.baseURL}${endpoint}`, {
            method: 'GET'
        });
    }
    
    static async post(endpoint, data) {
        return this.request(`${API_CONFIG.baseURL}${endpoint}`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
    
    static async put(endpoint, data) {
        return this.request(`${API_CONFIG.baseURL}${endpoint}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }
    
    static async delete(endpoint) {
        return this.request(`${API_CONFIG.baseURL}${endpoint}`, {
            method: 'DELETE'
        });
    }
}

// API Functions
async function getAllBooks() {
    try {
        showLoading(true);
        const books = await HttpClient.get('');
        allBooks = books;
        return books;
    } catch (error) {
        console.error('Error fetching books:', error);
        showNotification(`❌ Failed to load books: ${error.message}`, 'error');
        return [];
    } finally {
        showLoading(false);
    }
}

async function getBooksByStatus(status) {
    try {
        const books = await HttpClient.get(`?status=${encodeURIComponent(status)}`);
        return books;
    } catch (error) {
        console.error('Error fetching books by status:', error);
        return allBooks.filter(book => book.status === status);
    }
}

async function searchBooksAPI(searchTerm) {
    if (!searchTerm) return allBooks;
    
    try {
        const books = await HttpClient.get(`/search?q=${encodeURIComponent(searchTerm)}`);
        return books;
    } catch (error) {
        console.error('Error searching books:', error);
        // Fallback to client-side search if server search fails
        const term = searchTerm.toLowerCase();
        return allBooks.filter(book => 
            book.title?.toLowerCase().includes(term) ||
            book.author?.toLowerCase().includes(term) ||
            book.genre?.toLowerCase().includes(term) ||
            book.isbn?.includes(term)
        );
    }
}

async function addBookAPI(bookData) {
    try {
        showLoading(true);
        const newBook = await HttpClient.post('', bookData);
        allBooks.push(newBook);
        return newBook;
    } catch (error) {
        console.error('Error adding book:', error);
        showNotification(`❌ Failed to add book: ${error.message}`, 'error');
        throw error;
    } finally {
        showLoading(false);
    }
}

async function deleteBookAPI(id) {
    try {
        showLoading(true);
        await HttpClient.delete(`/${id}`);
        const index = allBooks.findIndex(book => book.id === parseInt(id));
        if (index !== -1) {
            return allBooks.splice(index, 1)[0];
        }
        return { id: parseInt(id) };
    } catch (error) {
        console.error('Error deleting book:', error);
        showNotification(`❌ Failed to delete book: ${error.message}`, 'error');
        throw error;
    } finally {
        showLoading(false);
    }
}

async function updateBookStatus(id, status) {
    try {
        showLoading(true);
        const updatedBook = await HttpClient.put(`/${id}/status`, { status });
        
        // Update local cache
        const index = allBooks.findIndex(book => book.id === parseInt(id));
        if (index !== -1) {
            allBooks[index] = { ...allBooks[index], status };
        }
        
        return updatedBook;
    } catch (error) {
        console.error('Error updating book status:', error);
        showNotification(`❌ Failed to update status: ${error.message}`, 'error');
        throw error;
    } finally {
        showLoading(false);
    }
}

async function getBookStats() {
    try {
        const stats = await HttpClient.get('/stats');
        return stats;
    } catch (error) {
        console.error('Error fetching stats:', error);
        // Fallback to client-side calculation
        const totalBooks = allBooks.length;
        const availableBooks = allBooks.filter(book => book.status === 'available').length;
        const borrowedBooks = allBooks.filter(book => book.status === 'borrowed').length;
        const maintenanceBooks = allBooks.filter(book => book.status === 'maintenance').length;
        
        return {
            totalBooks,
            availableBooks,
            borrowedBooks,
            maintenanceBooks
        };
    }
}

// Dashboard Functions
async function loadDashboard() {
    try {
        showConnectionStatus('connecting');
        await getAllBooks();
        await updateStats();
        displayBooks(allBooks);
        showConnectionStatus('connected');
        showNotification('📚 Dashboard loaded successfully!', 'success');
    } catch (error) {
        showConnectionStatus('disconnected');
        showNotification('⚠️ Failed to connect to server. Please check if Spring Boot is running.', 'error');
    }
}

async function updateStats() {
    try {
        const stats = await getBookStats();
        
        document.getElementById('total-books').textContent = stats.totalBooks || 0;
        document.getElementById('available-books').textContent = stats.availableBooks || 0;
        document.getElementById('borrowed-books').textContent = stats.borrowedBooks || 0;
        document.getElementById('maintenance-books').textContent = stats.maintenanceBooks || 0;
    } catch (error) {
        console.error('Error updating stats:', error);
    }
}

function displayBooks(booksToShow) {
    const bookList = document.getElementById('bookList');
    
    if (booksToShow.length === 0) {
        bookList.innerHTML = `
            <div class="no-books">
                📚 No books found
                ${currentSearchTerm ? `<br><small>Try a different search term</small>` : ''}
                <br><small>Make sure your Spring Boot server is running on ${API_CONFIG.baseURL}</small>
            </div>
        `;
        return;
    }
    
    bookList.innerHTML = booksToShow.map(book => `
        <div class="book-card" data-book-id="${book.id}">
            <div class="book-header">
                <div class="book-title">${escapeHtml(book.title || 'Untitled')}</div>
                <div class="book-status status-${book.status || 'unknown'}">${book.status || 'unknown'}</div>
            </div>
            <div class="book-details">
                <div class="book-author">📝 ${escapeHtml(book.author || 'Unknown Author')}</div>
                <div class="book-genre">🏷️ ${escapeHtml(book.genre || 'Uncategorized')}</div>
                ${book.isbn ? `<div class="book-isbn">📖 ISBN: ${escapeHtml(book.isbn)}</div>` : ''}
                ${book.pages ? `<div class="book-pages">📄 ${book.pages} pages</div>` : ''}
                ${book.createdAt ? `<div class="book-date">📅 Added: ${new Date(book.createdAt).toLocaleDateString()}</div>` : ''}
            </div>
            <div class="book-actions">
                <select class="status-select" onchange="changeBookStatus(${book.id}, this.value)">
                    <option value="available" ${book.status === 'available' ? 'selected' : ''}>Available</option>
                    <option value="borrowed" ${book.status === 'borrowed' ? 'selected' : ''}>Borrowed</option>
                    <option value="maintenance" ${book.status === 'maintenance' ? 'selected' : ''}>Maintenance</option>
                </select>
                <button class="btn btn-danger btn-small" onclick="deleteBook(${book.id})">🗑️ Delete</button>
            </div>
        </div>
    `).join('');
}

async function refreshBooks() {
    currentSearchTerm = '';
    document.getElementById('searchInput').value = '';
    
    try {
        await getAllBooks();
        await updateStats();
        displayBooks(allBooks);
        showNotification('🔄 Books refreshed successfully!', 'success');
    } catch (error) {
        showNotification('❌ Failed to refresh books', 'error');
    }
}

async function searchBooks() {
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput.value.trim();
    currentSearchTerm = searchTerm;
    
    try {
        const results = await searchBooksAPI(searchTerm);
        displayBooks(results);
        
        if (searchTerm) {
            showNotification(`🔍 Found ${results.length} book(s) matching "${searchTerm}"`, 'info');
        }
    } catch (error) {
        showNotification('❌ Search failed', 'error');
    }
}

function clearSearch() {
    document.getElementById('searchInput').value = '';
    currentSearchTerm = '';
    displayBooks(allBooks);
    showNotification('🧹 Search cleared', 'info');
}

async function addBook(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    const bookData = {
        title: formData.get('title')?.trim(),
        author: formData.get('author')?.trim(),
        isbn: formData.get('isbn')?.trim(),
        genre: formData.get('genre')?.trim(),
        pages: formData.get('pages') ? parseInt(formData.get('pages')) : null
    };
    
    if (!bookData.title || !bookData.author) {
        showNotification('❌ Title and Author are required!', 'error');
        return;
    }
    
    try {
        const newBook = await addBookAPI(bookData);
        form.reset();
        
        await updateStats();
        
        // Refresh current view
        if (currentSearchTerm) {
            const results = await searchBooksAPI(currentSearchTerm);
            displayBooks(results);
        } else {
            displayBooks(allBooks);
        }
        
        showNotification(`✅ "${newBook.title}" added successfully!`, 'success');
    } catch (error) {
        // Error already handled in addBookAPI
    }
}

async function deleteBook(id) {
    if (!confirm('Are you sure you want to delete this book?')) {
        return;
    }
    
    try {
        const deletedBook = await deleteBookAPI(id);
        
        await updateStats();
        
        // Refresh current view
        if (currentSearchTerm) {
            const results = await searchBooksAPI(currentSearchTerm);
            displayBooks(results);
        } else {
            displayBooks(allBooks);
        }
        
        showNotification(`🗑️ Book deleted successfully!`, 'success');
    } catch (error) {
        // Error already handled in deleteBookAPI
    }
}

async function changeBookStatus(id, newStatus) {
    try {
        const updatedBook = await updateBookStatus(id, newStatus);
        await updateStats();
        showNotification(`📋 Book status changed to ${newStatus}`, 'success');
    } catch (error) {
        // Revert the select value on error
        const selectElement = document.querySelector(`[data-book-id="${id}"] .status-select`);
        if (selectElement) {
            const book = allBooks.find(b => b.id === parseInt(id));
            if (book) {
                selectElement.value = book.status;
            }
        }
    }
}

// Utility Functions
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showLoading(show) {
    const loadingIndicator = document.getElementById('loading-indicator') || createLoadingIndicator();
    loadingIndicator.style.display = show ? 'block' : 'none';
}

function createLoadingIndicator() {
    const loading = document.createElement('div');
    loading.id = 'loading-indicator';
    loading.innerHTML = '⏳ Loading...';
    loading.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 20px;
        border-radius: 8px;
        z-index: 9999;
        display: none;
    `;
    document.body.appendChild(loading);
    return loading;
}

function showConnectionStatus(status) {
    const statusElement = document.getElementById('connection-status') || createConnectionStatus();
    const statusConfig = {
        connected: { text: '🟢 Connected', color: '#2ed573' },
        connecting: { text: '🟡 Connecting...', color: '#ffa502' },
        disconnected: { text: '🔴 Disconnected', color: '#ff4757' }
    };
    
    const config = statusConfig[status] || statusConfig.disconnected;
    statusElement.textContent = config.text;
    statusElement.style.color = config.color;
}

function createConnectionStatus() {
    const status = document.createElement('div');
    status.id = 'connection-status';
    status.style.cssText = `
        position: fixed;
        top: 10px;
        left: 10px;
        font-size: 12px;
        font-weight: bold;
        z-index: 1000;
    `;
    document.body.appendChild(status);
    return status;
}

function showNotification(message, type = 'info') {
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#ff4757' : type === 'success' ? '#2ed573' : '#3742fa'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        font-weight: 500;
        max-width: 300px;
        word-wrap: break-word;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    loadDashboard();
    
    // Add enter key support for search
    document.getElementById('searchInput').addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            searchBooks();
        }
    });
});

// Export functions for global access
window.refreshBooks = refreshBooks;
window.searchBooks = searchBooks;
window.clearSearch = clearSearch;
window.addBook = addBook;
window.deleteBook = deleteBook;
window.changeBookStatus = changeBookStatus;