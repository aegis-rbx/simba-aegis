const {SlashCommandBuilder} = require("discord.js");
const axios = require('axios').default

const PRESHARED_AAA_KEY = "YOUR_PRESHARED_KEY"

const YOUR_DIVISION_OR_DEPARTMENT = "YOUR_DIVISION_OR_DEPARTMENT";

const AAA_REQUESTS_URL = "https://pilotrequests.aegisaviation.whatisaweb.site";

module.exports = {
    data: new SlashCommandBuilder().setName("pilot").setDescription("Contact an AAA pilot").addStringOption(o => {
        return o.setName('reason').setDescription("The reason for your request").setRequired(true)
    }),

    execute: async (interaction) => {
        await interaction.deferReply()
        const { options } = interaction;
        const reason = options.getString("reason", true)
        
        await axios.post(AAA_REQUESTS_URL,
            {
                presharedkey: PRESHARED_AAA_KEY,
                div: YOUR_DIVISION_OR_DEPARTMENT,
                reason: reason,
                member: interaction.member.id
            }
        )
        import('boxen').then( b => {
            console.log(`[PILOTREQ] ${interaction.member.id} requested pilots at ${new Date().getTime()} with reason:\n`+
            b.default(reason,{
                padding:1
            }))
        })

    },

    init: async(client) => {
        console.log('[PILORREQ] PilotRequests loaded')
    }
}