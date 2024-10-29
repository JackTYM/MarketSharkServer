const { Client, SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, AttachmentBuilder, } = require('discord.js');
const { abbreviateNumber, all, calculateBINTax, get, run, formatDuration } = require("../util")
module.exports = {
    data: new SlashCommandBuilder()
        .setName('getbuglog')
        .setDescription('Remotely grabs a buglog [For Admin Use Only]')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addUserOption(option => option
            .setName("user")
            .setDescription("Client user to get log from")
            .setRequired(true)
        ),
    async execute(interaction, clients) {
        const user = await get(`SELECT * FROM keys WHERE discordid = ?`, [interaction.options.getUser("user").id]);
        
        if (user != null) {
            const client = clients[user.key];
            if (client) {
                client.send(JSON.stringify({
                    "type": "BugLog",
                    "username": ""
                }))
                interaction.reply({content: `Sent bug log request!`, ephemeral: true});
            } else {
                interaction.reply({content: `User is not connected via MarketShark!`, ephemeral: true});
            }
        } else {
            interaction.reply({content: `User does not own a MarketShark key!`, ephemeral: true})
        }
    }
};