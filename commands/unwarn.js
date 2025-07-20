const {
    SlashCommandBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    PermissionFlagsBits
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../config/config');

const warnsPath = path.join(__dirname, '../data/warns.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unwarn')
        .setDescription("Affiche tous les warns et propose de les retirer.")
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
        .addUserOption(option =>
            option.setName('membre')
                .setDescription('Le membre concerné')
                .setRequired(true)
        ),

    async execute(interaction) {
        const user = interaction.options.getUser('membre');
        const memberRoles = interaction.member.roles.cache;

        const allowed = [
            config.roles.owner,
            config.roles.staff,
            config.roles.moderateur
        ].some(roleId => memberRoles.has(roleId));

        if (!allowed) {
            return interaction.reply({
                content: "❌ Tu n’as pas la permission d’utiliser cette commande.",
                ephemeral: false
            });
        }

        if (!fs.existsSync(warnsPath)) {
            return interaction.reply({ content: "📁 Aucun fichier de warns trouvé.", ephemeral: false });
        }

        const warnsData = JSON.parse(fs.readFileSync(warnsPath));
        const userWarns = warnsData[user.id];

        if (!userWarns || userWarns.length === 0) {
            return interaction.reply({
                content: `ℹ️ Aucun avertissement trouvé pour <@${user.id}>.`,
                ephemeral: false
            });
        }

        const embed = new EmbedBuilder()
            .setTitle(`Liste des warns de ${user.tag}`)
            .setDescription("Sélectionne un warn à retirer ci-dessous.")
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
                    .setCustomId(`confirm_unwarn_${user.id}_${index}`)
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

        await interaction.reply({
            embeds: [embed],
            components: [row],
            ephemeral: false
        });
    }
};
