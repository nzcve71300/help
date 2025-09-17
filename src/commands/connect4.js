const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('connect4')
        .setDescription('Play Connect 4 against the bot!')
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
                board: Array(6).fill().map(() => Array(7).fill('')),
                currentPlayer: 'R', // User is R (Red), Bot is Y (Yellow)
                gameOver: false,
                winner: null,
                bet: betAmount,
                userId: userId,
                username: username
            };

            // Store game state
            bot.gameManager.activeGames.set(interaction.id, gameState);

            // Create game embed
            const embed = new EmbedBuilder()
                .setTitle('🎮 Connect 4 Game')
                .setDescription(`**${username}** 🔴 vs **Seedy Bot** 🟡\n\n${betAmount > 0 ? `💰 **Bet:** ${bot.economy.formatCurrency(betAmount)}` : '🎯 **Friendly Game**'}\n\n**Current Turn:** ${gameState.currentPlayer === 'R' ? `${username} 🔴` : 'Seedy Bot 🟡'}`)
                .setColor(0x4ecdc4)
                .addFields({
                    name: '**Game Board**',
                    value: this.renderBoard(gameState.board),
                    inline: false
                })
                .setThumbnail('https://i.imgur.com/ieP1fd5.jpeg')
                .setTimestamp()
                .setFooter({ 
                    text: 'Click a column number to drop your piece! • Powered by Seedy', 
                    iconURL: 'https://i.imgur.com/ieP1fd5.jpeg' 
                });

            // Create game buttons
            const buttons = this.createGameButtons();

            await interaction.reply({ 
                embeds: [embed], 
                components: buttons,
                ephemeral: false
            });

        } catch (error) {
            console.error('Error in connect4 command:', error);
            await interaction.reply({
                content: '❌ There was an error starting the Connect 4 game!',
                ephemeral: true
            });
        }
    },

    renderBoard(board) {
        let display = '```\n';
        display += '  1   2   3   4   5   6   7\n';
        display += '┌───┬───┬───┬───┬───┬───┬───┐\n';
        
        for (let row = 0; row < 6; row++) {
            display += '│';
            for (let col = 0; col < 7; col++) {
                const cell = board[row][col];
                if (cell === 'R') {
                    display += ' 🔴 │';
                } else if (cell === 'Y') {
                    display += ' 🟡 │';
                } else {
                    display += '   │';
                }
            }
            display += '\n';
            if (row < 5) {
                display += '├───┼───┼───┼───┼───┼───┼───┤\n';
            }
        }
        
        display += '└───┴───┴───┴───┴───┴───┴───┘\n';
        display += '```';
        
        return display;
    },

    createGameButtons() {
        const row = new ActionRowBuilder();
        
        for (let col = 1; col <= 7; col++) {
            const button = new ButtonBuilder()
                .setCustomId(`c4_${col}`)
                .setLabel(`${col}`)
                .setStyle(ButtonStyle.Primary);
            
            row.addComponents(button);
        }

        return [row];
    },

    checkWinner(board) {
        // Check horizontal
        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 4; col++) {
                if (board[row][col] && 
                    board[row][col] === board[row][col + 1] &&
                    board[row][col] === board[row][col + 2] &&
                    board[row][col] === board[row][col + 3]) {
                    return board[row][col];
                }
            }
        }

        // Check vertical
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 7; col++) {
                if (board[row][col] && 
                    board[row][col] === board[row + 1][col] &&
                    board[row][col] === board[row + 2][col] &&
                    board[row][col] === board[row + 3][col]) {
                    return board[row][col];
                }
            }
        }

        // Check diagonal (top-left to bottom-right)
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 4; col++) {
                if (board[row][col] && 
                    board[row][col] === board[row + 1][col + 1] &&
                    board[row][col] === board[row + 2][col + 2] &&
                    board[row][col] === board[row + 3][col + 3]) {
                    return board[row][col];
                }
            }
        }

        // Check diagonal (top-right to bottom-left)
        for (let row = 0; row < 3; row++) {
            for (let col = 3; col < 7; col++) {
                if (board[row][col] && 
                    board[row][col] === board[row + 1][col - 1] &&
                    board[row][col] === board[row + 2][col - 2] &&
                    board[row][col] === board[row + 3][col - 3]) {
                    return board[row][col];
                }
            }
        }

        return null;
    },

    isBoardFull(board) {
        return board[0].every(cell => cell !== '');
    },

    getBestMove(board) {
        // Simple AI: Try to win, then block, then take center columns
        const moves = [];
        
        // Check for winning move
        for (let col = 0; col < 7; col++) {
            const row = this.getLowestEmptyRow(board, col);
            if (row !== -1) {
                board[row][col] = 'Y';
                if (this.checkWinner(board) === 'Y') {
                    board[row][col] = '';
                    return col;
                }
                board[row][col] = '';
            }
        }

        // Check for blocking move
        for (let col = 0; col < 7; col++) {
            const row = this.getLowestEmptyRow(board, col);
            if (row !== -1) {
                board[row][col] = 'R';
                if (this.checkWinner(board) === 'R') {
                    board[row][col] = '';
                    return col;
                }
                board[row][col] = '';
            }
        }

        // Take center columns
        const centerCols = [3, 2, 4, 1, 5, 0, 6];
        for (const col of centerCols) {
            if (this.getLowestEmptyRow(board, col) !== -1) {
                return col;
            }
        }

        return -1;
    },

    getLowestEmptyRow(board, col) {
        for (let row = 5; row >= 0; row--) {
            if (board[row][col] === '') {
                return row;
            }
        }
        return -1;
    },

    cooldown: 10
};
