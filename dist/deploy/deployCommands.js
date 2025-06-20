"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const BOT_TOKEN = process.env.DISCORD_LLM_BOT_TOKEN;
const CLIENT_ID = process.env.DISCORD_LLM_BOT_CLIENT_ID;

const deploy = async () => {
    const commands = [];
    const foldersPath = path_1.default.join(__dirname, '../commands');
    const commandFolders = fs_1.default.readdirSync(foldersPath);
    for (const folder of commandFolders) {
        const commandsPath = path_1.default.join(foldersPath, folder);
        const commandFiles = fs_1.default.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
        
        for (const file of commandFiles) {
            const filePath = path_1.default.join(commandsPath, file);
            const command = require(filePath);
            if ('data' in command && 'execute' in command) {
                commands.push(command.data.toJSON());
            }
            else {
                console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
            }
        }
    }
    
    const rest = new discord_js_1.REST().setToken(BOT_TOKEN ?? "");
    (async () => {
        try {
            console.log(`Started refreshing ${commands.length} application (/) commands.`);
            const data = await rest.put(discord_js_1.Routes.applicationCommands(CLIENT_ID ?? ""), { body: commands });
            console.log(`Successfully reloaded ${data.length} application (/) commands.`);
        }
        catch (error) {
            console.error(error);
        }
    })();
};
exports.default = deploy;
