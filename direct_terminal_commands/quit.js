
module.exports = {
    data: {
        name: "quit"
    },
    execute: async (text,client) => {
        process.exit(0)
    },
    init: async(client) => {
    }
}