// src/graphql/typeDefs/address.typeDefs.js
const { gql } = require("graphql-tag");

module.exports = gql`
  type Address {
    id: ID!
    storeID: ID!
    areaName: String!
    city: String
    pincode: String
    isActive: Boolean
    createdAt: String
    updatedAt: String
  }

  input AddressInput {
    storeID: ID!
    areaName: String!
    city: String
    pincode: String
  }

type Query {
  getAddresses: [Address]
  getAddress(id: ID!): Address
}


  type Mutation {
    createAddress(input: AddressInput!): Address
    deleteAddress(id: ID!): Boolean
    toggleAddress(id: ID!): Address
  }
`;
