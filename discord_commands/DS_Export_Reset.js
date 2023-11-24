const {SlashCommandBuilder, BaseInteraction, EmbedBuilder, ActionRowBuilder,  ButtonBuilder, ButtonStyle, TextChannel} = require("discord.js");
const JSONdb = require('simple-json-db');
const db_main =  new JSONdb(`./user_data/dutystates.json`);
const dbExport = new JSONdb(`./user_data/dutystates_export.json`);
const rolesToSeparate = ["777794213349687306", "870042153278140498"]

module.exports = {
    data: new SlashCommandBuilder().setName('resetquota').setDescription('Reset ALL DSes and generate a report').addBooleanOption(option => option.setName('confirm').setDescription('Are you SURE? This cannot be reversed').setRequired(true)),
    /**
     *
     * @param interaction BaseInteraction
     * @returns {Promise<void>}
     */
    execute: async (interaction) => {
        await interaction.deferReply()
        const db = interaction.client.dutystate_db
        const confirm = interaction.options.get('confirm').value
        if(!confirm){
            interaction.editReply("Not confirmed, disregarding.")
            return
        }
        console.log("[DS_DISCORD_ADMIN]")
        await import('boxen').then(b => {
            console.warn(b.default(`Quota reset initiated by ${interaction.member.id} at ${new Date().getTime()}`,{padding:1}))
        })
        const currentDBState = db.JSON()
        dbExport.set(new Date().getTime()+"-export", currentDBState)
        const entries = Object.keys(currentDBState)
        const profiles = entries.filter((entry) => {
            return entry.startsWith("profile-")
        })

        const guild = interaction.guild
        const guildMembers = guild.members

        const memberList = []
        for(const profile of profiles){
            const id = (profile.split("-"))[1]
            const guildmember = await guildMembers.fetch(id)
            if(guildmember){
                memberList.push({
                    id:id,
                    profile: profile,
                    guildmember: guildmember
                })
            }
        }

        const reports = []
        for(const roleId of rolesToSeparate){
            for(const member of memberList){
                if(member.guildmember.roles.resolve(roleId)){
                    const profile = db.get("profile-"+member.id)
                    let str = `<@${member.id}>: ${profile.accepted}`
                    if(profile.graded>0){
                        str += ` (Graded: ${profile.graded})`
                    }
                    if(profile.pending>0){
                        str += ` (Pending: ${profile.pending})`
                    }
                    reports.push([roleId, str + "\n"])
                }
                else{
                    console.log(member.id)
                }
            }
        }

        await interaction.editReply("Report generated!")
        for(const report of reports){
            await interaction.followUp(`### <@&${report[0]}>:\n${report[1]}`)
        }

        if(reports.length == 0){
            interaction.followUp("Reporting filtered zero members: Nothing to report")
        }

        db.deleteAll()
    },
    init: async (client)=> {
        client.dutystate_db = db_main
    }



}