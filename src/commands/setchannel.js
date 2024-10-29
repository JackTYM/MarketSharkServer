const { Client, SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, AttachmentBuilder, } = require('discord.js');
const { abbreviateNumber, all, calculateBINTax, get, run } = require("../util")
module.exports = {
    data: new SlashCommandBuilder()
        .setName('setchannel')
        .setDescription('Sets the channel for webhooks')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addChannelOption(option => option
            .setName("channel")
            .setDescription("Channel where webhooks are sent")
            .setRequired(true)
        )
        .addStringOption(option => option
            .setName("username")
            .setDescription("The username of the account to specify to")
            .setRequired(false)
        ),
    async execute(interaction, clients) {
        const guildKeys = await all(`SELECT * from keys WHERE guild = ?`, [interaction.guildId])
        if (guildKeys.length > 0) {
            run(`UPDATE keys SET channel = ? WHERE guild = ?`, [interaction.options.getChannel("channel").id, interaction.guildId])

            try {
                await (await (await interaction.client.guilds.fetch(interaction.guildId)).channels.fetch(interaction.options.getChannel("channel").id)).send(`This is a permissions test message!`);

                await interaction.reply({
                    content: '', embeds: [
                        new EmbedBuilder()
                            .setTitle("Changed Webhook Channel")
                            .setDescription(`Webhook Channel Changed to <#${interaction.options.getChannel("channel").id}>`)
                    ]
                })
            } catch (e) {
                console.error(e)
                interaction.reply({ content: 'The bot failed to send a test message! Check the permissions for the channel.', ephemeral: true });
            }
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