const { Client, SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, AttachmentBuilder, } = require('discord.js');
const { abbreviateNumber, all, calculateBINTax, get, run } = require("../util")
module.exports = {
    data: new SlashCommandBuilder()
        .setName('settings')
        .setDescription('Changes macro settings')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addBooleanOption(option => option
            .setName("autoopen")
            .setDescription("Enables / Disables AutoOpen")
        )
        .addBooleanOption(option => option
            .setName("autobuy")
            .setDescription("Enables / Disables AutoBuy")
        )
        .addBooleanOption(option => option
            .setName("autoclaim")
            .setDescription("Enables / Disables AutoClaim")
        )
        .addBooleanOption(option => option
            .setName("autosell")
            .setDescription("Enables / Disables AutoSell")
        )
        .addStringOption(option => option
            .setName("autoselltime")
            .setDescription("How many time in hours to list items for (Default 48)")
        )
        .addIntegerOption(option => option
            .setName("autosellprice")
            .setDescription("How to base your sell price")
            .addChoices(
                { name: "Cofl LBin", value: 0 },
                { name: "Cofl LBin - 5%", value: 1 },
                { name: "Cofl Median", value: 2 },
                { name: "Cofl Median - 5%", value: 3 },
                { name: "Flip Target", value: 4 },
            )
        )
        .addBooleanOption(option => option
            .setName("autoclaimsold")
            .setDescription("Enables / Disables AutoClaimSold")
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
                client.send(JSON.stringify({
                    "type": "Settings",
                    "message": JSON.stringify({
                        "autoOpen": interaction.options.getBoolean("autoopen"),
                        "autoBuy": interaction.options.getBoolean("autobuy"),
                        "autoClaim": interaction.options.getBoolean("autoclaim"),
                        "autoSell": interaction.options.getBoolean("autosell"),
                        "autoSellTime": interaction.options.getString("autoselltime"),
                        "autoSellPrice": interaction.options.getInteger("autosellprice"),
                        "autoClaimSold": interaction.options.getBoolean("autoclaimsold"),
                    }),
                    "username": interaction.options.getString("username") || ""
                }))
            }
        }
        if (!sent) {
            interaction.reply({ content: "No client connected to discord integration!", ephemeral: true })
        } else {
            interaction.reply({ content: "Sent settings request! Check your webhooks channel!", ephemeral: true })
        }

    }
};