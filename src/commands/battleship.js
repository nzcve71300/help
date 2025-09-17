const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('battleship')
        .setDescription('Play Battleship against the bot!')
        .addIntegerOption(option =>
            option.setName('bet')
                .setDescription('Amount to bet (optional)')
                .setRequired(false)
                .setMinValue(10)
                .setMaxValue(1000)),

    async execute(interaction, bot) {
        try {
            const betAmount = interaction.options.getInteger('bet') || 0;
            const userId = interaction.user.id;
            const username = interaction.user.username;

            // Check if user has enough money for bet
            if (betAmount > 0) {
                const hasFunds = await bot.economy.checkFunds(userId, betAmount);
                if (!hasFunds) {
                    const balance = await bot.economy.getBalance(userId);
                    return interaction.reply({
                        content: `❌ You don't have enough coins! You have **${bot.economy.formatCurrency(balance)}** but need **${bot.economy.formatCurrency(betAmount)}** to bet.`,
                        ephemeral: true
                    });
                }
            }

            // Initialize game state
            const gameState = {
                userBoard: Array(10).fill().map(() => Array(10).fill('')),
                botBoard: Array(10).fill().map(() => Array(10).fill('')),
                userShots: Array(10).fill().map(() => Array(10).fill('')),
                botShots: Array(10).fill().map(() => Array(10).fill('')),
                userShips: this.generateShips(),
                botShips: this.generateShips(),
                currentPlayer: 'user',
                gamePhase: 'playing', // setup, playing, finished
                gameOver: false,
                winner: null,
                bet: betAmount,
                userId: userId,
                username: username,
                createdAt: Date.now(),
                lastActivity: Date.now()
            };

            // Place user ships
            this.placeShips(gameState.userBoard, gameState.userShips);
            this.placeShips(gameState.botBoard, gameState.botShips);

            // Store game state with message ID for button handling
            const messageId = `bs_${interaction.id}`;
            bot.gameManager.activeGames.set(messageId, gameState);

            // Create game embed
            const embed = new EmbedBuilder()
                .setTitle('🚢 Battleship Game')
                .setDescription(`**${username}** vs **Seedy Bot**\n\n${betAmount > 0 ? `💰 **Bet:** ${bot.economy.formatCurrency(betAmount)}` : '🎯 **Friendly Game**'}\n\n**Current Turn:** ${gameState.currentPlayer === 'user' ? `${username}` : 'Seedy Bot'}`)
                .setColor(0x4ecdc4)
                .addFields({
                    name: '**Your Board**',
                    value: this.renderBoard(gameState.userBoard, true),
                    inline: true
                }, {
                    name: '**Enemy Board**',
                    value: this.renderBoard(gameState.userShots, false),
                    inline: true
                })
                .setThumbnail('https://i.imgur.com/ieP1fd5.jpeg')
                .setTimestamp()
                .setFooter({ 
                    text: 'Click coordinates to attack! • Powered by Seedy', 
                    iconURL: 'https://i.imgur.com/ieP1fd5.jpeg' 
                });

            // Create game buttons
            const buttons = this.createGameButtons(gameState, interaction.id);

            await interaction.reply({ 
                embeds: [embed], 
                components: buttons,
                ephemeral: false
            });

        } catch (error) {
            console.error('Error in battleship command:', error);
            await interaction.reply({
                content: '❌ There was an error starting the Battleship game!',
                ephemeral: true
            });
        }
    },

    generateShips() {
        return [
            { name: 'Carrier', size: 5, placed: false },
            { name: 'Battleship', size: 4, placed: false },
            { name: 'Cruiser', size: 3, placed: false },
            { name: 'Submarine', size: 3, placed: false },
            { name: 'Destroyer', size: 2, placed: false }
        ];
    },

    placeShips(board, ships) {
        for (const ship of ships) {
            let placed = false;
            while (!placed) {
                const row = Math.floor(Math.random() * 10);
                const col = Math.floor(Math.random() * 10);
                const horizontal = Math.random() < 0.5;

                if (this.canPlaceShip(board, row, col, ship.size, horizontal)) {
                    this.placeShip(board, row, col, ship.size, horizontal);
                    ship.placed = true;
                    placed = true;
                }
            }
        }
    },

    canPlaceShip(board, row, col, size, horizontal) {
        if (horizontal) {
            if (col + size > 10) return false;
            for (let i = 0; i < size; i++) {
                if (board[row][col + i] !== '') return false;
            }
        } else {
            if (row + size > 10) return false;
            for (let i = 0; i < size; i++) {
                if (board[row + i][col] !== '') return false;
            }
        }
        return true;
    },

    placeShip(board, row, col, size, horizontal) {
        if (horizontal) {
            for (let i = 0; i < size; i++) {
                board[row][col + i] = 'S';
            }
        } else {
            for (let i = 0; i < size; i++) {
                board[row + i][col] = 'S';
            }
        }
    },

    renderBoard(board, showShips = false) {
        let display = '```\n';
        display += '   A B C D E F G H I J\n';
        
        for (let row = 0; row < 10; row++) {
            display += `${row + 1} `;
            if (row < 9) display += ' ';
            
            for (let col = 0; col < 10; col++) {
                const cell = board[row][col];
                if (cell === 'S' && showShips) {
                    display += '🚢 ';
                } else if (cell === 'H') {
                    display += '💥 ';
                } else if (cell === 'M') {
                    display += '❌ ';
                } else {
                    display += '🌊 ';
                }
            }
            display += '\n';
        }
        
        display += '```';
        return display;
    },

    createGameButtons(gameState, interactionId) {
        const rows = [];
        
        // Create coordinate buttons (5 rows of 2 buttons each for letters A-J)
        for (let row = 0; row < 5; row++) {
            const buttonRow = new ActionRowBuilder();
            for (let col = 0; col < 2; col++) {
                const letterIndex = row * 2 + col;
                if (letterIndex < 10) {
                    const letter = String.fromCharCode(65 + letterIndex);
                    const button = new ButtonBuilder()
                        .setCustomId(`bs_${interactionId}_${letter}`)
                        .setLabel(letter)
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji('🎯');
                    
                    buttonRow.addComponents(button);
                }
            }
            rows.push(buttonRow);
        }

        // Add number buttons (1-10) - split into two rows to avoid button limit
        const numberRow1 = new ActionRowBuilder();
        const numberRow2 = new ActionRowBuilder();
        
        for (let i = 1; i <= 5; i++) {
            const button = new ButtonBuilder()
                .setCustomId(`bs_${interactionId}_${i}`)
                .setLabel(`${i}`)
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('🔢');
            
            numberRow1.addComponents(button);
        }
        
        for (let i = 6; i <= 10; i++) {
            const button = new ButtonBuilder()
                .setCustomId(`bs_${interactionId}_${i}`)
                .setLabel(`${i}`)
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('🔢');
            
            numberRow2.addComponents(button);
        }
        
        rows.push(numberRow1, numberRow2);

        return rows;
    },

    checkGameOver(board) {
        for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 10; col++) {
                if (board[row][col] === 'S') {
                    return false; // Still has ships
                }
            }
        }
        return true; // All ships sunk
    },

    cooldown: 10
};
