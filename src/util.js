const sqlite3 = require('sqlite3').verbose();
const axios = require('axios');
const crypto = require('crypto');
const path = require('path');

let db;

function setup() {
    db = new sqlite3.Database('./sqlite3.db');

    // Creates tables if missing
    run(`
        CREATE TABLE IF NOT EXISTS keys
        (
            key                 TEXT PRIMARY KEY,
            username            TEXT    NOT NULL,
            discordid           TEXT    NOT NULL,
            guild               TEXT    NOT NULL,
            channel             TEXT    NOT NULL,
            captcha_channel     TEXT    NOT NULL,
            tier                TEXT    NOT NULL,
            auto_captcha        BOOLEAN NOT NULL,
            time_flipped        TEXT    NOT NULL,
            connections         TEXT    NOT NULL,
            config_id           TEXT    NOT NULL,
            config_last_updated TEXT    NOT NULL,
            last_username       TEXT    NOT NULL
        )`)

    run(`
        CREATE TABLE IF NOT EXISTS flips
        (
            key       TEXT NOT NULL,
            item_name TEXT NOT NULL,
            cost      TEXT NOT NULL,
            value     TEXT NOT NULL,
            buy_speed TEXT NOT NULL,
            bed       BOOL NOT NULL,
            sold      BOOL NOT NULL,
            uuid      TEXT NOT NULL,
            date      DATE NOT NULL
        )`)

    run(`
        CREATE TABLE IF NOT EXISTS captchas
        (
            key       TEXT NOT NULL,
            on_clicks TEXT NOT NULL,
            solve_id  TEXT NOT NULL
        )`)

    run(`
        CREATE TABLE IF NOT EXISTS configs
        (
            id     TEXT NOT NULL,
            config TEXT NOT NULL
        )`)

    run(`
        CREATE TABLE IF NOT EXISTS webhooks
        (
            key         TEXT NOT NULL,
            flip_bought TEXT NOT NULL,
            flip_listed TEXT NOT NULL,
            flip_sold   TEXT NOT NULL
        )`)

    run(`
        CREATE TABLE IF NOT EXISTS minecraft_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            key TEXT,
            username TEXT,
            uuid TEXT,
            ssid TEXT,
            refresh_token TEXT,
            UNIQUE (key, uuid)
    )`)

    // Ensure UUIDs are formatted correctly
    run(`
        UPDATE flips
        SET uuid = REPLACE(uuid, '\"', '')
    `)

    updateKeyTimestamps();
}

async function updateKeyTimestamps() {
    const keys = await all(`SELECT *
                            FROM keys`);

    const cutoffTime = new Date(new Date().getTime() - 24 * 60 * 60 * 1000);
    for (const key of keys) {
        var conn = JSON.parse(key.connections)

        if (conn.length > 0) {
            const latestConn = conn[conn.length - 1];
            latestConn.end_date = new Date();
        }

        conn = conn.filter(conn => new Date(conn.end_date) >= cutoffTime);

        await run(`UPDATE keys
                   SET connections = ?
                   WHERE key = ?`, [JSON.stringify(conn), key.key]);
    }
}

function abbreviateNumber(number) {
    var sign = "";
    if (number < 0) {
        sign = "-";
        number = Math.abs(number);
    }
    if (number < 1000) {
        return number.toString();
    }

    const suffixes = ['k', 'M', 'B', 'T'];
    const magnitude = Math.floor(Math.log10(number) / 3);
    const truncated = number / Math.pow(1000, magnitude);
    let formatted = truncated.toFixed(1);

    if (formatted.endsWith('.0')) {
        formatted = formatted.slice(0, -2);
    }

    return sign + formatted + suffixes[magnitude - 1];
}

function calculateBINTax(itemPrice) {
    let initialFee;
    let collectionFee = 0;

    // Determine initial fee based on item price
    if (itemPrice > 100000000) {
        initialFee = itemPrice * 0.025;
    } else if (itemPrice >= 10000000) {
        initialFee = itemPrice * 0.02;
    } else {
        initialFee = itemPrice * 0.01;
    }

    // Determine collection fee if item price is above 1 million
    if (itemPrice > 1000000) {
        collectionFee = itemPrice * 0.01;
    }

    // Calculate total tax
    return initialFee + collectionFee;
}

function get(query, params) {
    return new Promise((resolve, reject) => {
        db.get(query, params, (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}

function all(query, params) {
    return new Promise((resolve, reject) => {
        db.all(query, params, (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}

function run(query, params) {
    return new Promise((resolve, reject) => {
        db.run(query, params, (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}

function formatDuration(milliseconds) {
    const seconds = milliseconds / 1000;
    const minutes = seconds / 60;
    const hours = minutes / 60;
    const days = hours / 24;

    if (days >= 1) {
        return `${days.toFixed(1)} Days`;
    } else if (hours >= 1) {
        return `${hours.toFixed(1)} Hours`;
    } else if (minutes >= 1) {
        return `${minutes.toFixed(1)} Minutes`;
    } else {
        return `${seconds.toFixed(1)} Seconds`;
    }
}

async function findCoflAuction(uuid) {
    const url = `https://sky.coflnet.com/api/search/${uuid}`;

    try {
        const response = await axios.get(url);
        const results = response.data;
        const auction = results.find(item => item.type === 'auction');

        if (auction) {
            return auction.id;
        } else {
            return "AUCTION_NOT_FOUND"
        }
    } catch (error) {
        return "AUCTION_NOT_FOUND"
    }
}

var ms_states = {}

async function authorizeUser() {
    //const state = crypto.randomBytes(16).toString('hex');

    //ms_states[state] = key;
    //const url = `https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize?client_id=5226351a-f8e8-47ad-9733-e7fc0c828fe9&response_type=code&redirect_uri=https%3A%2F%2Fmarketshark.net%2Foauth&scope=XboxLive.signin%20offline_access&prompt=select_account&state=${state}`

    return await loginDevice();
}

async function checkUser(key, deviceCode) {
    let device = {};
    while (true) {
        const resp = await checkDevice(deviceCode);
        if (resp.access_token !== "") {
            device = resp;
            break;
        }
    }

    const xbl = await getXbl(device.access_token);
    const xsts = await getXSTS(xbl.token);
    const mc = await getMCToken(xbl.uhs, xsts.token);
    const mcInfo = await getMcInfo(mc.access_token);

    return { accessToken: mc.access_token, refreshToken: device.refresh_token, mcInfo: mcInfo };
}

async function refresh(refreshToken) {
    const device = await refreshDevice(refreshToken);

    const xbl = await getXbl(device.access_token);
    const xsts = await getXSTS(xbl.token);
    const mc = await getMCToken(xbl.uhs, xsts.token);
    const mcInfo = await getMcInfo(mc.access_token);

    return { accessToken: mc.access_token, refreshToken: device.refresh_token, mcInfo: mcInfo };
}

const express = require('express');
const { EmbedBuilder } = require("@discordjs/builders");
/*const app = express();

app.get('/oauth', async (req, res) => {
    const queryParams = req.query;

    var htmlResponse;

    if (ms_states[queryParams["state"]]) {

        const oAuth = await login(queryParams["code"]);
        const xbl = await getXbl(oAuth.accessToken);
        const xsts = await getXSTS(xbl.token);
        const mc = await getMCToken(xbl.uhs, xsts.token);
        const mcInfo = await getMcInfo(mc.access_token);

        htmlResponse = `
    <!DOCTYPE html>
    <html lang="en">
    
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>SUCCESS</title>
        <style>
            body {
                font-family: 'Arial', sans-serif;
                background-color: #64d726; 
                color: white;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
                padding: 0;
                text-align: center;
            }
    
            h1 {
                font-size: 3rem;
                margin-bottom: 20px;
            }
    
            p {
                font-size: 1.5rem;
            }
        </style>
    </head>
    
    <body>
        <div class="content">
            <h1>Successfully authenticated account with MarketShark!</h1>
        </div>
    </body>
    
    </html>
  `;
    } else {
        htmlResponse = `
    <!DOCTYPE html>
    <html lang="en">
    
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>SUCCESS</title>
        <style>
            body {
                font-family: 'Arial', sans-serif;
                background-color: #c81f1f; 
                color: white;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
                padding: 0;
                text-align: center;
            }
    
            h1 {
                font-size: 3rem;
                margin-bottom: 20px;
            }
    
            p {
                font-size: 1.5rem;
            }
        </style>
    </head>
    
    <body>
        <div class="content">
            <h1>An error occurred!</h1>
            <p>Please try logging in again or contact an admin at marketshark.net</p>
        </div>
    </body>
    
    </html>
  `;
    }

    res.send(htmlResponse);
});*/


async function login(code) {
    const url = 'https://login.microsoftonline.com/consumers/oauth2/v2.0/token';

    const data = new URLSearchParams({
        client_id: '907a248d-3eb5-4d01-99d2-ff72d79c5eb1',
        scope: 'xboxlive.signin offline_access',
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: 'https://marketshark.net/oauth',
        //client_secret: 'aAW8Q~x2UXABS5bEoq6R7EcS_BOgTkI9_1XNycM7'
        client_secret: 'C-L8Q~Twx2xOuUpWytR1BhLCStI1fVU3rGetTcg.'
    });

    const response = await axios.post(url, data.toString(), {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    });

    if (!response.data['access_token']) {
        console.log("Error logging in with OAuth!");

        return { accessToken: "", refreshToken: "" };
    }

    return { accessToken: response.data['access_token'], refreshToken: response.data['refresh_token'] };
}

async function loginDevice() {
    const url = 'https://login.microsoftonline.com/consumers/oauth2/v2.0/devicecode';

    const data = new URLSearchParams({
        client_id: '907a248d-3eb5-4d01-99d2-ff72d79c5eb1',
        scope: 'xboxlive.signin offline_access',
    });

    const response = await axios.post(url, data.toString(), {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    });

    return { deviceCode: response.data['device_code'], message: response.data['message'] };
}

async function checkDevice(deviceCode) {
    const url = 'https://login.microsoftonline.com/consumers/oauth2/v2.0/token';

    const data = new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:device_code",
        client_id: '907a248d-3eb5-4d01-99d2-ff72d79c5eb1',
        scope: 'xboxlive.signin offline_access',
        device_code: deviceCode,
    });


    try {
        const response = await axios.post(url, data.toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        return { access_token: response.data['access_token'], refresh_token: response.data['refresh_token'] };
    } catch (e) {
        return { access_token: "", refresh_token: "" };
    }
}

async function refreshDevice(refreshToken) {
    const url = 'https://login.microsoftonline.com/consumers/oauth2/v2.0/token';

    const data = new URLSearchParams({
        client_id: '907a248d-3eb5-4d01-99d2-ff72d79c5eb1',
        refresh_token: refreshToken,
        grant_type: "refresh_token",
        //scope: 'xboxlive.signin offline_access',
    });


    try {
        const response = await axios.post(url, data.toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        return { access_token: response.data['access_token'], refresh_token: response.data['refresh_token'] };
    } catch (e) {
        return { access_token: "", refresh_token: "" };
    }
}

async function getXbl(accessToken) {
    const url = 'https://user.auth.xboxlive.com/user/authenticate';

    const data = {
        "Properties": {
            "AuthMethod": "RPS",
            "SiteName": "user.auth.xboxlive.com",
            "RpsTicket": `d=${accessToken}`
        },
        "RelyingParty": "http://auth.xboxlive.com",
        "TokenType": "JWT"
    };

    const response = await axios.post(url, data, {
        headers: {
            'Content-Type': 'application/json'
        }
    });

    return { token: response.data.Token, uhs: response.data.DisplayClaims.xui[0].uhs };
}

async function getXSTS(xblToken) {
    const url = 'https://xsts.auth.xboxlive.com/xsts/authorize';

    const data = {
        "Properties": {
            "SandboxId": "RETAIL",
            "UserTokens": [
                xblToken
            ]
        },
        "RelyingParty": "rp://api.minecraftservices.com/",
        "TokenType": "JWT"
    };

    const response = await axios.post(url, data, {
        headers: {
            'Content-Type': 'application/json'
        }
    });

    if (JSON.stringify(response.data).includes("\"Token\":")) {
        return { token: response.data.Token };
    } else {
        return { token: "" };
    }
}

async function getMCToken(userHash, xstsToken) {
    const url = 'https://api.minecraftservices.com/authentication/login_with_xbox';

    const data = {
        "identityToken": `XBL3.0 x=${userHash};${xstsToken}`
    };

    const response = await axios.post(url, data, {
        headers: {
            'Content-Type': 'application/json'
        }
    });

    return { access_token: response.data.access_token };
}

async function getMcInfo(mcToken) {
    const url = 'https://api.minecraftservices.com/minecraft/profile';

    const response = await axios.get(url, {
        headers: {
            'Authorization': `Bearer ${mcToken}`
        }
    });

    return { uuid: addDashesToUUID(response.data.id), username: response.data.name };
}

function addDashesToUUID(uuid) {
    // Ensure the UUID is in the correct format (32 characters long)
    if (uuid.length !== 32) {
        throw new Error('Invalid UUID format');
    }

    // Add dashes to the UUID
    return uuid.replace(
        /^(.{8})(.{4})(.{4})(.{4})(.{12})$/,
        '$1-$2-$3-$4-$5'
    );
}

/*const PORT = 7653;
app.listen(PORT, () => {
    console.log(`OAuth Server is running on port ${PORT}`);
});*/


const app = express();
const port = 7656;

app.get('/executable', async (req, res) => {
    const key = await get(`SELECT *
        FROM keys
        WHERE key = ?`, [req.query.key]);

    if (key) {
        const filePath = path.join(__dirname, '../executable', 'marketshark');
        res.download(filePath, (err) => {
            if (err) {
                console.error('File download failed:', err);
                res.status(500).send('Failed to download file');
            }
        });
    } else {
        res.send("Invalid key.");
    }
    return;
});

app.get('/cli', async (req, res) => {
    const key = await get(`SELECT *
        FROM keys
        WHERE key = ?`, [req.query.key]);

    if (key) {
        const filePath = path.join(__dirname, '../executable', 'cli');
        res.download(filePath, (err) => {
            if (err) {
                console.error('File download failed:', err);
                res.status(500).send('Failed to download file');
            }
        });
    } else {
        res.send("Invalid key.");
    }
    return;
});

app.get('/service', async (req, res) => {
    const key = await get(`SELECT *
        FROM keys
        WHERE key = ?`, [req.query.key]);

    if (key) {
        const filePath = path.join(__dirname, '../executable', 'service');
        res.download(filePath, (err) => {
            if (err) {
                console.error('File download failed:', err);
                res.status(500).send('Failed to download file');
            }
        });
    } else {
        res.send("Invalid key.");
    }
    return;
});

app.get('/install.sh', async (req, res) => {
    const filePath = path.join(__dirname, '../executable', 'install.sh');
    res.download(filePath, (err) => {
        if (err) {
            console.error('File download failed:', err);
            res.status(500).send('Failed to download file');
        }
    });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

module.exports = {
    abbreviateNumber,
    calculateBINTax,
    get,
    all,
    run,
    setup,
    formatDuration,
    findCoflAuction,
    authorizeUser,
    checkUser,
    refresh
};
