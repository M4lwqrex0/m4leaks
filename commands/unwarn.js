const {
    EmbedBuilder
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../config/config');

const warnsPath = path.join(__dirname, '../data/warns.json');

module.exports = {
    name: 'unwarn',
    description: "Affiche tous les warns et propose de les retirer.",
    async run(message, args, client) {
        const memberRoles = message.member.roles.cache;
        const allowed = [
            config.roles.owner,
            config.roles.staff,
            config.roles.moderateur
        ].some(roleId => memberRoles.has(roleId));

        if (!allowed) {
            return message.reply("❌ Tu n’as pas la permission d’utiliser cette commande.");
        }

        let user;
        if (message.mentions.users.size > 0) {
            user = message.mentions.users.first();
        } else if (args[0]) {
            user = await client.users.fetch(args[0]).catch(() => null);
        }
        if (!user) {
            return message.reply("❌ Utilisateur non trouvé. Mentionne-le ou donne son ID.");
        }

        if (!fs.existsSync(warnsPath)) fs.writeFileSync(warnsPath, '{}');
        const warnsData = JSON.parse(fs.readFileSync(warnsPath));
        const userWarns = warnsData[user.id];

        if (!userWarns || userWarns.length === 0) {
            return message.reply(`ℹ️ Aucun avertissement trouvé pour <@${user.id}>.`);
        }

        const embed = new EmbedBuilder()
            .setTitle(`Liste des warns de ${user.tag}`)
            .setDescription("Réponds avec le numéro du warn à retirer ou 'annuler'.")
            .setColor(0x2f3136);

        userWarns.forEach((warn, index) => {
            embed.addFields({
                name: `Warn #${index + 1}`,
                value: `🗓️ ${warn.date} ・ ✏️ ${warn.reason} ・ 👮 ${warn.moderator}`,
                inline: false
            });
        });

        await message.reply({ embeds: [embed] });

        // Attendre la réponse de l'utilisateur
        const filter = m => m.author.id === message.author.id;
        const collector = message.channel.createMessageCollector({ filter, time: 30000, max: 1 });

        collector.on('collect', m => {
            if (m.content.toLowerCase() === 'annuler') {
                return m.reply('❌ Annulé.');
            }
            const index = parseInt(m.content) - 1;
            if (isNaN(index) || index < 0 || index >= userWarns.length) {
                return m.reply('❌ Numéro invalide.');
            }
            userWarns.splice(index, 1);
            warnsData[user.id] = userWarns;
            fs.writeFileSync(warnsPath, JSON.stringify(warnsData, null, 2));
            m.reply(`✅ Warn #${index + 1} retiré pour <@${user.id}>.`);
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                message.reply('⏰ Temps écoulé, commande annulée.');
            }
        });
    }
};
