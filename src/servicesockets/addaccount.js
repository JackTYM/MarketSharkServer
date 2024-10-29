const uuid = require('uuid');

const { Client, SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, AttachmentBuilder, } = require('discord.js');
const { abbreviateNumber, all, calculateBINTax, get, run, authorizeUser, checkUser } = require("../util")

module.exports = async function (messageJSON, socket, serviceClients, client, tier) {
    const oauth_link = await authorizeUser();

    const key = await get(`SELECT *
                                   FROM keys
                                   WHERE key = ?`, [messageJSON.key])

    socket.send(JSON.stringify({
        "type": "AuthenticateAccount",
        "message": oauth_link.message
    }));

    const mcInfo = await checkUser(messageJSON.key, oauth_link.deviceCode);

    if (await get(`SELECT *
                           FROM minecraft_sessions
                           WHERE key = ?
                             AND uuid = ?`, [messageJSON.key, mcInfo.mcInfo.uuid])) {
        run(`UPDATE minecraft_sessions
                     SET username      = ?,
                         uuid          = ?,
                         ssid          = ?,
                         refresh_token = ?
                     WHERE key = ?`, [mcInfo.mcInfo.username, mcInfo.mcInfo.uuid, mcInfo.accessToken, mcInfo.refreshToken, messageJSON.key]);
    } else {
        run(`INSERT INTO minecraft_sessions (key, username, uuid, ssid, refresh_token)
                     VALUES (?, ?, ?, ?,
                             ?)`, [messageJSON.key, mcInfo.mcInfo.username, mcInfo.mcInfo.uuid, mcInfo.accessToken, mcInfo.refreshToken]);
    }

    socket.send(JSON.stringify({
        "type": "AccountLoggedIn",
        "message": mcInfo.mcInfo.username
    }));
};