const { Client, SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, AttachmentBuilder, } = require('discord.js');
const { abbreviateNumber, all, calculateBINTax, get, run } = require("../util")
const uuid = require('uuid');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('createkey')
        .setDescription('Generates a new key [For Seller Use Only]')
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

        const key = uuid.v4()

        if (await get(`SELECT * FROM keys WHERE discordid = ?`, [interaction.options.getUser('user').id]) == null) {
            try {
                try {
                    const role = await interaction.guild.roles.fetch('1253995835344031785');
                    const member = interaction.guild.members.cache.find(member => member.id === interaction.options.getUser('user').id)

                    console.log(role)
                    member.roles.add(role)
                } catch (e) {
                    console.error(e);
                    await interaction.reply({ content: 'Failed to grant role', ephemeral: true });
                    return;
                }

                try {
                    await run(`INSERT INTO keys (key, username, discordid, guild, channel, tier, auto_captcha, time_flipped, connections) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [key, interaction.options.getUser('user').username, interaction.options.getUser('user').id, "", "", interaction.options.getString("tier"), 0, 0, JSON.stringify([])]);
                } catch (e) {
                    console.error(e);
                    await interaction.reply({ content: 'Failed to insert key', ephemeral: true });
                    return;
                }

                interaction.options.getUser('user').send(`Thank you for purchasing a ${interaction.options.getString("tier")} key from MarketShark!\nHere is your key: \`${key}\`\n\nPlease read the following: \n<#1253996607985422346>\n<#1254569694342549575>`);
                interaction.reply({ content: 'Sent key to user\'s DMs!', ephemeral: true })
            } catch (e) {
                console.error(e);
                interaction.reply({ content: 'Could not message user! Please have them turn on their DMs and then run /resendkey!', ephemeral: true })
            }
        } else {
            interaction.reply({ content: 'Discord user already has a key', ephemeral: true })
        }
    }
};
