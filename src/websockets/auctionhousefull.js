const uuid = require('uuid');

const { Client, SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, AttachmentBuilder, } = require('discord.js');

const { abbreviateNumber, all, calculateBINTax, get, run } = require("../util")
module.exports = async function (messageJSON, socket, sessions, clients, client, tier, flipBeef) {
    const key = await get(`SELECT * FROM keys WHERE key = ?`, [messageJSON.key])
    const guild = await client.guilds.fetch(key.guild)
    const channel = await guild.channels.fetch(key.channel)

    await channel.send({
        content: `<@${key.discordid}>`, embeds: [new EmbedBuilder()
            .setTitle("Auction House Full")
            .setDescription("Your Auction House is full!")
            .setColor(12273222)
            .setFooter({ text: "MarketShark - discord.gg/MMEyPYbhCj", iconURL: "https://cdn.discordapp.com/icons/1247354052493443224/6d2f8af3b5ee55ba598e5f2ec1032cfc.webp?size=256" })
            .setTimestamp()
            .setAuthor({ name: messageJSON.username, iconURL: `https://mc-heads.net/avatar/${messageJSON.username}` })]
    })
};