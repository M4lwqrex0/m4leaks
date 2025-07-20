const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const invitesPath = path.join(__dirname, '../data', 'invites.json');

module.exports = {
    name: 'topinvites',
    async run(message, args, client) {
        const invitesData = JSON.parse(fs.readFileSync(invitesPath));
        const guild = message.guild;

        const filtered = Object.entries(invitesData)
            .filter(([userId, count]) => guild.members.cache.has(userId))
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        if (filtered.length === 0) {
            return message.reply("Aucun inviteur trouvé pour le moment.");
        }

        const lines = await Promise.all(
            filtered.map(async ([userId, count], index) => {
                const user = await guild.members.fetch(userId).catch(() => null);
                const tag = user ? user.user.tag : `Utilisateur inconnu (${userId})`;
                return `\`${index + 1}.\` **${tag}** — ${count} invitation${count > 1 ? 's' : ''}`;
            })
        );

        const embed = new EmbedBuilder()
            .setTitle('📈 Top 10 des inviteurs')
            .setDescription(lines.join('\n'))
            .setColor(0x3498db);

        await message.reply({ embeds: [embed] });
    }
};
