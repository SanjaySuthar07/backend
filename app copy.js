const { ApolloServer } = require("@apollo/server");
const { expressMiddleware } = require("@apollo/server/express4");
const express = require("express");
const cors = require("cors");
const cookiePars = require("cookie-parser");
require("dotenv").config();

const app = express();

// 1. Standard Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookiePars());

// 2. REST API Routes
app.use("/api", require("./routes/main.route"));

// 3. GraphQL Setup
const typeDefs = `
  type Book {
    title: String
    author: String
  }

  type Query {
    books: [Book]
  }
`;


const books = [
    {
        title: 'The Awakening',
        author: 'Kate Chopin',
    },
    {
        title: 'City of Glass',
        author: 'Paul Auster',
    },
];

const resolvers = {
    Query: {
        books: () => books,
    },
};


const server = new ApolloServer({
    typeDefs,
    resolvers,
});

// IMPORTANT: Apollo 4 must be started before applying middleware
async function startApollo() {
    await server.start();

    // This is the URL to check: http://localhost:PORT/graphql
    app.use(
        '/graphql',
        expressMiddleware(server)
    );

    // 4. Error Handler (Must be at the very bottom)
    app.use((err, req, res, next) => {
        const statusCode = err.statusCode || 500;
        res.status(statusCode).json({
            success: false,
            message: err.message || "Internal Server Error",
            errors: err.errors || []
        });
    });
}

startApollo();

module.exports = app;