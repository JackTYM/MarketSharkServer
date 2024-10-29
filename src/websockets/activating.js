const uuid = require('uuid');

const { Client, SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, AttachmentBuilder, } = require('discord.js');

const { abbreviateNumber, all, calculateBINTax, get, run } = require("../util")
module.exports = async function (messageJSON, socket, sessions, clients, client, tier, flipBeef) {
    let sessionId = messageJSON.session_id;
    if (!sessionId) {
        sessionId = uuid.v4();
    }

    if (clients[messageJSON.key]) {
        clients[messageJSON.key].send(JSON.stringify({
            "type": "FailedActivation",
            "message": "Failed activation. You have another active session!"
        }))
        clients[messageJSON.key].close()

        console.log("Duplicate session ended!")
    }

    clients[messageJSON.key] = socket;
    sessions[sessionId] = messageJSON.key;

    socket.send(JSON.stringify({
        "type": "Activated",
        "message": `Successfully activated with Discord under the account ${(await get(`SELECT * FROM keys WHERE key = ?`, [messageJSON.key])).username}!`,
        "session_id": sessionId
    }));
};