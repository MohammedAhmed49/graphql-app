const { buildSchema } = require("graphql");

module.exports = buildSchema(`
    type RootQuery {
        hello: User
    }

    type User {
        name: String!
        age: Int!
    }
    
    schema {
        query: RootQuery
    }
`);
