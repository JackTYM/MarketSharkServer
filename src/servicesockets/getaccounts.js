const uuid = require('uuid');

const { Client, SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, AttachmentBuilder, } = require('discord.js');
const { abbreviateNumber, all, calculateBINTax, get, run } = require("../util")

module.exports = async function (messageJSON, socket, serviceClients, client, tier) {
    var message = [];

    for (const acc of await all(`SELECT * FROM minecraft_sessions WHERE key = ?`, [messageJSON.key])) {
        message.push(acc.username);
    }

    socket.send(JSON.stringify({
        "type": "AccountList",
        "message": JSON.stringify(message)
    }));
};