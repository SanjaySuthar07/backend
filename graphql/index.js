// src/graphql/index.js
const addressTypeDefs = require("./typeDefs/address.typeDefs");
const addressResolvers = require("./resolvers/address.resolvers");

module.exports = {
    typeDefs: [addressTypeDefs],
    resolvers: [addressResolvers],
};
