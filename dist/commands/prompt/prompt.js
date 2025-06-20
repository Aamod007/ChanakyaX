"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const queue_1 = __importDefault(require("../../queue/queue"));
const queue = new queue_1.default();
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('prompt')
        .setDescription('Send a prompt to our uncensored llama2')
        .addStringOption(option => option.setName('input')
        .setDescription('The prompt to send')
        .setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral });
        queue.addItem(interaction);
    }
};
