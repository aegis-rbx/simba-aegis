const wctext = `
   _____ _____ __  __ ____                _____ ____  _____  ______ 
  / ____|_   _|  \\/  |  _ \\   /\\         / ____/ __ \\|  __ \\|  ____|
 | (___   | | | \\  / | |_) | /  \\ ______| |   | |  | | |__) | |__   
  \\___ \\  | | | |\\/| |  _ < / /\\ |______| |   | |  | |  _  /|  __|  
  ____) |_| |_| |  | | |_) / ____ \\     | |___| |__| | | \\ \\| |____ 
 |_____/|_____|_|  |_|____/_/    \\_\\     \\_____\\____/|_|  \\_|______|
                                                                    
 A simple discord bot app by notarib-catcher (ribcatcher)
                                                                    `
const copydisc = `
---------------NOTICE---------------
Copyright (c) 2023 "ribcatcher" (catcherofribs@gmail.com)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
------------------------------------
`

var unstable = false
var prefix_console = ">"
var prefix_all = "[UNSET]"

console.log(wctext)
console.warn(copydisc)
console.log("")

const fs = require('node:fs');
const path = require('node:path');

const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});

process.readLineHandler = readline


const { Client, Collection, Events, GatewayIntentBits, SnowflakeUtil } = require('discord.js');
const { token } = require('./config.json');
const cron = require('node-cron');

const client = new Client({
    intents:[
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildVoiceStates
    ],
    allowedMentions: {
        parse: ['roles','everyone','users'],
        repliedUser: true
    }
})

client.process_unstable = false
client.commands = new Collection()
client.jobs = new Collection()
client.terminal_commands = new Collection()


//wrapping the console in a termWrapper that lets us output stuff without disturbing the readline


console.originalLog = console.log
console.originalError = console.error
console.originalWarn = console.warn
console.originalInfo = console.info
console.originalDebug = console.debug
function termWrapper(out, type='log') {
    process.stdout.clearLine()
    process.stdout.cursorTo(0)
    if(typeof out === "string"){
        out = out.split("\n")
        for(let line of out){
            process.stdout.write(prefix_all)
            if(type === 'warn'){
                process.stdout.write("[WARN] ")
                console.originalWarn(line)
            }
            else if(type === 'error'){
                process.stdout.write("[ERROR] ")
                console.originalError(line)
            }
            else if(type === 'info'){
                console.originalInfo(line)
            }
            else if(type === 'debug'){
                console.originalDebug(line)
            }
            else{
                console.originalLog(line)
            }
        }
    }
    else{
        process.stdout.write(prefix_all)
        if(type === 'warn'){
            console.originalWarn(out)
        }
        else if(type === 'error'){
            console.originalError(out)
        }
        else if(type === 'info'){
            console.originalInfo(out)
        }
        else if(type === 'debug'){
            console.originalDebug(out)
        }
        else{
            console.originalLog(out)
        }
    }
    

    process.stdout.write(prefix_console + ' ')
}


async function start(){
    const commandsPath = path.join(__dirname, 'discord_commands')
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'))
    console.log("[CORE] Loading modules...")
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file)
        const command = require(filePath)
        // Set a new item in the Collection with the key as the command name and the value as the exported module
        if ('data' in command && 'execute' in command) {
            if('init' in command){
                try{
                    await command.init(client).then(() => {
                        client.commands.set(command.data.name, command)
                        console.log('[CORE] Registered command: '+ command.data.name)
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


    const cronPath = path.join(__dirname, 'jobs')
    const cronFiles = fs.readdirSync(cronPath).filter(file => file.endsWith('.js'))

    for (const file of cronFiles){
        const filePath = path.join(cronPath, file)
        const job = require(filePath)
        if('data' in job && 'execute' in job){

            if('init' in job){
                try{
                    await job.init(client).then(() => {
                        client.jobs.set(job.data.name, job)
                        console.log('[CORE] Registered cron job: '+ job.data.name)
                    }).catch(error => {
                        console.error(error)
                        console.error("[CORE] Unable to register cron job: "+ job.data.name)
                    })
                }
                catch(error){
                    console.error(error)
                }
            }
        }
        else{
            console.warn(`[CORE | WARNING] The job at ${filePath} is missing a required "data" or "execute" property.`)
        }
    }

    const termPath = path.join(__dirname, 'direct_terminal_commands')
    const termFiles = fs.readdirSync(termPath).filter(file => file.endsWith('.js'))

    for (const file of termFiles){
        const filePath = path.join(termPath, file)
        const tcommand = require(filePath)
        if('data' in tcommand && 'execute' in tcommand){
            console.log("[CORE] Registering terminal command: " + tcommand.data.name)
            if('init' in tcommand){
                try{
                    await tcommand.init(client).then(() => {
                        client.terminal_commands.set(tcommand.data.name, tcommand)
                        console.log('[CORE] Registered terminal command: '+ tcommand.data.name)
                    }).catch(error => {
                        console.error(error)
                        console.error("[CORE] Unable to register terminal command: "+ tcommand.data.name)
                    })

                }
                catch(error){
                    console.error(error)
                }
            }
        }
        else{
            console.warn(`[CORE | WARNING] The terminal command at ${filePath} is missing a required "data" or "execute" property.`)
        }
    }
    console.log("[CORE] Module inits called")
    console.log("[CORE | CRON] Starting CRON jobs")

    client.jobs.forEach( job => {
        if(cron.validate(job.data.cron)){
            cron.schedule(job.data.cron, async () => {
                try{
                    job.execute(client).catch(err => {
                        console.error(err)
                    })
                }
                catch(err){
                    console.error(err)
                }
            })
            console.log("[CORE | CRON] Scheduled "+job.data.name)
        }
        else{
            console.log("[CORE | CRON] Cannot schedule: "+job.data.name+" has invalid CRON timing string")
        }
    })

    console.log("[CORE | CRON] Started all jobs")
    setTimeout(initCommandLine, 1000)
}

async function initCommandLine(){
    console.log = (out) => {
        termWrapper(out)
    }

    console.warn = (out) => {
        termWrapper(out, 'warn')
    }

    console.error = (out) => {
        termWrapper(out, 'error')
    }

    console.info = (out) => {
        termWrapper(out, 'info')
    }

    console.debug = (out) => {
        termWrapper(out, 'debug')
    }
    readCommandLine()
    prefix_all = "[CORESTATE | STARTED] "
    console.log("[CORE] Startup Complete")
    prefix_all = "[CORESTATE | OK] "

}

async function readCommandLine(){
    readline.question('> ', async text =>  {
        let arr = text.split(' ')
        if(text.trim()){
            readCommandLine()
        }

        if(arr[0] == "help"){
            if(arr.length > 2){
                console.error("Usage: help [command name]")
                return
            }

            if(arr.length === 1){
                console.log("Available commands:\n-----")
                client.terminal_commands.map((val) => {
                    console.log(val.data.name)
                })
                console.log("-----\nhelp [command] for command-specific help")
                return
            }

            if(arr.length === 2){
                let command = client.terminal_commands.get(arr[1])

                if(!command){
                    console.error('No such command')
                    return
                }

                if(!command.data.help){
                    console.error('Command has no documentation')
                    return
                }
                console.log(arr[1] + "\n-----")

                console.log(command.data.help)
                console.log("-----\nUse help [command] for command-specific help or just 'help' for a list of commands")

            }

            return
        }

        let command = client.terminal_commands.get(arr[0])
        if(!command){
            console.error('No such command')
        }
        else {
            try {
                await command.execute(text, client).catch(error => {
                    console.error(error)
                })
            } catch (e) {
                console.error(e)
            }
        }
    });

}



client.on(Events.InteractionCreate, async (interaction) => {
    let commandName
    if (!interaction.isChatInputCommand()){
        const arr = interaction.customId.split('-')
        commandName = arr[0]
    }
    else{
        commandName = interaction.commandName
    }

    const command = client.commands.get(commandName);

    if (!command) {
        console.error(`[CORE | ERROR] No command matching ${commandName} was found.`);
        return;
    }

    try {
        await command.execute(interaction).catch(
            async (error) => {
                console.error(`[CORE | ${commandName} | ERROR] Runtime error encountered`)
                console.error(error);
                try{
                    if (interaction.replied || interaction.deferred) {
                        await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true })
                            .catch((error) => {
                                console.error("[CORE | ASYNC | EXCEPTION] Error handler reply - error.")
                                console.error(error)
                            });
                    } else {
                        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true })
                            .catch((error) => {
                                console.error("[CORE | ASYNC | EXCEPTION] Error handler reply - error.")
                                console.error(error)
                            })
                    }
                }
                catch(error){
                    console.error("[CORE | SYNC | EXCEPTION] Error handler reply - error.")
                    console.error(error)
                }
                
            }
        );
    } catch (error) {
        console.error(`[CORE | ${commandName} | ERROR] Runtime error encountered`)
        console.error(error);
        try{
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true })
                    .catch((error) => {
                        console.error("[CORE | ASYNC | EXCEPTION] Error handler reply - error.")
                        console.error(error)
                    });
            } else {
                await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true })
                    .catch((error) => {
                        console.error("[CORE | ASYNC | EXCEPTION] Error handler reply - error.")
                        console.error(error)
                    })
            }
        }
        catch(error){
            console.error("[CORE | SYNC | EXCEPTION] Error handler reply - error.")
            console.error(error)
        }
        
    }
})

client.on(Events.ClientReady, () => {
    console.log("[CORE] Logged in and ready!")
})
client.login(token)

process.on("uncaughtException", (exep) => {
    
    prefix_console = "[UNSTABLE] >"
    if(!prefix_all.includes("E-UE")){
        prefix_all = (prefix_all.includes("UNSTABLE"))? prefix_all.replace("]" , " | E-UE]"):"[CORESTATE | UNSTABLE | E-UE] "
    }
    console.error(exep)
    console.error("!!!UNCAUGHT EXCEPTION BUBBLED TO TOP OF EVENT LOOP!!!")
    try{
        client.process_unstable = true
    }
    catch(e){
        console.error("UNABLE TO MARK CLIENT AS UNSTABLE")
    }
    return
})

process.on("unhandledRejection", (exep) => {
    prefix_console = "[UNSTABLE] >"
    if(!prefix_all.includes("E-UR")){
        prefix_all = (prefix_all.includes("UNSTABLE"))? prefix_all.replace("]" , " | E-UR]"):"[CORESTATE | UNSTABLE | E-UR] "
    }
    console.error(exep)
    console.error("!!!UNHANDLED REJECTION BUBBLED TO TOP OF EVENT LOOP!!!")
    try{
        client.process_unstable = true
    }
    catch(e){
        console.error("UNABLE TO MARK CLIENT AS UNSTABLE")
    }
    return
})


setTimeout(start, 1000)
