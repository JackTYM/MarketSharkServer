const uuid = require('uuid');
const fs = require('fs');
const { Client, SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, AttachmentBuilder, } = require('discord.js');

const { abbreviateNumber, all, calculateBINTax, get, run } = require("../util");
module.exports = async function (messageJSON, socket, sessions, clients, client, tier, flipBeef) {

    return;
    const config = await get(`SELECT * FROM configs WHERE id = ?`, [messageJSON.message]);
    const key = await get(`SELECT * FROM keys WHERE key = ?`, [messageJSON.key]);

    if (config) {
        await run(`UPDATE keys SET config_id = ?, config_last_updated = ? WHERE key = ?`, [messageJSON.message, Date.now(), messageJSON.key])

        socket.send(JSON.stringify({
            "type": "ConfigSync",
            "config": JSON.parse(config.config),
            "configId": messageJSON.message,
            "oldConfigId": key.config_id,
        }));
    } else {
        socket.send(JSON.stringify({
            "type": "ConfigLoadMissing"
        }));
    }
};