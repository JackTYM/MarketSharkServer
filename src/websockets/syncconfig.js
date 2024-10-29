const uuid = require('uuid');
const fs = require('fs');
const { Client, SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, AttachmentBuilder, } = require('discord.js');

const { abbreviateNumber, all, calculateBINTax, get, run } = require("../util");
const { file } = require('googleapis/build/src/apis/file');
const { logging } = require('googleapis/build/src/apis/logging');
module.exports = async function (messageJSON, socket, sessions, clients, client, tier, flipBeef) {
    return;
    const data = JSON.parse(messageJSON.message);
    const key = await get(`SELECT * FROM keys WHERE key = ?`, [messageJSON.key]);

    var oldConfigId = "";
    const clientConfigId = await getConfigId(data.config);
    const serverConfigId = key.config_id;

    var configId = "";

    if (key != null) {
        if (key.config_id == '') {
            configId = await getConfigId(data.config)
            oldConfigId = "DEFAULT";
        } else {
            if (clientConfigId !== serverConfigId) {
                if (key.config_last_updated === '') {
                    configId = clientConfigId;
                    oldConfigId = serverConfigId;
                } else if (parseFloat(key.config_last_updated) <= parseFloat(data.lastUpdated)) {
                    configId = clientConfigId;
                    oldConfigId = serverConfigId;
                } else {
                    configId = serverConfigId;
                    oldConfigId = clientConfigId;
                }
            }

            if (configId == oldConfigId) {
                // Same config, dont sync
                return;
            }
        }
        await run(`UPDATE keys SET config_id = ?, config_last_updated = ? WHERE key = ?`, [configId, Date.now(), messageJSON.key])
        
        const config = await get(`SELECT * FROM configs WHERE id = ?`, [configId]);

        console.log(config)

        socket.send(JSON.stringify({
            "type": "ConfigSync",
            "config": JSON.parse(config.config),
            "configId": configId,
            "oldConfigId": oldConfigId,
        }));
    }
};

async function getConfigId(config) {
    const configSql = await get(`SELECT * FROM configs WHERE config = ?`, [JSON.stringify(config)]);

    if (configSql) {
        return configSql.id;
    } else {
        const length = 6;
        const id = Array.from({ length }, () => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join('');
        await run(`INSERT INTO configs (id, config) VALUES (?, ?)`, [id, JSON.stringify(config)]);
        return id;
    }
}