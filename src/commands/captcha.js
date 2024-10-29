const { Client, SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, AttachmentBuilder, } = require('discord.js');
const { abbreviateNumber, all, calculateBINTax, get, run } = require("../util")
module.exports = {
    data: new SlashCommandBuilder()
        .setName('captcha')
        .setDescription('Requests a captcha from Cofl')
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
                if (key.tier == "MEGALODON") {
                    client.send(JSON.stringify({
                        "type": "HorizontalCaptcha",
                        "message": "Captcha requested through Discord Integration!",
                        "username": interaction.options.getString("username") || ""
                    }))
                } else {
                    client.send(JSON.stringify({
                        "type": "Captcha",
                        "message": "Captcha requested through Discord Integration!",
                        "username": interaction.options.getString("username") || ""
                    }))
                }
            }
        }
        if (!sent) {
            interaction.reply({ content: "No client connected to discord integration!", ephemeral: true })
        } else {
            interaction.reply({ content: "Sent captcha request! Check your webhooks channel!", ephemeral: true })
        }
    }
};