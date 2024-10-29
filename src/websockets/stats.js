const uuid = require('uuid');

const { Client, SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, AttachmentBuilder, } = require('discord.js');

const { abbreviateNumber, all, calculateBINTax, get, run } = require("../util")
module.exports = async function (messageJSON, socket, sessions, clients, client, tier, flipBeef) {
    const stats = JSON.parse(messageJSON.message)

    const key = await get(`SELECT * FROM keys WHERE key = ?`, [messageJSON.key])
    const guild = await client.guilds.fetch(key.guild)
    const channel = await guild.channels.fetch(key.channel)

    await channel.send({
        content: '', embeds: [
            new EmbedBuilder()
                .setTitle("Account Stats")
                .addFields([
                    {
                        name: "Purse",
                        value: `${stats.purse || "Unknown"}`,
                        inline: true
                    },
                    {
                        name: "Island",
                        value: `${stats.island || "Unknown"}`,
                        inline: true
                    },
                    {
                        name: "Visitors",
                        value: `${stats.visitors || "Unknown"}`,
                        inline: true
                    },
                    {
                        name: "Hypixel Ping",
                        value: `${stats.hypixel_ping || "Unknown"}`,
                        inline: true
                    },
                    {
                        name: "Cofl Ping",
                        value: `${stats.cofl_ping || "Unknown"}`,
                        inline: true
                    },
                    {
                        name: "Cofl Delay",
                        value: `${stats.cofl_delay || "Unknown"}`,
                        inline: true
                    },
                    {
                        name: "Auto Open Status",
                        value: stats.status ? "Enabled" : "Disabled",
                        inline: true
                    },
                    {
                        name: "Macro Paused",
                        value: stats.paused ? "Paused" : "Active",
                        inline: true
                    }
                ])
                .setThumbnail(`https://sky.coflnet.com/static/icon/SKYBLOCK_MENU`)
                .setColor(15501567)
                .setFooter({ text: "MarketShark - discord.gg/MMEyPYbhCj", iconURL: "https://cdn.discordapp.com/icons/1247354052493443224/6d2f8af3b5ee55ba598e5f2ec1032cfc.webp?size=256" })
                .setTimestamp()
                .setAuthor({ name: messageJSON.username, iconURL: `https://mc-heads.net/avatar/${messageJSON.username}` })
        ]
    })
};