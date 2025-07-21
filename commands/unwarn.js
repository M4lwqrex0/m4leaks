const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
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
            .setDescription("Clique sur le bouton correspondant au warn à retirer.")
            .setColor(0x2f3136);

        userWarns.forEach((warn, index) => {
            embed.addFields({
                name: `Warn #${index + 1}`,
                value: `🗓️ ${warn.date} ・ ✏️ ${warn.reason} ・ 👮 ${warn.moderator}`,
                inline: false
            });
        });

        const row = new ActionRowBuilder();
        userWarns.forEach((_, index) => {
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId(`unwarn_${user.id}_${index}`)
                    .setLabel(`Warn ${index + 1}`)
                    .setStyle(ButtonStyle.Danger)
            );
        });

        row.addComponents(
            new ButtonBuilder()
                .setCustomId('cancel_unwarn')
                .setLabel('Annuler')
                .setStyle(ButtonStyle.Secondary)
        );

        const sentMsg = await message.reply({ embeds: [embed], components: [row] });

        const filter = i =>
            i.user.id === message.author.id &&
            (i.customId.startsWith('unwarn_') || i.customId === 'cancel_unwarn');
        const collector = sentMsg.createMessageComponentCollector({ filter, time: 30000 });

        collector.on('collect', async interaction => {
            if (interaction.customId === 'cancel_unwarn') {
                await interaction.reply({ content: '❌ Annulé.', ephemeral: true });
                collector.stop();
                return;
            }
            const parts = interaction.customId.split('_');
            const warnIndex = parseInt(parts[2]);
            if (isNaN(warnIndex) || warnIndex < 0 || warnIndex >= userWarns.length) {
                await interaction.reply({ content: '❌ Numéro invalide.', ephemeral: true });
                return;
            }
            userWarns.splice(warnIndex, 1);
            warnsData[user.id] = userWarns;
            fs.writeFileSync(warnsPath, JSON.stringify(warnsData, null, 2));
            await interaction.reply({ content: `✅ Warn #${warnIndex + 1} retiré pour <@${user.id}>.`, ephemeral: true });
            collector.stop();
        });

        collector.on('end', (_, reason) => {
            if (reason !== 'messageDelete') {
                sentMsg.edit({ components: [] });
            }
        });
    }
};
