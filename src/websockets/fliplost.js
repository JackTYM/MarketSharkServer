const axios = require('axios')
const { Client, SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, AttachmentBuilder, } = require('discord.js');

const { abbreviateNumber, all, calculateBINTax, get, run } = require("../util")
module.exports = async function (messageJSON, socket, sessions, clients, client, tier, flipBeef) {
    const flip = JSON.parse(messageJSON.message)

    if (flip.uuid) {
        const flipObj = {
            key: messageJSON.key,
            uuid: flip.uuid,
        }
        flipBeef.push(flipObj);
        setTimeout(() => {
            flipBeef = flipBeef.filter(item => item.uuid !== flip.uuid)
            console.log(`Removed flip beef ${flip.uuid} len ${flipBeef.length}`);
        }, 30000);
    }
};