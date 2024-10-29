const { createCanvas, loadImage } = require('canvas');
const axios = require('axios')

const { Client, SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, AttachmentBuilder, } = require('discord.js');

const { abbreviateNumber, all, calculateBINTax, get, run } = require("../util")
module.exports = async function (messageJSON, socket, sessions, clients, client, tier, flipBeef) {
    const json = JSON.parse(messageJSON.message)

    console.log(json.captcha)

    var description = json.captcha;
    if (description.includes("[Coflnet]: \n")) {
        description = description.split("[Coflnet]: \n")[1];
    } else {
        // Not a captcha
        return;
    }

    var lines = description;
    if (lines.includes("\nSelect the letter")) {
        lines = description.split("\nSelect the letter")[0];
    } else {
        console.log(description);
    }
    lines = lines.split('\n');

    const scale = 6;
    const lineHeight = 10 * scale;
    const canvasHeight = lines.length * lineHeight + 20
    var canvasWidth = 0;
    lines.forEach((line, index) => {
        var temp = 0;
        for (let char of line) {
            if (/\uFFFD/g.test(char) || char == ' ') {
                temp += 4 * scale;
            } else if (char == '⋅') {
                temp += 2 * scale;
            }
        }
        canvasWidth = Math.max(temp, canvasWidth);
    });

    const vertical = canvasWidth < canvasHeight;
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const missingUnicodeImage = await loadImage('./images/MissingUnicode.png');
    const dotUnicodeImage = await loadImage('./images/DotUnicode.png');

    ctx.font = '32px Minecraft';
    ctx.fillStyle = '#FFFFFF';

    lines.forEach((line, index) => {
        const yPosition = lineHeight * (index + 1);
        let xPosition = 20;

        if (vertical) {
            // Determine the maximum number of digits in the line numbers
            const maxDigits = lines.length.toString().length;
            const lineNumber = (index + 1).toString().padStart(maxDigits, ' ');

            // Drawing the line number
            ctx.font = '32px Minecraft';
            ctx.fillStyle = '#FFFFFF';

            ctx.fillText(lineNumber + ' |', 20, yPosition);

            // Set the starting xPosition after the line number
            xPosition = 20 + ctx.measureText(lineNumber + ' |').width;
        }

        for (let char of line) {
            if (/\uFFFD/g.test(char)) {
                const imageWidth = 4 * scale;
                const imageHeight = 7 * scale;
                ctx.drawImage(missingUnicodeImage, xPosition, yPosition - imageHeight, imageWidth, imageHeight);
                xPosition += imageWidth;
            } else if (char == '⋅') {
                const imageWidth = 2 * scale;
                const imageHeight = 3 * scale;
                ctx.drawImage(dotUnicodeImage, xPosition, yPosition - imageHeight / 2, imageWidth, imageHeight);
                xPosition += imageWidth;
            } else if (char == ' ') {
                ctx.font = '32px Minecraft';
                ctx.fillStyle = '#FFFFFF';
                ctx.fillText(char, xPosition, yPosition);
                xPosition += 4 * scale;
            } else {
                ctx.font = '32px Minecraft';
                ctx.fillStyle = '#FFFFFF';
                ctx.fillText(char, xPosition, yPosition);
                xPosition += ctx.measureText(char).width + 1;
            }
        }
    });

    const buffer = canvas.toBuffer('image/png');

    const key = await get(`SELECT * FROM keys WHERE key = ?`, [messageJSON.key])
    const guild = await client.guilds.fetch(key.guild)
    const channel = await guild.channels.fetch(key.captcha_channel || key.channel)

    await run(`DELETE FROM captchas WHERE key = ?`, [key.key]);
    await run(`INSERT INTO captchas (key, on_clicks, solve_id) VALUES (?, ?, ?)`, [key.key, json.onClicks, "0"]);

    const attachment = new AttachmentBuilder(buffer, { name: 'captcha.png' });
    await channel.send({ files: [attachment] });
    if (description.includes("Click what looks ")) {
        await channel.send({
            content: '', embeds: [new EmbedBuilder()
                .setTitle("Captcha")
                .setDescription(`Please run /solve with the row of the captcha matching the letter!\n**Click what looks ${description.split("Click what looks ")[1].split("\n")[0]}**`)
                .setColor(16725158)
                .setFooter({ text: "MarketShark - discord.gg/MMEyPYbhCj", iconURL: "https://cdn.discordapp.com/icons/1247354052493443224/6d2f8af3b5ee55ba598e5f2ec1032cfc.webp?size=256" })
                .setTimestamp()
                .setAuthor({ name: messageJSON.username, iconURL: `https://mc-heads.net/avatar/${messageJSON.username}` })
            ]
        })
    } else {
        await channel.send({
            content: '', embeds: [new EmbedBuilder()
                .setTitle("Captcha")
                .setDescription(`Please run /solve with the row of the correct answer! SPECIAL CAPTCHA! Read the bottom lines for instructions!`)
                .setColor(16725158)
                .setFooter({ text: "MarketShark - discord.gg/MMEyPYbhCj", iconURL: "https://cdn.discordapp.com/icons/1247354052493443224/6d2f8af3b5ee55ba598e5f2ec1032cfc.webp?size=256" })
                .setTimestamp()
                .setAuthor({ name: messageJSON.username, iconURL: `https://mc-heads.net/avatar/${messageJSON.username}` })
            ]
        })
    }

    // Auto Complete
    if (key.auto_captcha == 1) {
        if (!vertical) {
            await channel.send({
                content: '', embeds: [new EmbedBuilder()
                    .setTitle("Auto Solving Captcha")
                    .setDescription(`Auto Captcha Solve Attempted!`)
                    .setColor(14665285)
                    .setFooter({ text: "MarketShark - discord.gg/MMEyPYbhCj", iconURL: "https://cdn.discordapp.com/icons/1247354052493443224/6d2f8af3b5ee55ba598e5f2ec1032cfc.webp?size=256" })
                    .setTimestamp()
                    .setAuthor({ name: messageJSON.username, iconURL: `https://mc-heads.net/avatar/${messageJSON.username}` })
                ]
            })

            const base64Image = buffer.toString('base64');

            var data = {
                clientKey: "016cbe96b4829177ceccd55c7dcc5580",
                task: {
                    type: "CoordinatesTask",
                    body: base64Image,
                    minClicks: 1,
                    maxClicks: 1,
                    comment: `Click on the letter '${description.split("Click what looks ")[1].split("\n")[0]}'`
                },
                languagePool: "en"
            };

            axios.post('https://api.2captcha.com/createTask', data)
                .then(response => {
                    console.log(response.data);
                    const solveId = response.data.taskId
                    getCaptcha = () => {
                        const data = {
                            clientKey: "016cbe96b4829177ceccd55c7dcc5580",
                            taskId: solveId,
                        };

                        run(`UPDATE captchas SET solve_id = ? WHERE key = ?`, [solveId, messageJSON.key])

                        axios.post('https://api.2captcha.com/getTaskResult', data)
                            .then(async response => {
                                console.log(response.data);

                                if (response.data.errorId !== 0) {

                                } else if (response.data.status == "ready") {

                                    console.log(response.data.solution.coordinates[0])
                                    const clickColumns = JSON.parse(json.clickColumns.replaceAll("[", "[\"").replaceAll(", ", "\", \"").replaceAll("]", "\"]"));
                                    const scaledCoordinate = Math.trunc(clickColumns.length * (response.data.solution.coordinates[0].x / canvasWidth))

                                    console.log("Width: " + canvasWidth)
                                    console.log("ClickCol Length: " + clickColumns.length)
                                    console.log("Scaled Coordinate: " + scaledCoordinate)
                                    console.log("OnClick: " + clickColumns[scaledCoordinate])

                                    socket.send(JSON.stringify({
                                        "type": "CaptchaSolve",
                                        "message": clickColumns[scaledCoordinate]
                                    }))
                                } else if (response.data.status == "processing") {
                                    const captcha = await get(`SELECT * FROM captchas WHERE key = ?`, [messageJSON.key]);
                                    if (captcha && captcha.solve_id && `${captcha.solve_id.replace(".0", "")}` === `${solveId}`) {
                                        setTimeout(getCaptcha, 5000);
                                    } else {
                                        console.log("New captcha already generated!");
                                    }
                                }
                            })
                            .catch(error => {
                                console.error('Error making the request:', error);
                            });
                    }
                    setTimeout(getCaptcha, 5000);
                })
                .catch(error => {
                    console.error('Error making the request:', error);
                });
        } else {
            await channel.send({
                content: '', embeds: [new EmbedBuilder()
                    .setTitle("Auto Captcha Failed")
                    .setDescription(`Vertical Captcha Generated! Generating a new Horizontal Captcha!`)
                    .setColor(14632261)
                    .setFooter({ text: "MarketShark - discord.gg/MMEyPYbhCj", iconURL: "https://cdn.discordapp.com/icons/1247354052493443224/6d2f8af3b5ee55ba598e5f2ec1032cfc.webp?size=256" })
                    .setTimestamp()
                    .setAuthor({ name: messageJSON.username, iconURL: `https://mc-heads.net/avatar/${messageJSON.username}` })
                ]
            });

            return;
            const client = clients[key.key];
            if (client != null) {
                client.send(JSON.stringify({
                    "type": "HorizontalCaptcha",
                    "message": "Captcha requested through Discord Integration!",
                }))
            }
        }
    }
};