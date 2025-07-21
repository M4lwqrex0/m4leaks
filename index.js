const { Client, GatewayIntentBits, Partials, Events, Collection, ActivityType } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config/config');
const express = require('express');
const app = express();

const prefix = config.prefix;

const invitesPath = path.join(__dirname, 'data', 'invites.json');
const joinsPath = path.join(__dirname, 'data', 'joins.json');
function ensureJsonFileExistsAndValid(filePath) {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, '{}');
        return;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    if (!content || content.trim() === '') {
        fs.writeFileSync(filePath, '{}');
    } else {
        try {
            JSON.parse(content);
        } catch (err) {
            console.warn(`⚠️ ${path.basename(filePath)} corrompu, réinitialisé.`);
            fs.writeFileSync(filePath, '{}');
        }
    }
}

ensureJsonFileExistsAndValid(invitesPath);
ensureJsonFileExistsAndValid(joinsPath);

let cachedInvites = new Map();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
    partials: [Partials.GuildMember]
});

// Chargement des commandes prefix
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    if (command.name && typeof command.run === 'function') {
        client.commands.set(command.name, command);
    }
}


client.once(Events.ClientReady, async () => {
    console.log(`✅ Connecté en tant que ${client.user.tag}`);

    const antiPath = path.join(__dirname, 'data', 'anticonfig.json');
    const defaultConfig = { antilink: true };

    try {
        fs.writeFileSync(antiPath, JSON.stringify(defaultConfig, null, 2));
        console.log("✅ Anti-link activé automatiquement au lancement.");
    } catch (err) {
        console.error("❌ Impossible d'écrire dans anticonfig.json :", err);
    }

    for (const [guildId, guild] of client.guilds.cache) {
        const invites = await guild.invites.fetch().catch(() => new Map());
        cachedInvites.set(guildId, invites);
    }

    const guild = client.guilds.cache.get(config.guildId);
    if (!guild) return console.error("❌ Guild non trouvée via config.guildId");

    const updateVipStatus = async () => {
        await guild.members.fetch(); 

        const roleVip = guild.roles.cache.get(config.roles.vip);
        if (!roleVip) return console.warn("⚠️ Rôle VIP non trouvé");

        const vipCount = roleVip.members.size;

        client.user.setPresence({
            activities: [{
                name: `${vipCount} VIP`,
                type: ActivityType.Watching
            }],
            status: 'online'
        });
    };

    await updateVipStatus();
    setInterval(updateVipStatus, 5000);
});


client.on(Events.GuildMemberAdd, async (member) => {
    const guild = member.guild;
    const welcomeChannel = guild.channels.cache.get(config.welcomeChannelId);
    if (!welcomeChannel) return;

    const joinsData = JSON.parse(fs.readFileSync(joinsPath));
    joinsData[member.id] = (joinsData[member.id] || 0) + 1;
    fs.writeFileSync(joinsPath, JSON.stringify(joinsData, null, 2));
    const joinCount = joinsData[member.id];

    const accountAgeMs = Date.now() - member.user.createdAt.getTime();
    const ageMonths = Math.floor(accountAgeMs / (1000 * 60 * 60 * 24 * 30));
    const ageDays = Math.floor(accountAgeMs / (1000 * 60 * 60 * 24));
    const ageHours = Math.floor(accountAgeMs / (1000 * 60 * 60));

    const formattedAge = ageMonths >= 1
        ? `${ageMonths} mois`
        : ageDays >= 1
            ? `${ageDays} jour(s)`
            : `${ageHours} heure(s)`;

    const oldInvites = cachedInvites.get(guild.id) || new Map();
    const newInvites = await guild.invites.fetch().catch(() => new Map());
    cachedInvites.set(guild.id, newInvites);

    let inviter = null;

    for (const [code, invite] of newInvites) {
        const previousUses = oldInvites.get(code)?.uses || 0;
        if (invite.uses > previousUses) {
            inviter = invite.inviter;
            break;
        }
    }

    const invitesData = JSON.parse(fs.readFileSync(invitesPath));
    if (inviter) {
        invitesData[inviter.id] = (invitesData[inviter.id] || 0) + 1;
        fs.writeFileSync(invitesPath, JSON.stringify(invitesData, null, 2));
    }

    const inviterText = inviter
        ? `Il/Elle a été invité(e) par **${inviter.tag}** (qui obtient ${invitesData[inviter.id]} invitation${invitesData[inviter.id] > 1 ? 's' : ''}).`
        : `Inviteur inconnu.`;

    const totalMembers = guild.memberCount;

    const autoRole = guild.roles.cache.get(config.roles.membre);
    if (autoRole) {
        try {
            await member.roles.add(autoRole);
            console.log(`✅ Rôle "membre" attribué à ${member.user.tag}`);
        } catch (err) {
            console.error(`❌ Impossible d'attribuer le rôle membre à ${member.user.tag} :`, err);
        }
    } else {
        console.warn('⚠️ Le rôle membre est introuvable dans le cache du serveur.');
    }

    const welcomeMessage = `<@${member.id}> vient de nous rejoindre pour la ${joinCount}ᵉ fois, son compte a été créé \`il y a ${formattedAge}\`. ${inviterText} Nous sommes désormais ${totalMembers} !`;

    try {
        await welcomeChannel.send({ content: welcomeMessage });
    } catch (err) {
        console.error("❌ Erreur lors de l'envoi du message de bienvenue :", err);
    }
});

const antiPath = path.join(__dirname, 'data', 'anticonfig.json');
if (!fs.existsSync(antiPath)) fs.writeFileSync(antiPath, JSON.stringify({ antilink: false }, null, 2));

client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot || !message.guild) return;

    if (message.content.startsWith(prefix)) {
        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        const command = client.commands.get(commandName);
        if (command) {
            try {
                await command.run(message, args, client);
            } catch (err) {
                console.error(`Erreur dans la commande ${commandName} :`, err);
                await message.reply('Une erreur est survenue lors de l’exécution.');
            }
        }
        return;
    }

    const linkRegex = /(https?:\/\/|discord\.gg|discord\.com\/invite)/i;
    if (!linkRegex.test(message.content)) return;

    const { antilink } = JSON.parse(fs.readFileSync(antiPath));
    if (!antilink) return;

    const allowed = [
        config.roles.owner,
        config.roles.staff,
        config.roles.moderateur
    ].some(r => message.member.roles.cache.has(r));

    if (allowed) return;

    try {
        await message.delete();
        await message.channel.send({ content: `🚫 <@${message.author.id}> vous n'avez pas l'autorisation d'envoyer des liens ici.` });
    } catch (err) {
        console.error('Anti-link - erreur suppression :', err);
    }
});

client.on(Events.InteractionCreate, async (interaction) => {
    if (interaction.isButton()) {
        const warnsPath = path.join(__dirname, 'data', 'warns.json');
        const customId = interaction.customId;

        if (customId === 'cancel_unwarn') {
            return await interaction.update({
                content: '❌ Suppression annulée.',
                components: [],
                embeds: []
            });
        }

        if (customId.startsWith('confirm_unwarn_')) {
            const [, , userId, warnIndexStr] = customId.split('_');
            const warnIndex = parseInt(warnIndexStr);

            if (!fs.existsSync(warnsPath)) return;

            const warnsData = JSON.parse(fs.readFileSync(warnsPath));
            const userWarns = warnsData[userId];

            if (!userWarns || !userWarns[warnIndex]) {
                return await interaction.update({
                    content: `❌ Impossible de trouver le warn #${warnIndex + 1}.`,
                    components: [],
                    embeds: []
                });
            }

            const removedWarn = userWarns.splice(warnIndex, 1)[0];
            if (userWarns.length === 0) delete warnsData[userId];

            fs.writeFileSync(warnsPath, JSON.stringify(warnsData, null, 2));

            return await interaction.update({
                content: `✅ Le warn a été retiré : \`${removedWarn.reason}\``,
                components: [],
                embeds: []
            });
        }
    }
});

client.login(config.token);


const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Bot en ligne ✅');
});

app.listen(PORT, () => {
    console.log(`🌐 Serveur web actif sur le port ${PORT}`);
});
