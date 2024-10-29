const uuid = require('uuid');

const { Client, SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, AttachmentBuilder, } = require('discord.js');
const { abbreviateNumber, all, calculateBINTax, get, run } = require("../util")

module.exports = async function (messageJSON, socket, serviceClients, client, tier) {
    socket.send(JSON.stringify({
        "type": "LoggedIn",
        "message": (await get(`SELECT * FROM keys WHERE key = ?`, [messageJSON.key])).username
    }));
};