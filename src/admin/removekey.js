const { Client, SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, AttachmentBuilder, } = require('discord.js');
const { abbreviateNumber, all, calculateBINTax, get, run } = require("../util")

module.exports = {
    data: new SlashCommandBuilder()
        .setName('removekey')
        .setDescription('Invalidates a key [For Seller Use Only]')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option => option
            .setName("key")
            .setDescription("Key to attempt to invalidate")
            .setRequired(true)
        ),
    async execute(interaction, clients) {
        const key = await get(`SELECT * FROM keys WHERE key = ?`, [interaction.options.getString("key")]);
        if (key) {
            const client = clients[key.key];
            if (client) {
                client.send(JSON.stringify({
                    "type": "FailedActivation",
                    "message": "Failed activation. Please check your activation key"
                }))
                client.close()
            }

            run(`DELETE FROM keys WHERE key = ?`, [interaction.options.getString("key")]);

            console.log(key)
            interaction.reply({
                content: '', embeds: [
                    new EmbedBuilder()
                        .setTitle("Key Deleted!")
                        .addFields([
                            {
                                name: "Username",
                                value: key.username || "None",
                                inline: true
                            },
                            {
                                name: "Guild",
                                value: key.guild || "None",
                                inline: true
                            },
                            {
                                name: "Channel",
                                value: key.channel || "None",
                                inline: true
                            },
                            {
                                name: "Tier",
                                value: key.tier || "None",
                                inline: true
                            }
                        ])
                ], ephemeral: true
            })
        } else {
            await interaction.reply({ content: "Key not found.", ephemeral: true })
        }
    }
};