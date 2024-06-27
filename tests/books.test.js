process.env.NODE_ENV = 'test'

const request = require('supertest')

const app = require('../app')
const db = require('../db');
const { beforeEach, describe, default: test, afterEach } = require('node:test');
const { hasUncaughtExceptionCaptureCallback } = require('process');

let book_isbn;

beforeEach(async () => {
    let result = await db.query(`INSERT INTO books (isbn, amazon_url, author, language, pages, publisher, title, year) VALUES ('123456789', 'https://amazon.com/things', 'Bob', 'English', 234, 'unpublishes', 'a book', 2024) RETURNING isbn`)
    book_isbn = result.rows[0].isbn
})

describe('POST /books', function () {
    test('Create a book', async function () {
        const res = await request(app)
        .post('/books')
        .send({
            isbn: '876543',
            amazon_url: 'https://notAmazon.com',
            author: 'me',
            language: 'english',
            pages: 800,
            publisher: 'some guy',
            title: 'fun with testing',
            year: 1999
        })
        expect(res.statusCode).toBe(201)
        expect(res.body.book).toHaveProperty('isbn')
    })

    test('Book must have title', async function () {
        const res = await request(app)
            .post('/books')
            .send({year: 1})
        expect(res.statusCode).toBe(400)
    })
})

describe('GET /books', function() {
    test('Gets a book', async function() {
        const res = await request(app).get('/books')
        const books = res.body.books
        expect(books).toHaveLength(1)
        expect(books[0]).toHaveProperty('isbn')
    })
})

describe('GET /books/:isbn', function() {
    test('Gets a book', async function() {
        const res = await request(app)
            .get(`/books/${book_isbn}`)
        expect(res.body.isbn).toHaveProperty('isbn')
        expect(res.body.book).toBe(book_isbn)
    })
})

describe("PUT /books/:id", function() {
    test('update book', async function() {
        const res = await request(app)
            .put(`/books/${book_isbn}`)
            .send({
                amazon_url: 'https://notAmazon.com',
                author: 'me',
                lanuage: 'english',
                pages: 420,
                publisher: 'not me',
                title: 'changes here',
                year: 2
            })
            expect(res.body.book).toHaveProperty('isbn')
            expect(res.body.book.title).toBe('changes here')
    })
})

describe('DELETE /books/:id', function() {
    test('Deleting book', async function() {
        const res = await request(app)
            .delete(`/books/${book_isbn}`)
        expect(res.body).toEqual({message: 'Book deleted'})
    })
})

afterEach(async function() {
    await db.query('DELETE from books')
})

afterAll(async function() {
    await db.end()
})