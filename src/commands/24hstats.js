const { Client, SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, AttachmentBuilder, } = require('discord.js');
const { abbreviateNumber, all, calculateBINTax, get, run, formatDuration } = require("../util")
module.exports = {
    data: new SlashCommandBuilder()
        .setName('24hstats')
        .setDescription('Calculates the users profit in the last 24 hours')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option => option
            .setName("username")
            .setDescription("The username of the account to specify to")
            .setRequired(false)
        ),
    async execute(interaction, clients) {
        // Remove any sold flips from more than 24 hours ago
        //await run(`DELETE FROM flips WHERE date < ? AND sold = 1`, [new Date(new Date() - (24 * 60 * 60 * 1000)).toISOString()])

        // Remove any flips from more than 7 days ago
        //await run(`DELETE FROM flips WHERE date < ?`, [new Date(new Date() - (24 * 60 * 60 * 1000 * 7)).toISOString()])

        const keys = await all(`SELECT * FROM keys WHERE guild = ?`, [interaction.guildId])
        if (keys.length > 0) {
            var flips = []
            for (const key of keys) {
                flips.push(...await all(`SELECT * FROM flips WHERE key = ? AND DATE > ? AND value > 0`, [key.key, new Date(new Date() - (24 * 60 * 60 * 1000)).toISOString()]));
            }

            console.log(flips)
            var profit = 0;
            var estimatedProfit = 0;
            var spent = 0;
            var buySpeeds = 0;
            var highestProfit = 0;
            var highestProfitName = "";
            var highestPotentialProfit = 0;
            var highestPotentialProfitName = "";
            var lowestProfit = 0;
            var lowestProfitName = "";
            var buySpeeds = 0;
            var nonBeds = 0;
            var bought = 0;
            var sold = 0;

            for (flip of flips) {
                if (flip.cost !== 0) {
                    bought++;
                    const flipProfit = parseFloat(flip.value) - parseFloat(flip.cost) - calculateBINTax(parseFloat(flip.value));
                    estimatedProfit += flipProfit;
                    spent += parseFloat(flip.cost);
                    if (!flip.bed) {
                        buySpeeds += parseFloat(flip.buy_speed);
                        nonBeds++;
                    }

                    if (flipProfit > highestProfit) {
                        highestPotentialProfit = flipProfit;
                        highestPotentialProfitName = flip.item_name;
                    }

                    if (flip.sold) {
                        sold++;
                        profit += flipProfit;

                        if (flipProfit > highestProfit) {
                            highestProfit = flipProfit;
                            highestProfitName = flip.item_name;
                        }

                        if (flipProfit < lowestProfit || lowestProfit == 0) {
                            lowestProfit = flipProfit;
                            lowestProfitName = flip.item_name;
                        }
                    }
                }
            }

            var totalFlipTime = 0;

            for (const key of keys) {
                const user = await get(`SELECT * FROM keys WHERE key = ?`, [key.key]);

                const connections = JSON.parse(user.connections);

                if (connections.length > 0) {
                    const latestConn = connections[connections.length - 1];
                    latestConn.end_date = new Date();
                }

                connections.forEach(interval => {
                    const startDate = new Date(interval.start_date);
                    const endDate = new Date(interval.end_date);
                    const duration = endDate - startDate;
                    totalFlipTime += duration;
                });
            }

            interaction.reply({
                content: '', embeds: [
                    new EmbedBuilder()
                        .setTitle("24H Stats")
                        .addFields([
                            {
                                name: "Estimated Coins Profit",
                                value: abbreviateNumber(estimatedProfit),
                                inline: true
                            },
                            {
                                name: "True Profit",
                                value: abbreviateNumber(profit),
                                inline: true
                            },
                            {
                                name: "Coins Spent",
                                value: abbreviateNumber(spent),
                                inline: true
                            },
                            {
                                name: "Flips Bought",
                                value: abbreviateNumber(bought),
                                inline: true
                            },
                            {
                                name: "Flips Sold",
                                value: abbreviateNumber(sold),
                                inline: true
                            },
                            {
                                name: "Highest True Profit Flip",
                                value: `${highestProfitName || "None"} : ${abbreviateNumber(highestProfit)} Coins Profit`,
                                inline: false
                            },
                            {
                                name: "Highest Potential Profit Flip",
                                value: `${highestPotentialProfitName || "None"} : ${abbreviateNumber(highestPotentialProfit)} Coins Profit`,
                                inline: false
                            },
                            {
                                name: "Lowest Sold Profit Flip",
                                value: `${lowestProfitName || "None"} : ${abbreviateNumber(lowestProfit)} Coins Profit`,
                                inline: false
                            },
                            {
                                name: "Average Buy Speed",
                                value: `${Math.round((buySpeeds / nonBeds) * 10) / 10 || 0}ms`,
                                inline: true
                            },
                            {
                                name: "Active Flip Time",
                                value: `${formatDuration(totalFlipTime)}`,
                                inline: true
                            }
                        ])
                        .setThumbnail(`https://sky.coflnet.com/Coin.png`)
                        .setColor(16770870)
                        .setFooter({ text: "MarketShark - discord.gg/MMEyPYbhCj", iconURL: "https://cdn.discordapp.com/icons/1247354052493443224/6d2f8af3b5ee55ba598e5f2ec1032cfc.webp?size=256" })
                        .setTimestamp()
                ]
            })
        } else {
            interaction.reply({
                content: '', embeds: [
                    new EmbedBuilder()
                        .setTitle("Guild not found")
                        .setDescription(`Current Guild not registered to a key. Have you ran /register?`)
                ]
            })
        }
    }
};