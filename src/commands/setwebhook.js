const { Client, SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, AttachmentBuilder, } = require('discord.js');
const { abbreviateNumber, all, calculateBINTax, get, run } = require("../util")
module.exports = {
    data: new SlashCommandBuilder()
        .setName('setwebhook')
        .setDescription('Sets a custom webhook for flip alerts')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option => option
            .setName("type")
            .setDescription("The type of webhook to set")
            .setRequired(true)
            .addChoices(
                { name: "Flip Bought", value: "flip_bought" },
                { name: "Flip Listed", value: "flip_listed" },
                { name: "Flp Sold", value: "flip_sold" },
            )
        )
        .addAttachmentOption(option => option
            .setName("json")
            .setDescription("Discohook JSON data to format your webhook")
            .setRequired(true)
        ),
    async execute(interaction, clients) {
        const attachment = interaction.options.getAttachment("json");
        try {
            const response = await fetch(attachment.url);
            const webhook = await response.json();

            const keys = await all(`SELECT * FROM keys WHERE guild = ?`, [interaction.guildId])
            for (const key of keys) {
                if (!await get(`SELECT * from webhooks WHERE key = ?`, [key.key])) {
                    await run(`INSERT INTO webhooks (key, flip_bought, flip_listed, flip_sold) VALUES (?, ?, ?, ?)`, [key.key, "", "", ""]);
                }
                await run(`UPDATE webhooks SET ${interaction.options.getString("type")} = ? WHERE key = ?`, [JSON.stringify(webhook), key.key]);
            }

            await interaction.reply({content: "Updated webhook JSON!"})
        } catch (error) {
            console.error('Error fetching attachment data:', error);
            await interaction.reply({content: "Failed to Update webhook JSON."})
        }
    }
};