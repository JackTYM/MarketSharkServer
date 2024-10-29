const { Client, SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, AttachmentBuilder, } = require('discord.js');
const { abbreviateNumber, all, calculateBINTax, get, run } = require("../util")
module.exports = {
    data: new SlashCommandBuilder()
        .setName('register')
        .setDescription('Registers the server with an Activation Key')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option =>
            option.setName("key")
                .setDescription("Activation Key given by your seller")
                .setRequired(true)),
    async execute(interaction, clients) {
        const key = await get(`SELECT * FROM keys WHERE key = ?`, [interaction.options.getString("key")])
        if (key != null) {
            console.log(interaction);
            console.log(interaction.guild);
            run(`UPDATE keys SET guild = ? WHERE key = ?`, [interaction.guildId, key.key])

            interaction.reply({ content: `Successfully registered guild to the account \`${key.username}\``, ephemeral: true })

        } else {
            interaction.reply({ content: "Key does not exist! Please purchase a key in the discord!", ephemeral: true })
        }
    }
};