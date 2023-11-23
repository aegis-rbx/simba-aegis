module.exports = {
    data: {
        name: "hi"
    },
    execute: async (client) => {
        console.log('HELLO!')
    },
    init: async(client) => {
        console.log("[HI] Loading....")
        console.log("[HI] LOADED!!!")
    }
}