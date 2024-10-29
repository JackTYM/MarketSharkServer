const { EmbedBuilder } = require("@discordjs/builders");
const { abbreviateNumber, all, calculateBINTax, get, run, authorizeUser, checkUser, refresh } = require("../util")
module.exports = async function (messageJSON, socket, sessions, clients, client, tier, flipBeef) {
    const user = get(`SELECT *
                      FROM keys
                      WHERE key = ?`, [messageJSON.key]);

    if (user) {
        var username = "";
        if (user.last_username) {
            username = user.last_username;
        } else if (messageJSON.username) {
            username = messageJSON.username;
        }

        if (username !== "") {
            const session = await get(`SELECT *
                                       from minecraft_sessions
                                       WHERE key = ?
                                         AND username = ?`, [messageJSON.key, username]);

            if (session) {
                console.log(`Refreshing Token!`);
                const mcInfo = await refresh(session.refresh_token);

                run(`UPDATE minecraft_sessions
                     SET username      = ?,
                         uuid          = ?,
                         ssid          = ?,
                         refresh_token = ?
                     WHERE key = ?`, [mcInfo.mcInfo.username, mcInfo.mcInfo.uuid, mcInfo.accessToken, mcInfo.refreshToken, messageJSON.key]);

                socket.send(JSON.stringify({
                    "type": "UpdateSession",
                    username: mcInfo.mcInfo.username,
                    uuid: mcInfo.mcInfo.uuid,
                    ssid: mcInfo.accessToken
                }));

                return;
            }
        }
        const oauth_link = await authorizeUser();

        const key = await get(`SELECT *
                                   FROM keys
                                   WHERE key = ?`, [messageJSON.key])
        const guild = await client.guilds.fetch(key.guild)
        const channel = await guild.channels.fetch(key.channel)

        await channel.send({
            content: '', embeds: [new EmbedBuilder()
                .setTitle("Authenticate Microsoft Account")
                .setDescription(`Please login to your Minecraft account using Microsoft to\nlog in with Minecraft!
                    
                    ${oauth_link.message}`)
                .setColor(16777214)
                .setFooter({
                    text: "MarketShark - discord.gg/MMEyPYbhCj",
                    iconURL: "https://cdn.discordapp.com/icons/1247354052493443224/6d2f8af3b5ee55ba598e5f2ec1032cfc.webp?size=256"
                })
                .setTimestamp()
            ]
        })

        const mcInfo = await checkUser(messageJSON.key, oauth_link.deviceCode);

        if (await get(`SELECT *
                           FROM minecraft_sessions
                           WHERE key = ?
                             AND uuid = ?`, [messageJSON.key, mcInfo.mcInfo.uuid])) {
            run(`UPDATE minecraft_sessions
                     SET username      = ?,
                         uuid          = ?,
                         ssid          = ?,
                         refresh_token = ?
                     WHERE key = ?`, [mcInfo.mcInfo.username, mcInfo.mcInfo.uuid, mcInfo.accessToken, mcInfo.refreshToken, messageJSON.key]);
        } else {
            run(`INSERT INTO minecraft_sessions (key, username, uuid, ssid, refresh_token)
                     VALUES (?, ?, ?, ?,
                             ?)`, [messageJSON.key, mcInfo.mcInfo.username, mcInfo.mcInfo.uuid, mcInfo.accessToken, mcInfo.refreshToken]);
        }

        socket.send(JSON.stringify({
            "type": "UpdateSession",
            username: mcInfo.mcInfo.username,
            uuid: mcInfo.mcInfo.uuid,
            ssid: mcInfo.accessToken
        }));

        await channel.send({
            content: '', embeds: [new EmbedBuilder()
                .setTitle("Successfully Logged into Minecraft Account!")
                .addFields([
                    {
                        name: "Username",
                        value: mcInfo.mcInfo.username,
                        inline: true
                    },
                    {
                        name: "UUID",
                        value: mcInfo.mcInfo.uuid,
                        inline: true
                    }
                ])
                .setColor(1239338)
                .setFooter({
                    text: "MarketShark - discord.gg/MMEyPYbhCj",
                    iconURL: "https://cdn.discordapp.com/icons/1247354052493443224/6d2f8af3b5ee55ba598e5f2ec1032cfc.webp?size=256"
                })
                .setTimestamp()
            ]
        });
    }
};