const {SlashCommandBuilder, BaseInteraction} = require("discord.js");
const JSONdb = require('simple-json-db');
const db = new JSONdb('./user_data/dutystates.json');
const roleForGrading = ""
const channelToPost = ""
module.exports = {
    data: new SlashCommandBuilder().setName('ds').setDescription('Post a duty state').addStringOption( option => option.setName('link').setDescription('Message link to duty state')),
    /**
     *
     * @param interaction BaseInteraction
     * @returns {Promise<void>}
     */
    execute: async (interaction) => {
        await interaction.deferReply({ephemeral:true})
        if (interaction.isChatInputCommand()) {
            dsChannel = await interaction.client.channels.fetch(channelToPost)

        }
    },

    init: async(client) => {
        console.log("[HI] Loading....")
        console.log("[HI] LOADED!!!")
    }
}