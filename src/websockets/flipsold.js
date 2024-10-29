const uuid = require('uuid');

const { Client, SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, AttachmentBuilder, } = require('discord.js');

const { abbreviateNumber, all, calculateBINTax, get, run, findCoflAuction } = require("../util")
module.exports = async function (messageJSON, socket, sessions, clients, client, tier, flipBeef) {
    const flip = JSON.parse(messageJSON.message)
    flip.uuid = flip.uuid.replace(/^"|"$/g, '');

    if (flip.uuid !== "") {
        console.log(flip.uuid);
        const dbFlip = await get(`SELECT * FROM flips WHERE uuid = ?`, [flip.uuid]);
        if (dbFlip) {
            if (flip.buyPrice == 0) flip.buyPrice = dbFlip.cost;
            if (flip.buySpeed == 0) flip.buySpeed = dbFlip.buySpeed;

            if (dbFlip.sold == 0) {
                await run(`UPDATE flips SET sold = 1 AND value = ? WHERE uuid = ?`, [flip.sellPrice, flip.uuid])
            } else if (dbFlip.sold == 1) {
                console.log("Item tracked as sold")
                // Item already sold, dont sent message
                return;
            }
        } else {
            console.log("UUID Flip Not Found!")

            run(`INSERT INTO flips (key, item_name, cost, value, buy_speed, bed, sold, uuid, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [messageJSON.key, flip.strippedDisplayName, flip.buyPrice, flip.coflWorth, flip.buySpeed, flip.bed, flip.sold, flip.uuid, `${new Date().toISOString()}`])
        }
    } else {
        var dbFlip;

        if (flip.buyPrice > 0) {
            dbFlip = await get(`SELECT * FROM flips WHERE item_name = ? AND cost = ? AND key = ?`, [flip.strippedDisplayName, flip.buyPrice, messageJSON.key]);
        } else {
            dbFlip = await get(`SELECT * FROM flips WHERE item_name = ? AND key = ?`, [flip.strippedDisplayName, messageJSON.key]);
        }
        if (dbFlip) {
            if (flip.buyPrice == 0) flip.buyPrice = dbFlip.cost;
            if (flip.buySpeed == 0) flip.buySpeed = dbFlip.buySpeed;

            if (dbFlip.sold == 0) {
                await run(`UPDATE flips SET sold = 1 AND value = ? WHERE item_name = ? AND cost = ? AND key = ?`, [flip.sellPrice, flip.strippedDisplayName, flip.buyPrice, messageJSON.key])
            } else if (dbFlip.sold == 1) {
                console.log("Item tracked as sold")
                // Item already sold, dont sent message
                return;
            }
        } else {
            console.log("UUIDless Flip Not Found!")

            run(`INSERT INTO flips (key, item_name, cost, value, buy_speed, bed, sold, uuid, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [messageJSON.key, flip.strippedDisplayName, flip.buyPrice, flip.coflWorth, flip.buySpeed, flip.bed, flip.sold, flip.uuid, `${new Date().toISOString()}`])
        }
    }

    if (flip.sendSold) {
        const key = await get(`SELECT * FROM keys WHERE key = ?`, [messageJSON.key])
        const guild = await client.guilds.fetch(key.guild)
        const channel = await guild.channels.fetch(key.channel)

        await channel.send({
            content: '', embeds: [
                new EmbedBuilder()
                    .setTitle(`Flip Sold`)
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
                            value: `${Math.round(((flip.sellPrice - flip.buyPrice - calculateBINTax(flip.sellPrice)) / flip.sellPrice) * 100)} % `,
                            inline: false
                        },
                        {
                            name: "Buyer",
                            value: flip.buyer || "Unknown",
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
                    .setColor(16776960)
                    .setFooter({ text: "MarketShark - discord.gg/MMEyPYbhCj", iconURL: "https://cdn.discordapp.com/icons/1247354052493443224/6d2f8af3b5ee55ba598e5f2ec1032cfc.webp?size=256" })
                    .setTimestamp()
            ]
        })
    }
};