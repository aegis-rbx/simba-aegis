const {SlashCommandBuilder} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder().setName('hi').setDescription('Say Hi!'),

    execute: async (interaction) => {
        interaction.reply('YO!')
    },

    init: async(client) => {
        console.log("[HI] Loading....")
        console.log("[HI] LOADED!!!")
    }
}