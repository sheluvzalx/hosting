import { Client, GatewayIntentBits, PermissionsBitField, ChannelType } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.BOT_TOKEN) {
    console.error('Error: BOT_TOKEN is not defined in the environment variables.');
    process.exit(1);
}

const config = {
    prefix: '-',
    welcomeChannelName: 'welcome',
    goodbyeChannelName: 'bye',
};

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.once('ready', () => {
    console.log(`✨-----------------------------------------✨`);
    console.log(`🎉 Logged in as ${client.user.tag}! 🎉`);
    console.log(`✨-----------------------------------------✨`);
    client.user.setActivity('🤖 Execute -clc', { type: 'PLAYING' });
    console.log(`🤖 Bot is online and ready! 🤖`);
    client.user.setStatus('online');
    console.log(`🟢 Status set to online 🟢`);
});

client.on('guildCreate', guild => {
    console.log(`🌟 Joined new guild: ${guild.name} 🌟`);

    const welcomeChannel = guild.channels.cache.find(ch => ch.name.toLowerCase().includes(config.welcomeChannelName));
    const goodbyeChannel = guild.channels.cache.find(ch => ch.name.toLowerCase().includes(config.goodbyeChannelName));

    if (welcomeChannel) {
        welcomeChannel.send(`🎉 Hello everyone in ${guild.name}! I'm happy to be here! 🎉`);
    } else {
        console.log('No welcome channel found. Please make sure you have a "welcome" channel or similar.');
    }

    if (goodbyeChannel) {
        goodbyeChannel.send(`😢 Goodbye! Sorry to leave ${guild.name}. 😢`);
    } else {
        console.log('No goodbye channel found. Please make sure you have a "bye" channel or similar.');
    }

    console.log(`Default configuration for server ${guild.name}:`);
    console.log(`Prefix: ${config.prefix}`);
});

client.on('guildDelete', guild => {
    console.log(`💔 Removed from guild: ${guild.name} 💔`);
});

client.on('guildMemberAdd', member => {
    const welcomeChannel = member.guild.channels.cache.find(ch => ch.name.toLowerCase().includes(config.welcomeChannelName));
    if (!welcomeChannel) return;
    welcomeChannel.send(`🎉 Welcome to the server, ${member}! 🎉`);
});

client.on('guildMemberRemove', member => {
    const goodbyeChannel = member.guild.channels.cache.find(ch => ch.name.toLowerCase().includes(config.goodbyeChannelName));
    if (!goodbyeChannel) return;
    goodbyeChannel.send(`😢 ${member} has left the server. 😢`);
});

client.on('messageCreate', async message => {
    if (message.author.bot || !message.content.startsWith(config.prefix)) return;

    const args = message.content.slice(config.prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    switch (command) {
        case 'ping':
            const msg = await message.channel.send('🏓 Pinging...');
            msg.edit(`🏓 Pong! Latency is ${msg.createdTimestamp - message.createdTimestamp}ms. API Latency is ${Math.round(client.ws.ping)}ms`);
            break;

        case 'ad':
            if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                return message.reply('🚫 You do not have permissions to use that command.');
            }
            const adChannel = message.guild.channels.cache.find(ch =>
                ['anuncios', 'announcements', 'annunci', 'ankündigungen', 'annonces'].includes(ch.name.toLowerCase())
            );
            if (adChannel) {
                const embed = {
                    color: 0x0099ff,
                    title: 'GUILD AD',
                    description: args.join(' '),
                    timestamp: new Date(),
                    footer: { text: 'Administration team' },
                };
                await adChannel.send({ embeds: [embed], content: '@everyone' });
            } else {
                message.reply('❗ Could not find the channel to send the ad.');
            }
            break;

        case 'user-info':
            message.channel.send(`👤 Your username: ${message.author.username}\n🆔 Your ID: ${message.author.id}`);
            break;

        case 'kick':
            if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
                return message.reply('🚫 You do not have permissions to use that command.');
            }
            const kickMember = message.mentions.members.first();
            if (!kickMember) {
                return message.reply('❗ Please mention a valid member of this server.');
            }
            if (!kickMember.kickable) {
                return message.reply('❌ I cannot kick this user! Do they have a higher role? Do I have kick permissions?');
            }
            const kickReason = args.slice(1).join(' ') || 'No reason provided';
            try {
                await kickMember.kick(kickReason);
                message.reply(`✅ ${kickMember.user.tag} has been kicked by ${message.author.tag} because: ${kickReason}`);
            } catch (error) {
                message.reply(`😞 Sorry ${message.author} I couldn't kick because of: ${error}`);
            }
            break;

        case 'ban':
            if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
                return message.reply('🚫 You do not have permissions to use that command.');
            }
            const banMember = message.mentions.members.first();
            if (!banMember) {
                return message.reply('❗ Please mention a valid member of this server.');
            }
            if (!banMember.bannable) {
                return message.reply('❌ I cannot ban this user! Do they have a higher role? Do I have ban permissions?');
            }
            const banReason = args.slice(1).join(' ') || 'No reason provided';
            try {
                await banMember.ban({ reason: banReason });
                message.reply(`✅ ${banMember.user.tag} has been banned by ${message.author.tag} because: ${banReason}`);
            } catch (error) {
                message.reply(`😞 Sorry ${message.author} I couldn't ban because of: ${error}`);
            }
            break;

        case 'prune':
            if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
                return message.reply('🚫 You do not have permissions to use that command.');
            }
            const amount = parseInt(args[0]);
            if (isNaN(amount) || amount < 1 || amount > 100) {
                return message.reply('❗ Please provide a number between 1 and 100 for the number of messages to delete.');
            }
            try {
                await message.channel.bulkDelete(amount, true);
                message.channel.send(`✅ Successfully deleted ${amount} messages`).then(msg => {
                    setTimeout(() => msg.delete(), 5000);
                });
            } catch (error) {
                message.reply(`😞 Sorry ${message.author} I couldn't delete messages because of: ${error}`);
            }
            break;

        case 'help':
            message.channel.send(`📜 **Available Commands:**
            \`-ping\` - Check the bot's latency.
            \`-user-info\` - Get your user info.
            \`-kick [@user] [reason]\` - Kick a user.
            \`-ban [@user] [reason]\` - Ban a user.
            \`-prune [number]\` - Delete a number of messages.
            \`-ad [message]\` - Send an ad to the guild.
            \`-server-info\` - Get server information.
            \`-avatar [@user]\` - Get the avatar of a user.
            \`-mute [@user]\` - Mute a user.
            \`-unmute [@user]\` - Unmute a user.
            \`-server-icon\` - Get the server icon.
            \`-role-info [role name]\` - Get information about a role.`);
            break;

        case 'server-info':
            const serverEmbed = {
                color: 0x0099ff,
                title: `${message.guild.name} Info`,
                fields: [
                    { name: 'Server Name', value: message.guild.name },
                    { name: 'Total Members', value: message.guild.memberCount.toString() },
                    { name: 'Created At', value: message.guild.createdAt.toDateString() },
                    { name: 'Region', value: message.guild.region },
                ],
                timestamp: new Date(),
                footer: { text: 'Server Info' },
            };
            message.channel.send({ embeds: [serverEmbed] });
            break;

        case 'avatar':
            const user = message.mentions.users.first() || message.author;
            message.channel.send(`${user.username}'s avatar: ${user.displayAvatarURL({ dynamic: true })}`);
            break;

        case 'mute':
            if (!message.member.permissions.has(PermissionsBitField.Flags.MuteMembers)) {
                return message.reply('🚫 You do not have permissions to use that command.');
            }
            const muteMember = message.mentions.members.first();
            if (!muteMember) {
                return message.reply('❗ Please mention a valid member of this server.');
            }
            const muteRole = message.guild.roles.cache.find(role => role.name === 'Muted');
            if (!muteRole) {
                return message.reply('❗ Could not find a "Muted" role.');
            }
            try {
                await muteMember.roles.add(muteRole);
                message.reply(`✅ ${muteMember.user.tag} has been muted.`);
            } catch (error) {
                message.reply(`😞 Sorry ${message.author} I couldn't mute because of: ${error}`);
            }
            break;

        case 'unmute':
            if (!message.member.permissions.has(PermissionsBitField.Flags.MuteMembers)) {
                return message.reply('🚫 You do not have permissions to use that command.');
            }
            const unmuteMember = message.mentions.members.first();
            if (!unmuteMember) {
                return message.reply('❗ Please mention a valid member of this server.');
            }
            const unmuteRole = message.guild.roles.cache.find(role => role.name === 'Muted');
            if (!unmuteRole) {
                return message.reply('❗ Could not find a "Muted" role.');
            }
            try {
                await unmuteMember.roles.remove(unmuteRole);
                message.reply(`✅ ${unmuteMember.user.tag} has been unmuted.`);
            } catch (error) {
                message.reply(`😞 Sorry ${message.author} I couldn't unmute because of: ${error}`);
            }
            break;

        case 'server-icon':
            message.channel.send(`🖼️ Server icon: ${message.guild.iconURL({ dynamic: true })}`);
            break;

        case 'role-info':
            const roleName = args.join(' ');
            const role = message.guild.roles.cache.find(r => r.name.toLowerCase() === roleName.toLowerCase());
            if (!role) {
                return message.reply('❗ Role not found.');
            }
            const roleEmbed = {
                color: role.color,
                title: `${role.name} Info`,
                fields: [
                    { name: 'Role Name', value: role.name },
                    { name: 'Role ID', value: role.id },
                    { name: 'Color', value: role.hexColor },
                    { name: 'Created At', value: role.createdAt.toDateString() },
                    { name: 'Members', value: role.members.size.toString() },
                ],
                timestamp: new Date(),
                footer: { text: 'Role Info' },
            };
            message.channel.send({ embeds: [roleEmbed] });
            break;

            case 'clc':
                if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                    return message.reply('🚫 You do not have permissions to use that command.');
                }
                const logChannelName = args[0] || 'bot-logs';
                try {
                    const logChannel = await message.guild.channels.create({
                        name: logChannelName,
                        type: ChannelType.GuildText,
                        permissionOverwrites: [
                            {
                                id: message.guild.id,
                                deny: [PermissionsBitField.Flags.SendMessages],
                            },
                            {
                                id: message.guild.roles.everyone.id,
                                allow: [PermissionsBitField.Flags.ViewChannel],
                            },
                        ],
                    });
                    message.reply(`✅ Log channel created: ${logChannel}`);
                    client.logChannel = logChannel;
                } catch (error) {
                    message.reply(`😞 Sorry ${message.author}, I couldn't create the log channel because of: ${error}`);
                }
                break;
    
            // Other commands...
        default:
            message.reply('❓ Unknown command. Use `-help` to see the list of available commands.');
    }
});

client.on('messageDelete', message => {
    console.log(`🗑️ A message by ${message.author.tag} was deleted in ${message.channel.name}`);
});

client.on('messageUpdate', (oldMessage, newMessage) => {
    if (oldMessage.content === newMessage.content) return;
    console.log(`✏️ A message by ${oldMessage.author.tag} was edited in ${oldMessage.channel.name}`);
    console.log(`From: ${oldMessage.content}`);
    console.log(`To: ${newMessage.content}`);
});

client.login(process.env.BOT_TOKEN).catch(error => {
    console.error('Failed to login:', error);
});

client.on('channelCreate', channel => {
    console.log(`📢 A new channel named ${channel.name} was created!`);
});

client.on('channelDelete', channel => {
    console.log(`🗑️ A channel named ${channel.name} was deleted!`);
});

client.on('roleCreate', role => {
    console.log(`🔧 A new role named ${role.name} was created!`);
});

client.on('roleDelete', role => {
    console.log(`🗑️ A role named ${role.name} was deleted!`);
});

client.on('emojiCreate', emoji => {
    console.log(`😀 A new emoji named ${emoji.name} was created!`);
});

client.on('emojiDelete', emoji => {
    console.log(`😢 An emoji named ${emoji.name} was deleted!`);
});

client.on('guildBanAdd', (guild, user) => {
    console.log(`🔨 ${user.tag} was banned from ${guild.name}`);
});

client.on('guildBanRemove', (guild, user) => {
    console.log(`🔓 ${user.tag} was unbanned from ${guild.name}`);
});

client.on('guildMemberUpdate', oldMember => {
    console.log(`🔄 ${oldMember.user.tag} was updated in ${oldMember.guild.name}`);
});

client.on('presenceUpdate', (_, newPresence) => {
    console.log(`👤 ${newPresence.user.tag} presence updated`);
});

client.on('voiceStateUpdate', (_, newState) => {
    console.log(`🎤 ${newState.member.user.tag} voice state updated`);
});

client.on('messageReactionAdd', (reaction, user) => {
    console.log(`👍 ${user.tag} reacted with ${reaction.emoji.name}`);
});

client.on('messageReactionRemove', (reaction, user) => {
    console.log(`👎 ${user.tag} removed their reaction of ${reaction.emoji.name}`);
});

client.on('typingStart', (channel, user) => {
    console.log(`⌨️ ${user.tag} started typing in ${channel.name}`);
});

client.on('typingStop', (channel, user) => {
    console.log(`🛑 ${user.tag} stopped typing in ${channel.name}`);
});

client.on('webhookUpdate', channel => {
    console.log(`🔔 Webhook updated in ${channel.name}`);
});

client.on('stickerCreate', sticker => {
    console.log(`🏷️ A new sticker named ${sticker.name} was created!`);
});

client.on('stickerDelete', sticker => {
    console.log(`🗑️ A sticker named ${sticker.name} was deleted!`);
});

client.on('stickerUpdate', (oldSticker, newSticker) => {
    console.log(`🔄 A sticker named ${oldSticker.name} was updated to ${newSticker.name}`);
});

client.on('guildScheduledEventCreate', event => {
    console.log(`📅 A new event named ${event.name} was created in ${event.guild.name}`);
});

client.on('guildScheduledEventDelete', event => {
    console.log(`🗑️ An event named ${event.name} was deleted in ${event.guild.name}`);
});

client.on('guildScheduledEventUpdate', (oldEvent, newEvent) => {
    console.log(`🔄 An event named ${oldEvent.name} was updated to ${newEvent.name} in ${oldEvent.guild.name}`);
});

client.on('guildScheduledEventUserAdd', (event, user) => {
    console.log(`➕ ${user.tag} is interested in the event ${event.name}`);
});

client.on('guildScheduledEventUserRemove', (event, user) => {
    console.log(`➖ ${user.tag} is no longer interested in the event ${event.name}`);
});

client.on('stageInstanceCreate', stageInstance => {
    console.log(`🎤 A new stage instance named ${stageInstance.channel.name} was created!`);
});

client.on('stageInstanceDelete', stageInstance => {
    console.log(`🗑️ A stage instance named ${stageInstance.channel.name} was deleted!`);
});

client.on('stageInstanceUpdate', (oldStageInstance, newStageInstance) => {
    console.log(`🔄 A stage instance named ${oldStageInstance.channel.name} was updated to ${newStageInstance.channel.name}`);
});

client.on('threadCreate', thread => {
    console.log(`🧵 A new thread named ${thread.name} was created!`);
});

client.on('threadDelete', thread => {
    console.log(`🗑️ A thread named ${thread.name} was deleted!`);
});

client.on('threadUpdate', (oldThread, newThread) => {
    console.log(`🔄 A thread named ${oldThread.name} was updated to ${newThread.name}`);
});

client.on('threadMemberUpdate', oldMember => {
    console.log(`🔄 A thread member in ${oldMember.thread.name} was updated!`);
});

client.on('threadMembersUpdate', (_, __, thread) => {
    console.log(`🔄 Thread members in ${thread.name} were updated!`);
});

client.on('guildIntegrationsUpdate', guild => {
    console.log(`🔄 Integrations were updated in ${guild.name}`);
});

client.on('inviteCreate', invite => {
    console.log(`✉️ A new invite was created in ${invite.guild.name}`);
});

client.on('inviteDelete', invite => {
    console.log(`🗑️ An invite was deleted in ${invite.guild.name}`);
});

client.on('guildUpdate', (oldGuild, newGuild) => {
    console.log(`🔄 The guild ${oldGuild.name} was updated to ${newGuild.name}`);
});

client.on('guildUnavailable', guild => {
    console.log(`⚠️ The guild ${guild.name} is currently unavailable`);
});

client.on('guildMemberAvailable', member => {
    console.log(`👤 The member ${member.user.tag} is now available in ${member.guild.name}`);
});

client.on('guildMembersChunk', (_, guild) => {
    console.log(`👥 A chunk of members was received in ${guild.name}`);
});


const originalConsoleLog = console.log;
console.log = function (...args) {
    originalConsoleLog.apply(console, args);
    if (client.logChannel) {
        client.logChannel.send(args.join(' '));
    }
};