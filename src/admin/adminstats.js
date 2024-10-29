const { Client, SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, AttachmentBuilder, } = require('discord.js');
const { abbreviateNumber, all, calculateBINTax, get, run, formatDuration } = require("../util")
module.exports = {
    data: new SlashCommandBuilder()
        .setName('adminstats')
        .setDescription('Admin Stats Panel [For Seller Use Only]')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction, clients) {

        const users = await all(`SELECT * FROM keys`);

        var activeClients = 0;
        var recentFlipTime = 0;
        var recentProfit = 0;
        var recentUniqueClients = 0;
        var totalFlipTime = 0;
        var totalProfit = 0;
        var totalUniqueClients = users.length;

        for (const user of users) {
            const connections = JSON.parse(user.connections);
            if (connections.length > 0) {
                recentUniqueClients++;
                if (connections[connections.length - 1].end_date === 0) {
                    activeClients++;
                }
            }

            if (connections.length > 0) {
                const latestConn = connections[connections.length - 1];
                latestConn.end_date = new Date();
            }

            connections.forEach(interval => {
                if (interval.end_date !== 0) {
                    const startDate = new Date(interval.start_date);
                    const endDate = new Date(interval.end_date);
                    const duration = endDate - startDate;
                    recentFlipTime += duration;
                }
            });

            totalFlipTime += parseFloat(user.time_flipped);

            const flips = await all(`SELECT * FROM flips WHERE key = ? AND value > 0 AND cost > 0 AND sold = 1`, [user.key]);
            const recentFlips = await all(`SELECT * FROM flips WHERE key = ? AND value > 0 AND cost > 0 AND sold = 1 AND DATE > ?`, [user.key, new Date(new Date() - (24 * 60 * 60 * 1000)).toISOString()]);

            for (const flip of flips) {
                totalProfit += parseFloat(flip.value) - parseFloat(flip.cost) - calculateBINTax(parseFloat(flip.value));
            }

            for (const flip of recentFlips) {
                recentProfit += parseFloat(flip.value) - parseFloat(flip.cost) - calculateBINTax(parseFloat(flip.value));
            }
        }

        interaction.reply({
            content: '', embeds: [
                new EmbedBuilder()
                    .setTitle("MarketShark Stats")
                    .addFields([
                        {
                            name: "Active Clients",
                            value: `${activeClients}`,
                            inline: false
                        },
                        {
                            name: "24H Flip Time",
                            value: formatDuration(recentFlipTime),
                            inline: true
                        },
                        {
                            name: "24H Profit",
                            value: abbreviateNumber(recentProfit),
                            inline: true
                        },
                        {
                            name: "24H Unique Clients",
                            value: `${recentUniqueClients}`,
                            inline: true
                        },
                        {
                            name: "Total Flip Time",
                            value: formatDuration(totalFlipTime),
                            inline: true
                        },
                        {
                            name: "Total Profit",
                            value: abbreviateNumber(totalProfit),
                            inline: true
                        },
                        {
                            name: "Total Unique Clients",
                            value: `${totalUniqueClients}`,
                            inline: false
                        }
                    ])
                    .setColor(6888828)
                    .setFooter({ text: "MarketShark - discord.gg/MMEyPYbhCj", iconURL: "https://cdn.discordapp.com/icons/1247354052493443224/6d2f8af3b5ee55ba598e5f2ec1032cfc.webp?size=256" })
                    .setTimestamp()
            ]
        })
    }
};