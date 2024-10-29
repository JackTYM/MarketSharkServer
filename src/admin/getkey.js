const { Client, SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, AttachmentBuilder, } = require('discord.js');
const { abbreviateNumber, all, calculateBINTax, get, run } = require("../util")
module.exports = {
    data: new SlashCommandBuilder()
        .setName('getkey')
        .setDescription('Gets a key from a user\'s username [For Seller Use Only]')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option => option
            .setName("username")
            .setDescription("Client's username for reference")
            .setRequired(true)
        ),
    async execute(interaction, clients) {

        const key = await get(`SELECT * FROM keys WHERE username = ?`, [interaction.options.getString("username")]);

        if (key != null) {
            interaction.reply({
                content: '', embeds: [
                    new EmbedBuilder()
                        .setTitle("Key Found!")
                        .setDescription("Confirm the client can provide the correct email before sending the key!")
                        .addFields([
                            {
                                name: "Key",
                                value: `\`${key.key}\``,
                                inline: true
                            },
                        ])
                ], ephemeral: true
            })
        } else {
            interaction.reply({ content: "Key not found!", ephemeral: true })
        }
    }
};