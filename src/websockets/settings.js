const uuid = require('uuid');

const { Client, SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, AttachmentBuilder, } = require('discord.js');

const { abbreviateNumber, all, calculateBINTax, get, run } = require("../util")
module.exports = async function (messageJSON, socket, sessions, clients, client, tier, flipBeef) {
    const json = JSON.parse(messageJSON.message)

    const key = await get(`SELECT * FROM keys WHERE key = ?`, [messageJSON.key])
    const guild = await client.guilds.fetch(key.guild)
    const channel = await guild.channels.fetch(key.channel)

    const sellPrices = ["Cofl LBin", "Cofl LBin - 5%", "Cofl Median", "Cofl Median - 5%", "Flip Target"]

    await channel.send({
        content: '', embeds: [
            new EmbedBuilder()
                .setTitle("Settings Updated")
                .addFields([
                    {
                        name: "Auto Open",
                        value: json.autoOpen ? "Enabled" : "Disabled",
                        inline: true
                    },
                    {
                        name: "Auto Buy",
                        value: json.autoBuy ? "Enabled" : "Disabled",
                        inline: true
                    },
                    {
                        name: "Auto Claim",
                        value: json.autoClaim ? "Enabled" : "Disabled",
                        inline: true
                    },
                    {
                        name: "Auto Sell",
                        value: json.autoSell ? "Enabled" : "Disabled",
                        inline: true
                    },
                    {
                        name: "Auto Sell Time",
                        value: json.autoSellTime || "Unknown",
                        inline: true
                    },
                    {
                        name: "Auto Sell Price",
                        value: sellPrices[json.autoSellPrice] || "Unknown",
                        inline: true
                    },
                    {
                        name: "Auto Claim Sold",
                        value: json.autoClaimSold ? "Enabled" : "Disabled",
                        inline: true
                    },
                ])
                .setThumbnail("https://sky.coflnet.com/static/icon/SKYBLOCK_MENU")
                .setColor(16777214)
                .setFooter({ text: "MarketShark - discord.gg/MMEyPYbhCj", iconURL: "https://cdn.discordapp.com/icons/1247354052493443224/6d2f8af3b5ee55ba598e5f2ec1032cfc.webp?size=256" })
                .setTimestamp()
                .setAuthor({ name: messageJSON.username, iconURL: `https://mc-heads.net/avatar/${messageJSON.username}` })
        ]
    })
};