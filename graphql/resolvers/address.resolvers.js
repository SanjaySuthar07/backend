// src/graphql/resolvers/address.resolvers.js
const Address = require("../../models/Address.model");

module.exports = {
    Query: {
        getAddresses: async () => {
            return await Address.find({
                isActive: true,
                $or: [
                    { storeID: { $exists: true } },
                    { ownerId: { $exists: true } }
                ]
            });
        },

        getAddress: async (_, { id }) => {
            return await Address.findById(id);
        },
    },

    Mutation: {
        createAddress: async (_, { input }) => {
            const address = new Address(input);
            return await address.save();
        },

        deleteAddress: async (_, { id }) => {
            await Address.findByIdAndDelete(id);
            return true;
        },

        toggleAddress: async (_, { id }) => {
            const address = await Address.findById(id);
            address.isActive = !address.isActive;
            return await address.save();
        },
    },
};
