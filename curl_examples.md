# BookController API - Curl Examples

This document provides comprehensive curl examples for testing the Book Microservice REST API endpoints.

## Base URL
```
http://localhost:8080/api/books
```

---

## 📚 GET Endpoints

### 1. Get All Books
Retrieve all books in the collection.

```bash
curl -X GET http://localhost:8080/api/books 
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
[
  {
    "id": 1,
    "title": "The Great Gatsby",
    "author": "F. Scott Fitzgerald",
    "isbn": "978-0-7432-7356-5",
    "genre": "Fiction",
    "pages": 180,
    "status": "available"
  }
]
```

### 2. Search Books
Search books by title, author, or ISBN.

```bash
# Search by title
curl -X GET "http://localhost:8080/api/books?search=gatsby" \
  -H "Content-Type: application/json"

# Search by author
curl -X GET "http://localhost:8080/api/books?search=fitzgerald" \
  -H "Content-Type: application/json"

# Search by ISBN
curl -X GET "http://localhost:8080/api/books?search=978-0-7432" \
  -H "Content-Type: application/json"

# Empty search (returns all books)
curl -X GET "http://localhost:8080/api/books?search=" \
  -H "Content-Type: application/json"
```

### 3. Get Book by ID
Retrieve a specific book by its ID.

```bash
# Get book with ID 1
curl -X GET http://localhost:8080/api/books/1 \
  -H "Content-Type: application/json"

# Get non-existent book (returns 404)
curl -X GET http://localhost:8080/api/books/999 \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n"
```

---

## ➕ POST Endpoints

### 4. Create New Book
Add a new book to the collection.

#### Basic Book Creation
```bash
curl -X POST http://localhost:8080/api/books \
  -H "Content-Type: application/json" \
  -d '{
    "title": "To Kill a Mockingbird",
    "author": "Harper Lee",
    "isbn": "978-0-06-112008-4"
  }'
```

#### Complete Book Creation
```bash
curl -X POST http://localhost:8080/api/books \
  -H "Content-Type: application/json" \
  -d '{
    "title": "1984",
    "author": "George Orwell",
    "isbn": "978-0-452-28423-4",
    "genre": "Dystopian Fiction",
    "pages": 328,
    "status": "available"
  }'
```

#### Programming Book Example
```bash
curl -X POST http://localhost:8080/api/books \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Clean Code",
    "author": "Robert C. Martin",
    "isbn": "978-0-13-235088-4",
    "genre": "Programming",
    "pages": 464,
    "status": "available"
  }'
```

#### Book Without ISBN
```bash
curl -X POST http://localhost:8080/api/books \
  -H "Content-Type: application/json" \
  -d '{
    "title": "The Catcher in the Rye",
    "author": "J.D. Salinger",
    "genre": "Fiction",
    "pages": 277
  }'
```

---

## ✏️ PUT Endpoints

### 5. Update Existing Book
Update a book's information.

#### Update All Fields
```bash
curl -X PUT http://localhost:8080/api/books/1 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "The Great Gatsby - Updated Edition",
    "author": "F. Scott Fitzgerald",
    "isbn": "978-0-7432-7356-5",
    "genre": "Classic Fiction",
    "pages": 180,
    "status": "borrowed"
  }'
```

#### Update Only Status
```bash
curl -X PUT http://localhost:8080/api/books/1 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "The Great Gatsby",
    "author": "F. Scott Fitzgerald",
    "isbn": "978-0-7432-7356-5",
    "genre": "Fiction",
    "pages": 180,
    "status": "maintenance"
  }'
```

#### Update Book to Available
```bash
curl -X PUT http://localhost:8080/api/books/2 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "1984",
    "author": "George Orwell",
    "isbn": "978-0-452-28423-4",
    "genre": "Dystopian Fiction",
    "pages": 328,
    "status": "available"
  }'
```

#### Update Non-existent Book (returns 404)
```bash
curl -X PUT http://localhost:8080/api/books/999 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Non-existent Book",
    "author": "Unknown Author"
  }' \
  -w "\nHTTP Status: %{http_code}\n"
```

---

## 🗑️ DELETE Endpoints

### 6. Delete Book
Remove a book from the collection.

```bash
# Delete book with ID 1
curl -X DELETE http://localhost:8080/api/books/1 \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n"

# Delete book with ID 2
curl -X DELETE http://localhost:8080/api/books/2 \
  -H "Content-Type: application/json"

# Try to delete non-existent book (returns 404)
curl -X DELETE http://localhost:8080/api/books/999 \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n"
```

---

## 🧪 Test Scenarios

### Complete CRUD Workflow
Test the complete lifecycle of a book:

```bash
echo "=== Creating a new book ==="
BOOK_ID=$(curl -s -X POST http://localhost:8080/api/books \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Spring Boot in Action",
    "author": "Craig Walls",
    "isbn": "978-1-61729-120-3",
    "genre": "Programming",
    "pages": 424,
    "status": "available"
  }' | jq -r '.id')

echo "Created book with ID: $BOOK_ID"

echo -e "\n=== Reading the book ==="
curl -s -X GET http://localhost:8080/api/books/$BOOK_ID \
  -H "Content-Type: application/json" | jq '.'

echo -e "\n=== Updating the book status ==="
curl -s -X PUT http://localhost:8080/api/books/$BOOK_ID \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Spring Boot in Action",
    "author": "Craig Walls",
    "isbn": "978-1-61729-120