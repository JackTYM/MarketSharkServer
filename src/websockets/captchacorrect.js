const axios = require('axios')
const { Client, SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, AttachmentBuilder, } = require('discord.js');

const { abbreviateNumber, all, calculateBINTax, get, run } = require("../util")
module.exports = async function (messageJSON, socket, sessions, clients, client, tier, flipBeef) {
    const json = JSON.parse(messageJSON.message)

    const key = await get(`SELECT * FROM keys WHERE key = ?`, [messageJSON.key])
    const guild = await client.guilds.fetch(key.guild)
    const channel = await guild.channels.fetch(key.captcha_channel || key.channel);

    await channel.send({
        content: '', embeds: [new EmbedBuilder()
            .setTitle("Captcha Success")
            .setDescription(`Successfully verified captcha! You solved the captcha, but you failed too many previously. Requesting another!`)
            .setColor(16776960)
            .setFooter({ text: "MarketShark - discord.gg/MMEyPYbhCj", iconURL: "https://cdn.discordapp.com/icons/1247354052493443224/6d2f8af3b5ee55ba598e5f2ec1032cfc.webp?size=256" })
            .setTimestamp()
            .setAuthor({ name: messageJSON.username, iconURL: `https://mc-heads.net/avatar/${messageJSON.username}` })
        ]
    })

    if (tier == 'MEGALODON') {
        const captcha = await get(`SELECT * FROM captchas WHERE key = ?`, [messageJSON.key]);

        const data = {
            clientKey: "016cbe96b4829177ceccd55c7dcc5580",
            taskId: captcha.solve_id,
        };

        axios.post('https://api.2captcha.com/reportCorrect', data)
    }
};