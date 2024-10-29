const uuid = require('uuid');
const fs = require('fs');
const { Client, SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, AttachmentBuilder, } = require('discord.js');

const { abbreviateNumber, all, calculateBINTax, get, run } = require("../util");
const { file } = require('googleapis/build/src/apis/file');
module.exports = async function (messageJSON, socket, sessions, clients, client, tier, flipBeef) {
    const key = await get(`SELECT * FROM keys WHERE key = ?`, [messageJSON.key]);

    if (key != null) {
        const log = JSON.parse(messageJSON.message).map(code => String.fromCharCode(code)).join('');

        const filepath = `./${key.username}-buglog-${messageJSON.username}.txt`;

        fs.writeFileSync(filepath, log);

        const guild = await client.guilds.fetch("1242568898868412416");
        const channel = await guild.channels.fetch("1264027656450478111");

        try {
            fs.rmSync(filepath);
        } catch (e) { }
    }
};
