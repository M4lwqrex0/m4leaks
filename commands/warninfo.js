const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../config/config');

const warnsPath = path.join(__dirname, '../data/warns.json');

module.exports = {
    name: 'warninfo',
    async run(message, args, client) {
        // Récupère l'utilisateur mentionné ou par ID
        let user = message.mentions.users.first();
        if (!user && args[0]) {
            user = await client.users.fetch(args[0]).catch(() => null);
        }
        if (!user) {
            return message.reply("❌ Utilisateur non trouvé. Mentionne-le ou donne son ID.");
        }

        const memberRoles = message.member.roles.cache;
        const allowedRoles = [
            config.roles.owner,
            config.roles.staff,
            config.roles.moderateur
        ];
        const isAuthorized = allowedRoles.some(roleId => memberRoles.has(roleId));
        if (!isAuthorized) {
            return message.reply("❌ Tu n’as pas la permission d’utiliser cette commande.");
        }

        if (!fs.existsSync(warnsPath)) {
            return message.reply("📁 Aucun avertissement trouvé.");
        }

        const warnsData = JSON.parse(fs.readFileSync(warnsPath));
        const warns = warnsData[user.id];

        if (!warns || warns.length === 0) {
            return message.reply(`<@${user.id}> n’a aucun avertissement.`);
        }

        const embed = new EmbedBuilder()
            .setTitle(`📋 Avertissements pour ${user.tag}`)
            .setColor('#3498db')
            .setFooter({ text: `Total : ${warns.length} avertissement${warns.length > 1 ? 's' : ''}` });

        warns.forEach((warn, index) => {
            embed.addFields({
                name: `Warn #${index + 1}`,
                value: `📅 ${warn.date} • ✏️ ${warn.reason} • 👮 ${warn.moderator}`,
                inline: false
            });
        });

        await message.reply({ embeds: [embed] });
    }
};
