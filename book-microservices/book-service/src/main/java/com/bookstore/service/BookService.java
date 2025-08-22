package com.bookstore.service;

import com.bookstore.model.Book;
import com.bookstore.repository.BookRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class BookService {
    private static final String PRICE_QUESTION = "provide price for book ";
    private static final String BY = " by ";
    @Autowired
    private BookRepository bookRepository;
    
    public List<Book> getAllBooks() {
        return bookRepository.findAll().stream()
                .peek(book -> book.setPrice(getBookPrice(book.getTitle(), book.getAuthor())))
                .collect(Collectors.toList());
    }

    public Optional<Book> getBookById(Long id) {
        return bookRepository.findById(id).map(book -> {
            book.setPrice(getBookPrice(book.getTitle(), book.getAuthor()));
            return book;
        });
    }
    
    public List<Book> searchBooks(String search) {
        if (search == null || search.trim().isEmpty()) {
            return getAllBooks();
        }
        return bookRepository.findBySearchTerm(search);
    }
    
    public Book saveBook(Book book) {
        return bookRepository.save(book);
    }
    
    public void deleteBook(Long id) {
        bookRepository.deleteById(id);
    }

    public String getBookPrice(Book bookDetails) {
        return getBookPrice(bookDetails.getTitle(), bookDetails.getAuthor());
    }

    private String getBookPrice(String title, String author) {
        return extractPrice(CommandRunner.askAi(PRICE_QUESTION + title + BY + author));
    }

    private String extractPrice(String price) {
        Pattern pattern = Pattern.compile("\\$\\d+(\\.\\d{2})?");
        Matcher matcher = pattern.matcher(price);
        if (matcher.find()) {
            return matcher.group();
        }
        return null;
    }
}