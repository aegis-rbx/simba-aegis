const {SlashCommandBuilder, BaseInteraction, EmbedBuilder, ActionRowBuilder,  ButtonBuilder, ButtonStyle, TextChannel} = require("discord.js");
const JSONdb = require('simple-json-db');
const db_main = new JSONdb('./user_data/dutystates.json');
const roleForGrading = "777794213349687306" //Testing role ID, replace with your updater role in prod
const channelToPost = "777566574772092981" //Replace with duty state channel in prod
module.exports = {
    data: new SlashCommandBuilder().setName('ds').setDescription('Post a duty state').addStringOption( option => option.setName('link').setDescription('Message link to duty state')),
    /**
     *
     * @param interaction BaseInteraction
     * @returns {Promise<void>}
     */
    execute: async (interaction) => {
        await interaction.deferReply({ephemeral:true})
        const db = interaction.client.dutystate_db
        let profile = db.get('profile-'+interaction.member.id)
        if (interaction.isChatInputCommand()) {
            const link = interaction.options.get('link')?.value
            if(!link){
                if(!profile){
                    await interaction.editReply('You have submitted no duty states recently')
                    return
                }
                let embed = new EmbedBuilder()
                    .setDescription(`Accepted: ${profile.accepted}\nRejected: ${profile.rejected}\nPending: ${profile.pending}\nGraded: ${profile.graded}`)
                    .setTitle('Your stats')
                    .setFooter({
                        iconURL: "https://images-ext-1.discordapp.net/external/Ypa_nRim_Cn6KmGSsowaKsHDsRBSo3a_obEA55v4KI8/%3Fsize%3D4096/https/cdn.discordapp.com/icons/412291659347263498/d92fc6fd1b558cbf5fd09ed90212a5b3.png",
                        text:"DS processor",
                    })
                    .setColor(0x000000)
                await interaction.editReply({embeds:[embed]})
                return
            }

            if(!link.startsWith("https://discord.com/channels/412291659347263498/512305048038932480/")){
                await interaction.editReply("Only message links from the main AEGIS server are valid!")
                return
            }

            if(!profile){
                profile = {
                    accepted: 0,
                    rejected: 0,
                    pending: 1,
                    graded: 0,
                    links: link
                }
            }
            else{
                if(profile.links.includes(link)){
                    await interaction.editReply("Reposting of the same link isn't allowed!")
                    return
                }
                profile.pending += 1
            }

            if(!link.startsWith("https://discord.com/channels/412291659347263498/512305048038932480/")){
                await interaction.editReply("Only message links from the main AEGIS server are valid!")
                return
            }
            let dsChannel = await interaction.client.channels.fetch(channelToPost)
            if(!dsChannel.isTextBased){
                return
            }
            let embed = new EmbedBuilder()
                .setDescription(`From: <@${interaction.member.id}>\nLink: ${link}`)
                .setTitle('New DS posted')
                .setFooter({
                    iconURL: "https://images-ext-1.discordapp.net/external/Ypa_nRim_Cn6KmGSsowaKsHDsRBSo3a_obEA55v4KI8/%3Fsize%3D4096/https/cdn.discordapp.com/icons/412291659347263498/d92fc6fd1b558cbf5fd09ed90212a5b3.png",
                    text:"DS processor",
                })
                .setColor(0xfaa61a)
            const timestamp = new Date().getTime()
            const confirm = new ButtonBuilder()
                .setCustomId('ds-'+timestamp+'-acc')
                .setLabel('Accept')
                .setStyle(ButtonStyle.Success)

            const cancel = new ButtonBuilder()
                .setCustomId('ds-'+timestamp+'-rej')
                .setLabel('Reject')
                .setStyle(ButtonStyle.Danger)
            const acRow = new ActionRowBuilder().addComponents([confirm, cancel])
            const message = await dsChannel.send({
                embeds:[embed],
                components:[acRow]
            })

            db.set('ds-'+timestamp, {
                user : interaction.member.id,
                state : 'pending',
                link: link,
                message: message.id
            })

            db.set('profile-'+interaction.member.id, profile)

            await interaction.editReply('Sent, please wait for an authorised user to grade it!')
            return
        }


        if(!interaction.member.roles.resolve(roleForGrading)){
            interaction.editReply('You do not have the required role')
            return
        }

        const rawId = interaction.customId
        const splitId = rawId.split('-')
        const dbId = splitId[0] + "-" + splitId[1]
        const cmd = splitId[2]

        const dbEntry = db.get(dbId)
        if(!dbEntry){
            await interaction.editReply('Not present in DB. Perhaps quota was reset?')
        }
        if(dbEntry.state === 'pending'){
            const accept = (cmd === 'acc')
            dbEntry.state = accept?"accepted":"rejected"
            db.set(dbId, dbEntry)
            /**
             * @type {TextChannel}
             */
            const channel = await interaction.client.channels.fetch(channelToPost)
            const message = await channel.messages.fetch(dbEntry.message)
            if(!message){
                await interaction.editReply('Message no longer exists')
                return
            }
            let embed = new EmbedBuilder()
                .setDescription(`From: <@${dbEntry.user}>\nLink: ${dbEntry.link}\n\nGraded by: <@${interaction.member.id}>`)
                .setTitle("Duty State")
                .setFooter({
                    iconURL: "https://images-ext-1.discordapp.net/external/Ypa_nRim_Cn6KmGSsowaKsHDsRBSo3a_obEA55v4KI8/%3Fsize%3D4096/https/cdn.discordapp.com/icons/412291659347263498/d92fc6fd1b558cbf5fd09ed90212a5b3.png",
                    text:"DS processor",
                })
                .setColor((accept)?0x33bd66:0xff4c3f)
            const button = new ButtonBuilder()
                .setCustomId('nocom')
                .setLabel((accept)?"Accepted":"Rejected")
                .setStyle((accept)?ButtonStyle.Success:ButtonStyle.Danger)
                .setDisabled(true)
            const acRow = new ActionRowBuilder().addComponents([button])
            message.edit({
                embeds: [embed],
                components:[acRow]
            })
            let graderprofile = profile
            if(!profile){
                graderprofile = {
                    accepted: 0,
                    rejected: 0,
                    pending: 0,
                    graded: 1,
                    links: ""
                }
            }
            else{
                graderprofile.graded++
            }

            db.set("profile-"+interaction.member.id,graderprofile)

            //profile actually refers to the GRADERs profile so we reassign it here to the members profile
            profile = db.get("profile-" + dbEntry.user)
            profile.pending--
            if(accept){
                profile.accepted++;
            }
            else{
                profile.rejected++;
            }

            db.set("profile-" + dbEntry.user, profile)

            await interaction.editReply('Graded!')
            await channel.send(`https://discord.com/channels/${interaction.guild.id}/${channelToPost}/${dbEntry.message} from <@${dbEntry.user}> graded by <@${interaction.member.id}>`)
        }
        else{
            await interaction.editReply('Already graded!')
            return
        }
    },
    init: async(client) => {
        client.dutystate_db = db_main
    }
}