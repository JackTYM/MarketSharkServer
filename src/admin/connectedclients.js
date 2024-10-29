const { Client, SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, AttachmentBuilder, } = require('discord.js');
const { abbreviateNumber, all, calculateBINTax, get, run, formatDuration } = require("../util")
module.exports = {
    data: new SlashCommandBuilder()
        .setName('connectedclients')
        .setDescription('Connected Clients Panel [For Admin Use Only]')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction, clients) {
        var activeClients = 0;
        var description = "";

        for (const client of Object.keys(clients)) {
            const user = await get(`SELECT * FROM keys WHERE key = ?`, [client]);
            if (user) {
                description += `${user.username} - ${user.tier}\n`
            } else {
                description += `Unknown - Unknown\n`
            }
            activeClients++;
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
                        }
                    ])
                    .setDescription(description)
                    .setColor(6888828)
                    .setFooter({ text: "MarketShark - discord.gg/MMEyPYbhCj", iconURL: "https://cdn.discordapp.com/icons/1247354052493443224/6d2f8af3b5ee55ba598e5f2ec1032cfc.webp?size=256" })
                    .setTimestamp()
            ], ephemeral: true
        })
    }
};