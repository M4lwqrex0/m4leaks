const { EmbedBuilder } = require('discord.js');
const config = require('../config/config');

module.exports = {
    name: 'ban',
    async run(message, args, client) {
        let targetUser = message.mentions.users.first();
        if (!targetUser && args[0]) {
            targetUser = await client.users.fetch(args[0]).catch(() => null);
        }
        if (!targetUser) {
            return message.reply('❌ Utilisateur non trouvé. Mentionne-le ou donne son ID.');
        }
        const reason = args.slice(1).join(' ') || 'Aucune raison spécifiée';
        const member = await message.guild.members.fetch(targetUser.id).catch(() => null);

        const memberRoles = message.member.roles.cache;
        const allowed = [
            config.roles.owner,
            config.roles.staff,
            config.roles.moderateur
        ].some(roleId => memberRoles.has(roleId));

        if (!allowed) {
            return message.reply('❌ Tu n’as pas la permission d’utiliser cette commande.');
        }

        if (!member) {
            return message.reply('❌ Le membre est introuvable sur ce serveur.');
        }

        if (!member.bannable) {
            return message.reply('❌ Je ne peux pas bannir ce membre (rôle plus haut ou permissions insuffisantes).');
        }

        try {
            await member.ban({ reason: `${reason} - Banni par ${message.author.tag}` });

            const embed = new EmbedBuilder()
                .setTitle('🚫 Bannissement')
                .setDescription(`<@${targetUser.id}> a été banni du serveur.`)
                .addFields(
                    { name: 'Modérateur', value: message.author.tag, inline: true },
                    { name: 'Raison', value: reason, inline: true }
                )
                .setColor(0xe74c3c)
                .setTimestamp();

            await message.reply({ embeds: [embed] });
        } catch (err) {
            console.error(err);
            return message.reply('❌ Une erreur est survenue lors du bannissement.');
        }
    }
};
