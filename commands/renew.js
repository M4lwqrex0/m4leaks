const { ChannelType } = require('discord.js');
const config = require('../config/config');

module.exports = {
    name: 'renew',
    async run(message, args, client) {
        const memberRoles = message.member.roles.cache;
        const hasPermission = [
            config.roles.owner,
            config.roles.staff,
            config.roles.moderateur
        ].some(roleId => memberRoles.has(roleId));

        if (!hasPermission) {
            return message.reply("❌ Tu n'as pas la permission d’utiliser cette commande.");
        }

        const oldChannel = message.channel;
        const channelName = oldChannel.name;
        const channelType = oldChannel.type;
        const parent = oldChannel.parent;
        const position = oldChannel.rawPosition;
        const permissionOverwrites = oldChannel.permissionOverwrites.cache.map(overwrite => ({
            id: overwrite.id,
            allow: overwrite.allow.bitfield,
            deny: overwrite.deny.bitfield,
            type: overwrite.type
        }));

        await message.reply(`♻️ Le salon **#${channelName}** va être renouvelé dans quelques secondes...`);

        try {
            const newChannel = await oldChannel.clone({
                name: channelName,
                type: channelType === ChannelType.GuildText ? ChannelType.GuildText : undefined,
                parent: parent,
                permissionOverwrites
            });

            await newChannel.setPosition(position);
            await oldChannel.delete('Salon renouvelé via renew');

            await newChannel.send('🔁 Ce salon a été renouvelé par l’équipe de modération.');
        } catch (error) {
            console.error('❌ Erreur lors du renouvellement du salon :', error);
            return message.channel.send("❌ Une erreur est survenue lors du renouvellement du salon.");
        }
    }
};
