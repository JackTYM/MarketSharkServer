const uuid = require('uuid');

const { Client, SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, AttachmentBuilder, } = require('discord.js');

const { abbreviateNumber, all, calculateBINTax, get, run, findCoflAuction } = require("../util")
module.exports = async function (messageJSON, socket, sessions, clients, client, tier, flipBeef) {
    const flip = JSON.parse(messageJSON.message)

    const key = await get(`SELECT * FROM keys WHERE key = ?`, [messageJSON.key])
    const guild = await client.guilds.fetch(key.guild)
    const channel = await guild.channels.fetch(key.channel)

    await channel.send({
        content: '', embeds: [
            new EmbedBuilder()
                .setTitle(`Flip Listed`)
                .setURL(`https://sky.coflnet.com/auction/${await findCoflAuction(flip.auctionId) || "AUCTION_NOT_FOUND"}`)
                .addFields([
                    {
                        name: "Item Name",
                        value: flip.strippedDisplayName,
                        inline: true
                    },
                    {
                        name: "Buy Price",
                        value: abbreviateNumber(flip.buyPrice),
                        inline: true
                    },
                    {
                        name: "List Price",
                        value: abbreviateNumber(flip.sellPrice),
                        inline: true
                    },
                    {
                        name: "Profit",
                        value: abbreviateNumber(flip.sellPrice - flip.buyPrice - calculateBINTax(flip.sellPrice)),
                        inline: true
                    },
                    {
                        name: "Profit %",
                        value: `${Math.round(((flip.sellPrice - flip.buyPrice - calculateBINTax(flip.sellPrice)) / flip.sellPrice) * 100)}%`,
                        inline: true
                    },
                    {
                        name: "Finder",
                        value: flip.finder || "Finder Unknown",
                        inline: true
                    },
                ])
                .setThumbnail(`https://sky.coflnet.com/static/icon/${flip.skyblockId}`)
                .setAuthor({ name: flip.username, iconURL: `https://mc-heads.net/avatar/${flip.username}` })
                .setColor(51450)
                .setFooter({ text: "MarketShark - discord.gg/MMEyPYbhCj", iconURL: "https://cdn.discordapp.com/icons/1247354052493443224/6d2f8af3b5ee55ba598e5f2ec1032cfc.webp?size=256" })
                .setTimestamp()
        ]
    })
};