const {SlashCommandBuilder} = require("discord.js");
const path = require("node:path");
const fs = require("node:fs");
module.exports = {
    data: new SlashCommandBuilder().setName('reload').setDescription('Reload all discord commands (CRON jobs ignored)'),
    execute: async (interaction) => {
        await interaction.deferReply({ephemeral:true})
        const client = interaction.client
        const commandsPath = path.join(__dirname, '')
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'))
        console.log("[CORE] Loading modules...")
        let cmds = 0
        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file)
            delete require.cache[require.resolve(filePath)]
            const command = require(filePath)
            // Set a new item in the Collection with the key as the command name and the value as the exported module
            if ('data' in command && 'execute' in command) {
                if('init' in command){
                    try{
                        await command.init(client).then(() => {
                            client.commands.set(command.data.name, command)
                            console.log('[CORE] Registered command: '+ command.data.name)
                            cmds++
                        }).catch(error => {
                            console.error(error)
                            console.error("[CORE] Unable to register command: "+ command.data.name)
                        })
                    }
                    catch(error){
                        console.error(error)
                    }
                }
            } else {
                console.warn(`[CORE | WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`, )
            }
        }

        await interaction.editReply("Reloaded " + cmds + " files")
    },
    init: async () => {

    }
}