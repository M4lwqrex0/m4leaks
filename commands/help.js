const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'help',
    async run(message, args, client) {
        const embed = new EmbedBuilder()
            .setTitle('📘 Aide - Liste des commandes')
            .setDescription("Voici la liste des commandes disponibles, triées par niveau d’accès.")
            .addFields(
                {
                    name: '🟢 Commandes accessibles à tous',
                    value: [
                        "`+topinvites` → Affiche le classement des invitations.",
                        "`+help` → Affiche cette aide."
                    ].join('\n'),
                },
                {
                    name: '🔒 Modérateurs / Staff / Owner',
                    value: [
                        "`+warn` → Avertir un membre.",
                        "`+warninfo` → Voir les warns d’un membre.",
                        "`+unwarn` → Retirer un warn avec confirmation.",
                        "`+ban` → Bannir un utilisateur.",
                        "`+renew` → Supprimer et recréer un salon.",
                        "`+antilink` → Activer ou désactiver l’anti-link."
                    ].join('\n'),
                }
            )
            .setFooter({ text: 'Utilise le préfixe pour interagir avec le bot.' })
            .setColor(0x3498db)
            .setTimestamp();

        await message.reply({ embeds: [embed] });
    }
};
