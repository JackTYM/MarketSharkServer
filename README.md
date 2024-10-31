# MarketShark Server

The MarketShark Server is a NodeJS backend designed to manage connections between the MarketShark clients (Forge and Headless) and Discord for seamless remote control and monitoring. It includes websocket connections for client communication, authentication, and admin functionalities via a Discord bot.

## Features

- Websocket connections for Forge and Headless MarketShark clients
- Discord bot integration for real-time command, control, and monitoring
- Key, user, and session management
- Minecraft session authentication
- Admin statistics and status dashboard

## Setup Instructions

1. **Set the Admin Guild ID**
   - Open `src/index.js` and set your Discord admin guild ID in:
     ```javascript
     const admin_guild_id = "<YOUR_ADMIN_GUILD_ID>";
     ```

3. **Configure Env File**
   - Copy example.env into the file .env
   - Set the DISCORD_TOKEN
   - Change DOMAIN to one pointing to your IP (Alternatively, your IP)
      - If using a DOMAIN, ensure you have the subdomains **service**.example.com and **wss**.example.com
   - Change ports if needed
   - Set 2Captcha key from [2Captcha](https://2captcha.com/setting) if wanted (AutoCaptcha is an unfinished feature)

4. **Add Headless Executables**
   - Executables built from [MarketSharkHeadless](https://github.com/JackTYM/MarketSharkHeadless) should be added to the `executable` folder in this project.
   - Rename the `client` file to `marketshark` before placing it in the `executable` folder.

5. **Recommended Deployment Options**
   - Use **PM2** or **Docker** to keep the server running persistently and to handle crashes and restarts. For Docker, a Dockerfile can be added based on your deployment needs.
   - For PM2, run:
     ```bash
     pm2 start src/index.js --name MarketSharkServer
     ```

6. **Configure NGINX (Optional)**
   - NGINX configuration files for the server are located in the `nginx` directory.
   - Replace `DOMAIN` with your domain / IP
   - Replace `WEBSOCKET_PORT` and `SERVICE_PORT`
   - Add SSL Certificates or route through Cloudflare Proxy (Reccomended)
      - Alternatively, switch to using `http` over `https` and `ws` over `wss` in sources`

## Websocket Connections

This server manages websocket connections for:
- **Forge Client** - MarketShark Forge mod connections.
- **Headless Client** - MarketSharkHeadless connections.

## Discord Bot Integration

The Discord bot provides:
- **Authentication Management** - Validates users and sessions.
- **Admin Controls** - Enables real-time monitoring and control of connected clients.
- **Statistics Dashboard** - Displays stats and activity for admins.

## Known Bugs

- Auto Captcha does not work well with 2captcha API, resulting in false solves.
- Various crashes may occur under certain conditions.

## Known Vulnerabilities

- Server could be affected by SQL Injection (SQLi) attacks.

## Contributing

Contributions are welcome! To contribute:

1. **Fork** the repository.
2. **Clone** your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/MarketSharkServer.git
   ```
3. **Create a new branch** for your feature or bug fix:
   ```bash
   git checkout -b feature-name
   ```
4. **Commit** your changes:
   ```bash
   git commit -m "Add new feature"
   ```
5. **Push** to your fork:
   ```bash
   git push origin feature-name
   ```
6. **Submit a pull request** with a description of your changes.

Pull requests will be reviewed and accepted if applicable to the project goals.

---

Thank you for using MarketShark Server!
