const fs = require('fs');
const path = require('path');
const config = require('../config/config');

const antiPath = path.join(__dirname, '../data', 'anticonfig.json');
if (!fs.existsSync(antiPath)) fs.writeFileSync(antiPath, JSON.stringify({ antilink: false }, null, 2));

module.exports = {
    name: 'antilink',
    async run(message, args, client) {
        const okRole = [
            config.roles.owner,
            config.roles.staff,
            config.roles.moderateur
        ].some(r => message.member.roles.cache.has(r));

        if (!okRole) {
            return message.reply('❌ Permission insuffisante.');
        }

        const mode = args[0];
        if (!mode || !['on', 'off'].includes(mode)) {
            return message.reply('❌ Utilisation : +antilink on/off');
        }

        const cfg = JSON.parse(fs.readFileSync(antiPath));
        cfg.antilink = mode === 'on';
        fs.writeFileSync(antiPath, JSON.stringify(cfg, null, 2));

        await message.reply(`🛡️ Anti-lien **${cfg.antilink ? 'activé' : 'désactivé'}**.`);
    }
};
