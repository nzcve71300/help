const { Client, GatewayIntentBits, Collection, Events, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Import custom modules
const EconomyService = require('./services/EconomyService');
const ModerationService = require('./services/ModerationService');
const GameManager = require('./services/GameManager');
const SurveyManager = require('./services/SurveyManager');
const DatabaseService = require('./services/DatabaseService');
const ServerService = require('./services/ServerService');

class SeedyBot {
    constructor() {
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildMessageReactions
            ]
        });

        this.commands = new Collection();
        this.cooldowns = new Collection();
        
        // Initialize services
        this.database = new DatabaseService();
        this.economy = new EconomyService(this.database);
        this.moderation = new ModerationService();
        this.gameManager = new GameManager(this.economy);
        this.surveyManager = new SurveyManager(this.database);
        this.serverService = null; // Will be initialized after database is ready
        // AI Service removed

        // Channel IDs
        this.zorpChannelId = '1387306698192064554';
        this.supportChannelId = '1360485036973097224';
        this.warningImageUrl = 'https://i.imgur.com/xxdt9Ww.png';
        
        // Allowed server ID
        this.allowedServerId = '1359052156996681881';

        // Channel monitoring system
        this.channelKeywords = {
            'announcement': {
                keywords: ['announcement', 'announcements', 'news', 'update', 'updates'],
                channelId: '1360935343553122375',
                title: '📢 Announcements',
                description: 'Check out the latest announcements and news!'
            },
            'votes': {
                keywords: ['vote', 'votes', 'voting', 'poll', 'polls', 'election'],
                channelId: '1362029892052582520',
                title: '🗳️ Voting',
                description: 'Participate in server votes and polls!'
            },
            'information': {
                keywords: ['information', 'info', 'informations', 'details', 'help', 'support'],
                channelId: '1395761174368223393',
                title: 'ℹ️ Information',
                description: 'Find important server information here!'
            },
            'advertising': {
                keywords: ['advertising', 'advertise', 'promote', 'promotion', 'server ad', 'server advertising'],
                channelId: '1370145190387384390',
                title: '📢 Server Advertising',
                description: 'Advertise your server here!'
            },
            'alliance': {
                keywords: ['alliance', 'alliances', 'register', 'registration', 'partner', 'partnership'],
                channelId: '1396771029518389269',
                title: '🤝 Alliance Registration',
                description: 'Register for server alliances!'
            },
            'giveaway': {
                keywords: ['giveaway', 'giveaways', 'prize', 'prizes', 'contest', 'win'],
                channelId: '1390350799003189322',
                title: '🎁 Giveaways',
                description: 'Check out active giveaways and contests!'
            },
            'battlepass': {
                keywords: ['battlepass', 'battle pass', 'pass', 'season', 'rewards'],
                channelId: '1390208214343090277',
                title: '🎮 Battlepass',
                description: 'View the current battlepass and rewards!'
            },
            'ticket': {
                keywords: ['ticket', 'tickets', 'support', 'help', 'issue', 'problem'],
                channelId: '1360485036973097224',
                title: '🎫 Support Tickets',
                description: 'Create a support ticket for help!'
            },
            'seedtag': {
                keywords: ['seed tag', 'seedtag', 'club', 'membership', 'premium'],
                channelId: '1414866149845504101',
                title: '🌱 SEED TAG Club',
                description: 'Join the exclusive SEED TAG Club!'
            },
            'mainchat': {
                keywords: ['main chat', 'general', 'chat', 'talk', 'discuss'],
                channelId: '1359716367997341716',
                title: '💬 Main Chat',
                description: 'Join the main server chat!'
            },
            'worldwide': {
                keywords: ['worldwide', 'global', 'international', 'world chat'],
                channelId: '1359716323898167626',
                title: '🌍 World Wide Chat',
                description: 'Chat with people from around the world!'
            },
            'botcommands': {
                keywords: ['bot commands', 'bot command', 'commands', 'bot', 'seedy'],
                channelId: '1359716430412517457',
                title: '🤖 Bot Commands',
                description: 'Use bot commands here!'
            },
            'clips': {
                keywords: ['clips', 'clip', 'video', 'videos', 'recording', 'recordings'],
                channelId: '1406902542419492874',
                title: '🎬 Your Clips',
                description: 'Share your awesome clips and videos!'
            },
            'verified': {
                keywords: ['verified', 'verification', 'link', 'linked', 'connect'],
                channelId: '1412748207825490021',
                title: '✅ Verified & Linked',
                description: 'Get verified and link your accounts!'
            },
            'zorp': {
                keywords: ['zorp', 'zorps', 'rider', 'rider infos', 'zorp info'],
                channelId: '1387306698192064554',
                title: '🌱 ZORP & Rider Infos',
                description: 'Find all ZORP and Rider information here!'
            },
            'roles': {
                keywords: ['roles', 'role', 'choose role', 'select role', 'permissions'],
                channelId: '1359714343112937508',
                title: '🎭 Choose Your Roles',
                description: 'Select your server roles and permissions!'
            },
            'rules': {
                keywords: ['rules', 'rule', 'guidelines', 'policy', 'policies'],
                channelId: '1359714261487845609',
                title: '📋 Rules',
                description: 'Read the server rules and guidelines!'
            },
            'kits': {
                keywords: ['kit', 'kits', 'free kit', 'elite kit', 'kit list', 'items', 'gear'],
                channelId: '1387306291877253293',
                title: '🎒 Kit Lists',
                description: 'Check out all available kits and items!',
                additionalChannels: [
                    { name: 'Elite Kit List Part 1', id: '1387306145781121185' },
                    { name: 'Elite Kit List Part 2', id: '1393469061022744636' },
                    { name: 'Elite Kit List Part 3', id: '1410858031058784356' }
                ]
            },
            'guides': {
                keywords: ['guide', 'guides', 'tutorial', 'tutorials', 'how to', 'help'],
                channelId: '1387311000776347701',
                title: '📚 Guides',
                description: 'Find helpful guides and tutorials!'
            }
        };

        this.setupEventHandlers();
        this.loadCommands();
    }

    setupEventHandlers() {
        // Bot ready event
        this.client.once(Events.ClientReady, async (readyClient) => {
            console.log(`🌱 Seedy is ready! Logged in as ${readyClient.user.tag}`);
            this.client.user.setActivity('with seeds and helping users!', { type: 'PLAYING' });
            
            // Initialize database
            await this.database.initialize();
            
            // Initialize ServerService after database is ready
            this.serverService = new ServerService(this.database);
            
            // Create SeedyAdmin role in all guilds
            await this.createSeedyAdminRole();
        });

        // Message handling
        this.client.on(Events.MessageCreate, async (message) => {
            if (message.author.bot) return;
            
            // Check if message is from the allowed server
            if (message.guild && message.guild.id !== this.allowedServerId) {
                return; // Ignore messages from unauthorized servers
            }

            // Handle channel keyword monitoring
            await this.handleChannelMonitoring(message);

            // Handle moderation
            await this.moderation.handleMessage(message, this);

            // Handle bot mentions (AI removed)
            if (message.mentions.has(this.client.user)) {
                await this.handleMention(message);
            }

            // Handle commands
            if (message.content.startsWith(process.env.BOT_PREFIX || '!')) {
                await this.handleCommand(message);
            }
        });

        // Guild join event
        this.client.on(Events.GuildCreate, async (guild) => {
            console.log(`🌱 Seedy joined new server: ${guild.name} (${guild.id})`);
            
            // Check if this is the allowed server
            if (guild.id !== this.allowedServerId) {
                console.log(`❌ Unauthorized server detected. Leaving ${guild.name} (${guild.id})`);
                
                // Send a message to the server owner before leaving
                try {
                    const owner = await guild.fetchOwner();
                    await owner.send({
                        content: `❌ **Seedy Bot Access Denied**\n\nThis bot is restricted to a specific server and cannot be used on other servers.\n\nIf you believe this is an error, please contact the bot owner.`
                    });
                } catch (error) {
                    console.log('Could not send DM to server owner:', error.message);
                }
                
                // Leave the server
                await guild.leave();
                return;
            }
            
            // Create SeedyAdmin role for the allowed server
            await this.createSeedyAdminRole(guild);
        });

        // Interaction handling for surveys and buttons
        this.client.on(Events.InteractionCreate, async (interaction) => {
            // Check if interaction is from the allowed server
            if (interaction.guild && interaction.guild.id !== this.allowedServerId) {
                return interaction.reply({
                    content: '❌ This bot is restricted to a specific server.',
                    ephemeral: true
                });
            }
            
            if (interaction.isChatInputCommand()) {
                await this.handleSlashCommand(interaction);
            } else if (interaction.isButton()) {
                // Check if it's a game button or survey button
                if (interaction.customId.startsWith('ttt_') || interaction.customId.startsWith('c4_') || 
                    interaction.customId.startsWith('bs_') || interaction.customId.startsWith('rummy_') ||
                    interaction.customId.startsWith('poker_') || interaction.customId.startsWith('uno_')) {
                    await this.handleGameButton(interaction);
                } else {
                    await this.surveyManager.handleButton(interaction);
                }
            } else if (interaction.isModalSubmit()) {
                await this.surveyManager.handleModal(interaction, this);
            } else if (interaction.isStringSelectMenu()) {
                await this.handleServerSelectMenu(interaction);
            }
        });
    }

    async handleChannelMonitoring(message) {
        const content = message.content.toLowerCase();
        
        // Check for channel keywords
        for (const [category, config] of Object.entries(this.channelKeywords)) {
            if (config.keywords.some(keyword => content.includes(keyword.toLowerCase()))) {
                const embed = new EmbedBuilder()
                    .setTitle(config.title)
                    .setDescription(`Hello ${message.author}, ${config.description}`)
                    .setColor(0x006400) // Dark green
                    .setTimestamp();

                // Add main channel
                embed.addFields({
                    name: '📍 Main Channel',
                    value: `<#${config.channelId}>`,
                    inline: false
                });

                // Add additional channels if they exist (like for kits)
                if (config.additionalChannels) {
                    let additionalChannels = '';
                    config.additionalChannels.forEach(channel => {
                        additionalChannels += `• **${channel.name}**: <#${channel.id}>\n`;
                    });
                    
                    embed.addFields({
                        name: '📂 Additional Channels',
                        value: additionalChannels,
                        inline: false
                    });
                }

                // Special handling for specific categories (include images)
                if (category === 'zorp') {
                    embed.setImage('https://i.imgur.com/O8xh49D.png');
                } else if (category === 'kits') {
                    embed.setImage('https://i.imgur.com/l30wM88.jpeg');
                } else if (category === 'seedtag') {
                    embed.setImage('https://i.imgur.com/mcLzmW2.png');
                } else {
                    // Default image for all other responses
                    embed.setImage('https://i.imgur.com/ieP1fd5.jpeg');
                }

                await message.reply({ embeds: [embed] });
                return; // Only respond to the first match
            }
        }
    }

    async handleMention(message) {
        try {
            // Extract the question from the message (remove the mention)
            const content = message.content.replace(/<@!?\d+>/g, '').trim();
            
            if (!content) {
                return; // No question asked, just a mention
            }

            // Simple responses without AI
            const responses = [
                "🌱 Hello there! I'm Seedy, your friendly Discord bot! How can I help you today?",
                "🎮 Hey! Want to play a game or need help with something? I'm here for you!",
                "🌱 Hi! I can help with games, ZORP questions, or just chat! What's up?",
                "🎯 Hello! I'm Seedy and I'm here to make your Discord experience awesome!",
                "🌱 Hey there! Need help with anything? I'm your friendly neighborhood bot!",
                "🎮 Hi! I love helping out! What can I do for you today?"
            ];

            const randomResponse = responses[Math.floor(Math.random() * responses.length)];
            
            const embed = new EmbedBuilder()
                .setTitle('🌱 Seedy Response')
                .setDescription(randomResponse)
                .setColor(0x00ff00)
                .setThumbnail('https://i.imgur.com/ieP1fd5.jpeg')
                .setFooter({ 
                    text: 'Powered by Seedy', 
                    iconURL: 'https://i.imgur.com/ieP1fd5.jpeg' 
                })
                .setTimestamp();

            await message.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Mention handling error:', error);
            // Don't send error message to avoid spam, just log it
        }
    }

    async handleCommand(message) {
        const args = message.content.slice((process.env.BOT_PREFIX || '!').length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        const command = this.commands.get(commandName) || 
                       this.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

        if (!command) return;

        // Check permissions for non-economy commands
        if (!this.isEconomyCommand(commandName) && !this.hasSeedyAdminRole(message.member)) {
            return message.reply('❌ You need the **SeedyAdmin** role to use this command!');
        }

        // Cooldown check
        if (this.cooldowns.has(command.name)) {
            const cooldown = this.cooldowns.get(command.name);
            if (Date.now() < cooldown) {
                const timeLeft = (cooldown - Date.now()) / 1000;
                return message.reply(`⏰ Please wait ${timeLeft.toFixed(1)} seconds before using this command again.`);
            }
        }

        try {
            await command.execute(message, args, this);
            
            // Set cooldown
            this.cooldowns.set(command.name, Date.now() + (command.cooldown || 3000));
        } catch (error) {
            console.error(`Error executing command ${commandName}:`, error);
            await message.reply('There was an error executing that command!');
        }
    }

    loadCommands() {
        const commandsPath = path.join(__dirname, 'commands');
        if (!fs.existsSync(commandsPath)) {
            fs.mkdirSync(commandsPath, { recursive: true });
            return;
        }

        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            const command = require(filePath);

            if ('data' in command && 'execute' in command) {
                this.commands.set(command.data.name, command);
                console.log(`✅ Loaded command: ${command.data.name}`);
            } else {
                console.log(`⚠️ Command at ${filePath} is missing required "data" or "execute" property.`);
            }
        }
    }

    async createSeedyAdminRole(guild = null) {
        const guilds = guild ? [guild] : this.client.guilds.cache.values();
        
        for (const guild of guilds) {
            try {
                // Check if role already exists
                const existingRole = guild.roles.cache.find(role => role.name === 'SeedyAdmin');
                if (existingRole) {
                    console.log(`✅ SeedyAdmin role already exists in ${guild.name}`);
                    continue;
                }

                // Create the role
                const role = await guild.roles.create({
                    name: 'SeedyAdmin',
                    color: 0x00ff00, // Green color
                    reason: 'Seedy bot admin role for command permissions'
                });

                console.log(`✅ Created SeedyAdmin role in ${guild.name}`);
            } catch (error) {
                console.error(`❌ Failed to create SeedyAdmin role in ${guild.name}:`, error);
            }
        }
    }

    isEconomyCommand(commandName) {
        const economyCommands = ['balance', 'daily', 'leaderboard', 'hangman', 'tictactoe', 'connect4', 'battleship', 'rummy', 'poker', 'uno'];
        return economyCommands.includes(commandName);
    }

    hasSeedyAdminRole(member) {
        if (!member) return false;
        return member.roles.cache.some(role => role.name === 'SeedyAdmin');
    }

    async handleSlashCommand(interaction) {
        const command = this.commands.get(interaction.commandName);

        if (!command) {
            return interaction.reply({
                content: '❌ Command not found!',
                ephemeral: true
            });
        }

        // Check permissions for non-economy commands
        if (!this.isEconomyCommand(interaction.commandName) && !this.hasSeedyAdminRole(interaction.member)) {
            return interaction.reply({
                content: '❌ You need the **SeedyAdmin** role to use this command!',
                ephemeral: true
            });
        }

        try {
            await command.execute(interaction, this);
        } catch (error) {
            console.error(`Error executing slash command ${interaction.commandName}:`, error);
            await interaction.reply({
                content: 'There was an error executing that command!',
                ephemeral: true
            });
        }
    }

    async handleServerSelectMenu(interaction) {
        try {
            // Check if ServerService is initialized
            if (!this.serverService) {
                return interaction.reply({
                    content: '❌ ServerService is not initialized yet. Please try again in a moment.',
                    ephemeral: true
                });
            }

            const customId = interaction.customId;
            const selectedServer = interaction.values[0];

            if (customId === 'server_info_select') {
                // Handle server info selection from send-server-msg
                const serverData = this.serverService.getServer(selectedServer);
                
                if (!serverData) {
                    return interaction.reply({
                        content: '❌ Server not found!',
                        ephemeral: true
                    });
                }

                const embed = this.serverService.createServerEmbed(serverData, 0x00ff00);
                await interaction.reply({ embeds: [embed], ephemeral: true });

            } else if (customId === 'delete_server_select') {
                // Handle server deletion
                const serverData = this.serverService.getServer(selectedServer);
                
                if (!serverData) {
                    return interaction.reply({
                        content: '❌ Server not found!',
                        ephemeral: true
                    });
                }

                await this.serverService.deleteServer(selectedServer);

                const embed = new EmbedBuilder()
                    .setTitle('✅ Server Deleted Successfully!')
                    .setDescription(`**${selectedServer}** has been removed from the server database.`)
                    .setColor(0x00ff00)
                    .setTimestamp()
                    .setFooter({ 
                        text: 'Server Management • Powered by Seedy', 
                        iconURL: 'https://i.imgur.com/ieP1fd5.jpeg' 
                    });

                await interaction.reply({ embeds: [embed], ephemeral: true });

            } else if (customId.startsWith('edit_server_select_')) {
                // Handle server editing
                const updatesString = customId.replace('edit_server_select_', '');
                const updates = JSON.parse(updatesString);
                
                const serverData = this.serverService.getServer(selectedServer);
                
                if (!serverData) {
                    return interaction.reply({
                        content: '❌ Server not found!',
                        ephemeral: true
                    });
                }

                const updatedServer = await this.serverService.editServer(selectedServer, updates);

                const embed = new EmbedBuilder()
                    .setTitle('✅ Server Updated Successfully!')
                    .setDescription(`**${updatedServer.server_name}** has been updated in the server database.`)
                    .setColor(0x00ff00)
                    .addFields(
                        {
                            name: '**SERVER ID**',
                            value: updatedServer.server_id,
                            inline: false
                        },
                        {
                            name: '**SERVER TYPE**',
                            value: updatedServer.server_type,
                            inline: false
                        },
                        {
                            name: '**GAME TYPE**',
                            value: updatedServer.game_type,
                            inline: false
                        },
                        {
                            name: '**TEAM SIZE**',
                            value: updatedServer.team_size,
                            inline: false
                        },
                        {
                            name: '**LAST WIPE**',
                            value: updatedServer.last_wipe,
                            inline: false
                        },
                        {
                            name: '**NEXT WIPE**',
                            value: updatedServer.next_wipe,
                            inline: false
                        },
                        {
                            name: '**BP WIPE**',
                            value: updatedServer.bp_wipe,
                            inline: false
                        }
                    )
                    .setTimestamp()
                    .setFooter({ 
                        text: 'Server Management • Powered by Seedy', 
                        iconURL: 'https://i.imgur.com/ieP1fd5.jpeg' 
                    });

                await interaction.reply({ embeds: [embed], ephemeral: true });
            }

        } catch (error) {
            console.error('Error handling server select menu:', error);
            await interaction.reply({
                content: '❌ There was an error processing your selection!',
                ephemeral: true
            });
        }
    }

    async handleGameButton(interaction) {
        try {
            const gameId = interaction.message.id;
            const gameState = this.gameManager.activeGames.get(gameId);

            if (!gameState) {
                return interaction.reply({
                    content: '❌ Game not found or has expired!',
                    ephemeral: true
                });
            }

            // Check if it's the user's turn
            if (gameState.currentPlayer !== 'user' || gameState.userId !== interaction.user.id) {
                return interaction.reply({
                    content: '❌ It\'s not your turn!',
                    ephemeral: true
                });
            }

            // Handle different game types
            if (interaction.customId.startsWith('ttt_')) {
                await this.handleTicTacToeButton(interaction, gameState);
            } else if (interaction.customId.startsWith('c4_')) {
                await this.handleConnect4Button(interaction, gameState);
            } else if (interaction.customId.startsWith('bs_')) {
                await this.handleBattleshipButton(interaction, gameState);
            } else if (interaction.customId.startsWith('rummy_')) {
                await this.handleRummyButton(interaction, gameState);
            } else if (interaction.customId.startsWith('poker_')) {
                await this.handlePokerButton(interaction, gameState);
            } else if (interaction.customId.startsWith('uno_')) {
                await this.handleUnoButton(interaction, gameState);
            }

        } catch (error) {
            console.error('Error handling game button:', error);
            await interaction.reply({
                content: '❌ There was an error processing your move!',
                ephemeral: true
            });
        }
    }

    async handleTicTacToeButton(interaction, gameState) {
        const position = parseInt(interaction.customId.split('_')[1]);
        
        if (gameState.board[position] !== '') {
            return interaction.reply({
                content: '❌ That position is already taken!',
                ephemeral: true
            });
        }

        // User move
        gameState.board[position] = 'X';
        
        // Check for winner
        const winner = this.checkTicTacToeWinner(gameState.board);
        if (winner) {
            await this.endTicTacToeGame(interaction, gameState, winner);
            return;
        }

        // Bot move
        const botMove = this.getTicTacToeBestMove(gameState.board);
        if (botMove !== -1) {
            gameState.board[botMove] = 'O';
            
            // Check for winner again
            const winner2 = this.checkTicTacToeWinner(gameState.board);
            if (winner2) {
                await this.endTicTacToeGame(interaction, gameState, winner2);
                return;
            }
        }

        // Update game display
        await this.updateTicTacToeDisplay(interaction, gameState);
    }

    checkTicTacToeWinner(board) {
        const winningCombinations = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
            [0, 4, 8], [2, 4, 6] // Diagonals
        ];

        for (const combo of winningCombinations) {
            const [a, b, c] = combo;
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                return board[a];
            }
        }

        return board.includes('') ? null : 'tie';
    }

    getTicTacToeBestMove(board) {
        // Simple AI logic
        for (let i = 0; i < 9; i++) {
            if (board[i] === '') {
                board[i] = 'O';
                if (this.checkTicTacToeWinner(board) === 'O') {
                    board[i] = '';
                    return i;
                }
                board[i] = '';
            }
        }

        for (let i = 0; i < 9; i++) {
            if (board[i] === '') {
                board[i] = 'X';
                if (this.checkTicTacToeWinner(board) === 'X') {
                    board[i] = '';
                    return i;
                }
                board[i] = '';
            }
        }

        if (board[4] === '') return 4;
        const corners = [0, 2, 6, 8];
        for (const corner of corners) {
            if (board[corner] === '') return corner;
        }
        const edges = [1, 3, 5, 7];
        for (const edge of edges) {
            if (board[edge] === '') return edge;
        }

        return -1;
    }

    async endTicTacToeGame(interaction, gameState, winner) {
        let result = '';
        let reward = 0;

        if (winner === 'X') {
            result = `🎉 **${gameState.username} wins!**`;
            reward = gameState.bet * 2;
            await this.economy.addMoney(gameState.userId, reward, 'Tic-Tac-Toe win');
            await this.economy.updateGameStats(gameState.userId, 'tictactoe', true);
        } else if (winner === 'O') {
            result = `🤖 **Seedy Bot wins!**`;
            await this.economy.removeMoney(gameState.userId, gameState.bet, 'Tic-Tac-Toe loss');
            await this.economy.updateGameStats(gameState.userId, 'tictactoe', false);
        } else {
            result = `🤝 **It's a tie!**`;
        }

        const embed = new EmbedBuilder()
            .setTitle('🎮 Tic-Tac-Toe Game - Finished!')
            .setDescription(`${result}\n\n${reward > 0 ? `💰 **Reward:** ${this.economy.formatCurrency(reward)}` : ''}`)
            .setColor(winner === 'X' ? 0x00ff00 : winner === 'O' ? 0xff0000 : 0xffff00)
            .addFields({
                name: '**Final Board**',
                value: this.renderTicTacToeBoard(gameState.board),
                inline: false
            })
            .setTimestamp()
            .setFooter({ text: 'Game Over • Powered by Seedy' });

        await interaction.update({ embeds: [embed], components: [] });
        this.gameManager.activeGames.delete(interaction.message.id);
    }

    async updateTicTacToeDisplay(interaction, gameState) {
        const embed = new EmbedBuilder()
            .setTitle('🎮 Tic-Tac-Toe Game')
            .setDescription(`**${gameState.username}** vs **Seedy Bot**\n\n${gameState.bet > 0 ? `💰 **Bet:** ${this.economy.formatCurrency(gameState.bet)}` : '🎯 **Friendly Game**'}\n\n**Current Turn:** ${gameState.currentPlayer === 'X' ? gameState.username : 'Seedy Bot'}`)
            .setColor(0x4ecdc4)
            .addFields({
                name: '**Game Board**',
                value: this.renderTicTacToeBoard(gameState.board),
                inline: false
            })
            .setTimestamp()
            .setFooter({ text: 'Click a button to make your move! • Powered by Seedy' });

        const buttons = this.createTicTacToeButtons(gameState.board);
        await interaction.update({ embeds: [embed], components: buttons });
    }

    renderTicTacToeBoard(board) {
        const displayBoard = board.map((cell, index) => {
            if (cell === '') return `${index + 1}`;
            return cell === 'X' ? '❌' : '⭕';
        });

        return `\`\`\`
 ${displayBoard[0]} │ ${displayBoard[1]} │ ${displayBoard[2]}
───┼───┼───
 ${displayBoard[3]} │ ${displayBoard[4]} │ ${displayBoard[5]}
───┼───┼───
 ${displayBoard[6]} │ ${displayBoard[7]} │ ${displayBoard[8]}
\`\`\``;
    }

    createTicTacToeButtons(board) {
        const rows = [];
        
        for (let i = 0; i < 3; i++) {
            const row = new ActionRowBuilder();
            for (let j = 0; j < 3; j++) {
                const index = i * 3 + j;
                const button = new ButtonBuilder()
                    .setCustomId(`ttt_${index}`)
                    .setLabel(board[index] === '' ? `${index + 1}` : (board[index] === 'X' ? '❌' : '⭕'))
                    .setStyle(board[index] === '' ? ButtonStyle.Secondary : ButtonStyle.Primary)
                    .setDisabled(board[index] !== '');
                
                row.addComponents(button);
            }
            rows.push(row);
        }

        return rows;
    }

    // Placeholder methods for other games (to be implemented)
    async handleConnect4Button(interaction, gameState) {
        // Implementation for Connect 4
        await interaction.reply({ content: 'Connect 4 button handling - Coming soon!', ephemeral: true });
    }

    async handleBattleshipButton(interaction, gameState) {
        // Implementation for Battleship
        await interaction.reply({ content: 'Battleship button handling - Coming soon!', ephemeral: true });
    }

    async handleRummyButton(interaction, gameState) {
        // Implementation for Rummy
        await interaction.reply({ content: 'Rummy button handling - Coming soon!', ephemeral: true });
    }

    async handlePokerButton(interaction, gameState) {
        // Implementation for Poker
        await interaction.reply({ content: 'Poker button handling - Coming soon!', ephemeral: true });
    }

    async handleUnoButton(interaction, gameState) {
        // Implementation for Uno
        await interaction.reply({ content: 'Uno button handling - Coming soon!', ephemeral: true });
    }

    async start() {
        try {
            await this.client.login(process.env.DISCORD_TOKEN);
        } catch (error) {
            console.error('Failed to start Seedy bot:', error);
            process.exit(1);
        }
    }
}

// Start the bot
const seedyBot = new SeedyBot();
seedyBot.start();

module.exports = SeedyBot;