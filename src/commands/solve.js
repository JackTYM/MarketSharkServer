const { Client, SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, AttachmentBuilder, } = require('discord.js');
const { abbreviateNumber, all, calculateBINTax, get, run } = require("../util")
module.exports = {
    data: new SlashCommandBuilder()
        .setName('solve')
        .setDescription('Solves a captcha from Cofl')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addIntegerOption(option => option
            .setName("row")
            .setDescription("Select the row to click from the image")
            .setRequired(true)
        )
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
                const captcha = await get("SELECT * FROM captchas WHERE key = ?", [key.key]);

                const thing = captcha.on_clicks.replaceAll("[", "[\"").replaceAll(", ", "\", \"").replaceAll("]", "\"]");
                console.log(thing);
                const jsonThing = JSON.parse(thing);
                console.log(jsonThing);
                console.log([interaction.options.getInteger("row")]);
                console.log(jsonThing[interaction.options.getInteger("row")]);
                if (captcha != null) {
                    client.send(JSON.stringify({
                        "type": "CaptchaSolve",
                        "message": JSON.parse(captcha.on_clicks.replaceAll("[", "[\"").replaceAll(", ", "\", \"").replaceAll("]", "\"]"))[interaction.options.getInteger("row")],
                        "username": interaction.options.getString("username") || ""
                    }))
                } else {

                }
            }
        }
        if (!sent) {
            interaction.reply({ content: "No client connected to discord integration!", ephemeral: true })
        } else {
            interaction.reply({ content: "Sent solve request! Check your webhooks channel!", ephemeral: true })
        }
    }
};