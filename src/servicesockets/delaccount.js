const uuid = require('uuid');

const { Client, SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, AttachmentBuilder, } = require('discord.js');
const { abbreviateNumber, all, calculateBINTax, get, run, authorizeUser, checkUser } = require("../util")

module.exports = async function (messageJSON, socket, serviceClients, client, tier) {
    if (await get(`SELECT *
                           FROM minecraft_sessions
                           WHERE key = ?
                             AND username = ?`, [messageJSON.key, messageJSON.message])) {
        run(`DELETE FROM minecraft_sessions
                     WHERE key = ? AND username = ?`, [messageJSON.key, messageJSON.message]);

        socket.send(JSON.stringify({
            "type": "DeletedAccount",
            "message": messageJSON.message
        }));
    } else {
        socket.send(JSON.stringify({
            "type": "AccountNotFound",
            "message": messageJSON.message
        }));
    }
};