const { Client, Collection } = require('discord.js');
const fs = require('fs');
const { abbreviateNumber, all, calculateBINTax, get, run, setup } = require("./util")

const admin_guild_id = '1242568898868412416';
setup();

const client = new Client({
    intents: []
});

client.commands = new Collection();

const commandFiles = fs.readdirSync('./src/commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.data.name, command);
}

client.admin_commands = new Collection();

const adminFiles = fs.readdirSync('./src/admin').filter(file => file.endsWith('.js'));

for (const file of adminFiles) {
    const command = require(`./admin/${file}`);
    client.admin_commands.set(command.data.name, command);
}

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
    // Purge old commands
    //client.application.commands.set([])

    client.commands.forEach(command => {
        client.application.commands.create(command.data);
    });

    const guild = client.guilds.cache.get(admin_guild_id);

    client.admin_commands.forEach(command => {
        guild.commands.create(command.data)
    });
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    var command = client.commands.get(interaction.commandName);

    if (!command) {
        if (interaction.guildId == admin_guild_id) {
            command = client.admin_commands.get(interaction.commandName);
        } else {
            return;
        }
    };

    try {
        await command.execute(interaction, clients);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
});

require('dotenv').config()
client.login(process.env.DISCORD_TOKEN)

const { WebSocketServer } = require('ws');
const wss = new WebSocketServer({ port: process.env.WEBSOCKET_PORT });

// Set a timeout of 5 minutes (300,000 milliseconds)
wss.options.handshakeTimeout = 300000;

var clients = {}
var sessions = {};
const handlers = {};

var flipBeef = []

const handlerFiles = fs.readdirSync('./src/websockets').filter(file => file.endsWith('.js'));

for (const file of handlerFiles) {
    const messageType = file.split('.')[0];
    handlers[messageType] = require(`./websockets/${file}`);
}

wss.on('connection', (socket, req) => {
    setInterval(() => {
        socket.ping()
    }, 20000)

    socket.on('message', async (data) => {
        const messageJSON = JSON.parse(data);
        let sessionId = messageJSON.session_id;
        if (sessionId) {
            if (sessions[sessionId] == null || await get(`SELECT * FROM keys WHERE key = ?`, [sessions[sessionId]]) == null) {
                socket.send(JSON.stringify({
                    "type": "IncorrectSession",
                    "message": "Incorrect Websocket Session",
                }));
                return;
            } else if (messageJSON.key == sessions[sessionId]) {

                clients[messageJSON.key] = socket;
                const user = await get(`SELECT * FROM keys WHERE key = ?`, [messageJSON.key]);

                var connections = JSON.parse(user.connections);

                // Check and close previous active connection
                if (connections.length > 0 && connections[connections.length - 1].end_date === 0) {
                    connections[connections.length - 1].end_date = new Date();
                }

                const connectionStart = new Date();
                connections.push({
                    start_date: connectionStart,
                    end_date: 0
                });

                // Existing filter logic...
                await run(`UPDATE keys SET connections = ? WHERE key = ?`, [JSON.stringify(connections), messageJSON.key]);
            } else {
                socket.send(JSON.stringify({
                    "type": "IncorrectSession",
                    "message": "Incorrect Websocket Session",
                }));
            }
        }

        console.log(messageJSON)

        if (await get(`SELECT * FROM keys WHERE key = ?`, [messageJSON.key]) != null) {
            const tier = (await get(`SELECT * FROM keys WHERE key = ?`, [messageJSON.key])).tier
            const handler = handlers[messageJSON.type.toLowerCase()];

            if (handler) {
                await handler(messageJSON, socket, sessions, clients, client, tier, flipBeef);
            } else {
                socket.send(JSON.stringify({
                    "type": "Error",
                    "message": "Unsupported message type",
                }));
            }
        } else {
            socket.send(JSON.stringify({
                "type": "FailedActivation",
                "message": "Failed activation. Please check your activation key"
            }))
            socket.close()
        }
    });

    socket.on('close', async () => {
        const key = Object.keys(clients).find(key => clients[key] === socket);

        if (key) {
            const user = await get(`SELECT * FROM keys WHERE key = ?`, [key]);

            const connections = JSON.parse(user.connections);

            if (connections.length > 0) {
                const latestConn = connections[connections.length - 1];
                latestConn.end_date = new Date();

                const session_length = new Date(latestConn.end_date) - new Date(latestConn.start_date);

                await run(`UPDATE keys SET time_flipped = ? WHERE key = ?`, [parseFloat(user.time_flipped) + session_length, key]);
            }

            await run(`UPDATE keys SET connections = ? WHERE key = ?`, [JSON.stringify(connections), key]);
        }

        // Clean up on close
        Object.keys(sessions).forEach(sessionId => {
            if (sessions[sessionId].socket == socket) {
                delete sessions[sessionId];
            }
        });

        Object.keys(clients).forEach(key => {
            if (clients[key] == socket) {
                delete clients[key];
            }
        });
    });
});


const wssService = new WebSocketServer({ port: process.env.WEBSOCKET_PORT });
wssService.options.handshakeTimeout = 60000;

var serviceClients = {};
const serviceHandlers = {};

const serviceFiles = fs.readdirSync('./src/servicesockets').filter(file => file.endsWith('.js'));

for (const file of serviceFiles) {
    const messageType = file.split('.')[0];
    serviceHandlers[messageType] = require(`./servicesockets/${file}`);
}

wssService.on('connection', (socket, req) => {
    setInterval(() => {
        socket.ping()
    }, 20000)

    socket.on('message', async (data) => {
        const messageJSON = JSON.parse(data);

        console.log(messageJSON)

        if (messageJSON.type === "TestKey") {
            if (await get(`SELECT * FROM keys WHERE key = ?`, [messageJSON.message]) != null) {
                socket.send(JSON.stringify({
                    "type": "ValidKey",
                    "message": "",
                    "key": messageJSON.message
                }));
            } else {
                socket.send(JSON.stringify({
                    "type": "InvalidKey",
                    "message": "",
                }));
            }
        } else {
            if (await get(`SELECT * FROM keys WHERE key = ?`, [messageJSON.key]) != null) {
                serviceClients[messageJSON.key] = socket;

                const tier = (await get(`SELECT * FROM keys WHERE key = ?`, [messageJSON.key])).tier;
                const handler = serviceHandlers[messageJSON.type.toLowerCase()];

                if (handler) {
                    await handler(messageJSON, socket, serviceClients, client, tier);
                } else {
                    socket.send(JSON.stringify({
                        "type": "Error",
                        "message": "Unsupported message type",
                    }));
                }
            }
        }
    });

    socket.on('close', async () => {
        // Clean up on close
        Object.keys(serviceClients).forEach(key => {
            if (serviceClients[key] == socket) {
                delete serviceClients[key];
            }
        });
    });
});
