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

2. **Set Your Discord Token**
   - Ensure the `DISCORD_TOKEN` environment variable is set with your Discord bot token:
     ```bash
     export DISCORD_TOKEN=<YOUR_DISCORD_TOKEN>
     ```

3. **Configure Websocket Ports (Optional)**
   - By default, websockets run on ports `7654` and `7655`. Modify these in the code if different ports are required.

4. **Recommended Deployment Options**
   - Use **PM2** or **Docker** to keep the server running persistently and to handle crashes and restarts. For Docker, a Dockerfile can be added based on your deployment needs.
   - For PM2, run:
     ```bash
     pm2 start src/index.js --name MarketSharkServer
     ```

5. **Configure NGINX (Optional)**
   - NGINX configuration files for the server are located in the `nginx` directory. Edit these as needed for your setup.

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
