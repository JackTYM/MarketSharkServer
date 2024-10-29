const { Client, SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, AttachmentBuilder, } = require('discord.js');
const { abbreviateNumber, all, calculateBINTax, get, run } = require("../util")
const uuid = require('uuid');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('resendkey')
        .setDescription('Resends a key to a user')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addUserOption(option => option
            .setName("user")
            .setDescription("Client user to give key to")
            .setRequired(true)
        )
        .addStringOption(option => option
            .setName("tier")
            .setDescription("Tier to provide key")
            .setRequired(true)
            .addChoices(
                { name: "Hammerhead", value: "HAMMERHEAD" },
                { name: "Wobbegong", value: "WOBBEGONG" },
                { name: "Great White", value: "GREATWHITE" },
                { name: "Megalodon", value: "MEGALODON" },
            )
        ),
    async execute(interaction, clients) {

        const key = get(`SELECT * FROM keys WHERE discordid = ?`, [interaction.options.getUser('user').id]);

        if (key) {
            try {
                interaction.options.getUser('user').send(`Thank you for purchasing a ${key.tier} key from MarketShark!\nHere is your key: \`${key.key}\`\n\nPlease read the following: \n<#1253996607985422346>\n<#1254569694342549575>`);


                interaction.reply({ content: 'Sent key to user\'s DMs!', ephemeral: true })
            } catch (e) {
                console.error(e);
                interaction.reply({ content: 'Could not message user! Please have them turn on their DMs and then run /resendkey!', ephemeral: true })
            }
        } else {
            interaction.reply({ content: 'No key linked to user found!', ephemeral: true })
        }
    }
};
