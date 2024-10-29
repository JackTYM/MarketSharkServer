const { Client, SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, AttachmentBuilder, } = require('discord.js');
const { abbreviateNumber, all, calculateBINTax, get, run } = require("../util")
module.exports = {
    data: new SlashCommandBuilder()
        .setName('inventory')
        .setDescription('Gets information about the user\'s inventory')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option => option
            .setName("username")
            .setDescription("The username of the account to specify to")
            .setRequired(false)
        ),
    async execute(interaction, clients) {
        const keys = await all(`SELECT * FROM keys WHERE guild = ?`, [interaction.guildId])

        var sent = false;
        for (const key of keys) {
            const client = clients[key.key];
            if (client != null) {
                sent = true;
                client.send(JSON.stringify({
                    "type": "Inventory",
                    "message": "Inventory requested through Discord Integration!",
                    "username": interaction.options.getString("username") || ""
                }))
            }
        }
        if (!sent) {
            interaction.reply({ content: "No client connected to discord integration!", ephemeral: true })
        } else {
            interaction.reply({ content: "Sent inventory request! Check your webhooks channel!", ephemeral: true })
        }

    }
};