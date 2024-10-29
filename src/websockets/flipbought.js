const axios = require('axios')
const { Client, SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, AttachmentBuilder, } = require('discord.js');

const { abbreviateNumber, all, calculateBINTax, get, run } = require("../util")
module.exports = async function (messageJSON, socket, sessions, clients, client, tier, flipBeef) {
    const flip = JSON.parse(messageJSON.message)

    run(`INSERT INTO flips (key, item_name, cost, value, buy_speed, bed, sold, uuid, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [messageJSON.key, flip.strippedDisplayName, flip.buyPrice, flip.coflWorth, flip.buySpeed, flip.bed, flip.sold, flip.uuid, `${new Date().toISOString()}`])

    // Flip Beef
    setTimeout(async () => {
        const losers = flipBeef.filter(item => item.uuid === flip.uuid).reduce((acc, item) => acc.some(x => x.key === item.key) ? acc : [...acc, item], []);

        if (losers.length > 0) {
            var loserNames = "";

            for (const loser of losers) {
                loserNames += `\`${(await get(`SELECT * FROM keys WHERE key = ?`, [loser.key])).username}\`, `
            }

            loserNames = loserNames.slice(0, -2);

            const user = await get(`SELECT * FROM keys WHERE key = ?`, [messageJSON.key]);

            const guild = await client.guilds.fetch("1242568898868412416");
            const channel = await guild.channels.fetch("1264035818792685631");

            channel.send(`MarketShark user \`${user.username}\` has beat out ${loserNames} on the item ${flip.strippedDisplayName} costing ${abbreviateNumber(flip.buyPrice)} with a profit of ${abbreviateNumber(flip.coflWorth - flip.buyPrice - calculateBINTax(flip.coflWorth))} coins!`);
        }
    }, 1000)

    if (flip.sendBought) {
        const key = await get(`SELECT * FROM keys WHERE key = ?`, [messageJSON.key])
        const guild = await client.guilds.fetch(key.guild)
        const channel = await guild.channels.fetch(key.channel)

        const customHook = await get(`SELECT * from webhooks WHERE key = ?`, [key.key]);
        if (customHook) {
            if (customHook.flip_bought != "") {
                const data = JSON.parse(customHook.flip_bought);

                await channel.send({
                    content: data.content ?? "", embeds: [
                        new EmbedBuilder()
                            .setTitle(data.embeds[0].title ?? null)
                            .setDescription(data.embeds[0].description ?? null)
                            .setURL(data.embeds[0].url ?? null)
                    ]
                });
                return;
            }
        }

        await channel.send({
            content: '', embeds: [
                new EmbedBuilder()
                    .setTitle(`Flip Purchased`)
                    .setURL(`https://sky.coflnet.com/auction/${flip.auctionId}`)
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
                            name: "Item Worth",
                            value: flip.sellPrice != 0 ? abbreviateNumber(flip.sellPrice) : abbreviateNumber(flip.coflWorth),
                            inline: true
                        },
                        {
                            name: "Profit",
                            value: flip.sellPrice != 0 ? abbreviateNumber(flip.sellPrice - flip.buyPrice - calculateBINTax(flip.sellPrice)) : abbreviateNumber(flip.coflWorth - flip.buyPrice - calculateBINTax(flip.coflWorth)),
                            inline: true
                        },
                        {
                            name: "Buy Speed",
                            value: flip.buySpeed + "ms",
                            inline: true
                        },
                        /*{
                            name: "Seller",
                            value: (await axios.get(`https://api.mojang.com/user/profile/${flip.sellerUuid}`)).data.name ?? "Unknown",
                            inline: true
                        },*/
                        {
                            name: "Bed Flip",
                            value: flip.bed ? "True" : "False",
                            inline: true
                        },
                        {
                            name: "Finder",
                            value: flip.finder || "Finder Unknown",
                            inline: true
                        },
                        {
                            name: "Purse",
                            value: flip.purse || "Unknown",
                            inline: true
                        },
                    ])
                    .setThumbnail(`https://sky.coflnet.com/static/icon/${flip.skyblockId}`)
                    .setAuthor({ name: flip.username, iconURL: `https://mc-heads.net/avatar/${flip.username}` })
                    .setColor(1703742)
                    .setFooter({ text: "MarketShark - discord.gg/MMEyPYbhCj", iconURL: "https://cdn.discordapp.com/icons/1247354052493443224/6d2f8af3b5ee55ba598e5f2ec1032cfc.webp?size=256" })
                    .setTimestamp()
            ]
        })
    }
};