# The simple bot application
***
You can use this project to develop your own discord applications. 
This project uses [the discord.js guide](discord.js.guide) as a guide for its structure.

Its features include:
- A modular structure for all your code.
- Natively supports discord slash commands.
- Supports CRON jobs as modules for repetitive tasks.
- Supports terminal commands in a CLI. Terminal commands are added as modules too.

### Config/Setup:
- Put bot token in `config.json`. Also fill up `deployment.json` for the next step.
- Run `npm run deploy-commands` to push your slash commands. Only redo this step if you change your commands, this is a one time setup otherwise.

### Running:
- Run `npm run start` to start the bot.

## Notes
***

### Discord commands:
- Each command is defined in a js file in the `discord_commands` server.
- The name of the file doesn't matter, as long as it ends in `.js`
- The file structure must match the `command.js.example` you can find in the folder
- Each file must have a `module.exports` that exports 3 properties: `data`, `execute` and `init`.
- `data` must be an object of SlashCommandBuilder() that will be used to register the command with discord.
- `init` and `execute` are async functions.
- `init` is called when the bot is starting and it is provided with an instance the discord client as its parameter.
- `execute` is called when an interaction for this command is received. The interaction object is passed into it.
- For non-slash commands (buttoninteractions, etc) the customId of the interaction is used to figure out which command needs to be run.
- The structure of the customId must be `commandname-blablabla` where commandname is the same as the name set in your module.exports.data for non-slash interactions.

### Terminal commands:
- Placed in `direct_terminal_commands`
- module.exports must still contain `data`. `execute` and `init`.
- `execute` and `init` are called with (client) and (text, client) where text is the raw text from the command line.
- `data` must be an object with property `name`.
- See `direct_terminal_commands/example.js`

### CRON Jobs:
- Placed in `jobs`
- Same documentation as Terminal commands, with the following changes:
- `execute` is now only called with `client`
- `data` must also have a property `cron` that is a CRON string to schedule the job.

GL!
