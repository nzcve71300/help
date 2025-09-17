const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tictactoe')
        .setDescription('Play Tic-Tac-Toe against the bot!')
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
                board: ['', '', '', '', '', '', '', '', ''],
                currentPlayer: 'X', // User is X, Bot is O
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
                .setTitle('🎮 Tic-Tac-Toe Game')
                .setDescription(`**${username}** vs **Seedy Bot**\n\n${betAmount > 0 ? `💰 **Bet:** ${bot.economy.formatCurrency(betAmount)}` : '🎯 **Friendly Game**'}\n\n**Current Turn:** ${gameState.currentPlayer === 'X' ? username : 'Seedy Bot'}`)
                .setColor(0x4ecdc4)
                .addFields({
                    name: '**Game Board**',
                    value: this.renderBoard(gameState.board),
                    inline: false
                })
                .setThumbnail('https://i.imgur.com/ieP1fd5.jpeg')
                .setTimestamp()
                .setFooter({ 
                    text: 'Click a button to make your move! • Powered by Seedy', 
                    iconURL: 'https://i.imgur.com/ieP1fd5.jpeg' 
                });

            // Create game buttons
            const buttons = this.createGameButtons(gameState.board);

            await interaction.reply({ 
                embeds: [embed], 
                components: buttons,
                ephemeral: false
            });

        } catch (error) {
            console.error('Error in tictactoe command:', error);
            await interaction.reply({
                content: '❌ There was an error starting the Tic-Tac-Toe game!',
                ephemeral: true
            });
        }
    },

    renderBoard(board) {
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
    },

    createGameButtons(board) {
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
    },

    checkWinner(board) {
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
    },

    getBestMove(board) {
        // Simple AI: Try to win, then block, then take center, then corners, then edges
        const moves = [];
        
        // Check for winning move
        for (let i = 0; i < 9; i++) {
            if (board[i] === '') {
                board[i] = 'O';
                if (this.checkWinner(board) === 'O') {
                    board[i] = '';
                    return i;
                }
                board[i] = '';
            }
        }

        // Check for blocking move
        for (let i = 0; i < 9; i++) {
            if (board[i] === '') {
                board[i] = 'X';
                if (this.checkWinner(board) === 'X') {
                    board[i] = '';
                    return i;
                }
                board[i] = '';
            }
        }

        // Take center if available
        if (board[4] === '') return 4;

        // Take corners
        const corners = [0, 2, 6, 8];
        for (const corner of corners) {
            if (board[corner] === '') return corner;
        }

        // Take edges
        const edges = [1, 3, 5, 7];
        for (const edge of edges) {
            if (board[edge] === '') return edge;
        }

        return -1;
    },

    cooldown: 10
};
