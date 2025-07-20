require('dotenv').config();

module.exports = {
    token: process.env.TOKEN,
    clientId: process.env.CLIENT_ID,
    guildId: process.env.GUILD_ID,
    welcomeChannelId: process.env.CHANNEL_WELCOME_ID,

    prefix: process.env.PREFIX,

    roles: {
        owner: process.env.ROLE_OWNER,
        staff: process.env.ROLE_STAFF,
        support: process.env.ROLE_SUPPORT,
        moderateur: process.env.ROLE_MODERATEUR,
        vip: process.env.ROLE_VIP,
        membre: process.env.ROLE_MEMBRE
    },

    embedColor: "#00BFFF"
};
