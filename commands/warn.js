const fs = require('fs');
const path = require('path');
const config = require('../config/config');

const warnsPath = path.join(__dirname, '../data/warns.json');

module.exports = {
    name: 'warn',
    async run(message, args, client) {
        let member = message.mentions.users.first();
        if (!member && args[0]) {
            member = await client.users.fetch(args[0]).catch(() => null);
        }
        if (!member) {
            return message.reply("❌ Utilisateur non trouvé. Mentionne-le ou donne son ID.");
        }
        const reason = args.slice(1).join(' ');
        if (!reason) {
            return message.reply("❌ Merci d'indiquer une raison.");
        }

        const roles = message.member.roles.cache;
        const allowed = [
            config.roles.owner,
            config.roles.staff,
            config.roles.moderateur
        ].some(r => roles.has(r));

        if (!allowed) {
            return message.reply("❌ Tu n'as pas la permission.");
        }

        if (!fs.existsSync(warnsPath)) fs.writeFileSync(warnsPath, '{}');
        const warnsData = JSON.parse(fs.readFileSync(warnsPath));

        if (!warnsData[member.id]) warnsData[member.id] = [];

        warnsData[member.id].push({
            reason,
            date: new Date().toISOString().split('T')[0],
            moderator: message.author.tag
        });

        fs.writeFileSync(warnsPath, JSON.stringify(warnsData, null, 2));

        const warnsCount = warnsData[member.id].length;

        if (warnsCount >= 3) {
            try {
                const guildMember = await message.guild.members.fetch(member.id);
                await guildMember.ban({ reason: `3 avertissements accumulés.` });
                await message.reply(`⚠️ <@${member.id}> a reçu un **3ᵉ avertissement** et a été **banni**.\nRaison du dernier warn : ${reason}`);
            } catch (err) {
                console.error('Erreur lors du bannissement automatique :', err);
                await message.reply("❌ Impossible de bannir ce membre.");
            }
        } else {
            await message.reply(`✅ <@${member.id}> a été averti. (Total : ${warnsCount})\n> Raison : ${reason}`);
        }
    }
};
