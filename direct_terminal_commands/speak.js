module.exports = {
    data: {
        name: "speak"
    },
    execute: async (text,client) => {
        const split = text.split(' ')

        if(split.length < 3){
            throw new Error("Missing parameters: speak <channelId> <message>")
        }
        const substr = split.slice(2)

        const message = substr.join(" ")
        const channelId = split[1]

        /**
         *
         * @type {TextChannel}
         */
        const channel = await client.channels.fetch(channelId)

        if(!channel){
            throw new Error("Channel not found: speak <channelId> <message>")
        }

        if(!channel.isTextBased()){
            throw new Error("Channel Type Mismatch: is not text-based")
        }
        await channel.send(message).catch(error => {
            console.error(error)
            console.error("Perhaps check for permissions?")
        })
        console.log('[SPEAK] Sent!')

    },
    init: async(client) => {
    }
}