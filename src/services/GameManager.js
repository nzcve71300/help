class GameManager {
    constructor(economy) {
        this.economy = economy;
        this.activeGames = new Map();
    }

    // Hangman game management
    startHangmanGame(userId) {
        const words = [
            'DISCORD', 'BOT', 'SEEDY', 'GAME', 'HANGMAN', 'FUN', 'PLAY',
            'WIN', 'LOSE', 'GUESS', 'LETTER', 'WORD', 'PUZZLE', 'CHALLENGE'
        ];
        
        const word = words[Math.floor(Math.random() * words.length)];
        const game = {
            type: 'hangman',
            word: word,
            guessed: new Set(),
            wrongGuesses: 0,
            maxWrong: 6,
            status: 'playing',
            startTime: Date.now()
        };
        
        this.activeGames.set(userId, game);
        return game;
    }

    makeHangmanGuess(userId, letter) {
        const game = this.activeGames.get(userId);
        if (!game || game.type !== 'hangman' || game.status !== 'playing') {
            return null;
        }

        letter = letter.toUpperCase();
        if (game.guessed.has(letter)) {
            return { error: 'Already guessed this letter!' };
        }

        game.guessed.add(letter);
        
        if (!game.word.includes(letter)) {
            game.wrongGuesses++;
            if (game.wrongGuesses >= game.maxWrong) {
                game.status = 'lost';
            }
        } else {
            // Check if won
            const won = [...game.word].every(char => game.guessed.has(char));
            if (won) {
                game.status = 'won';
            }
        }

        return game;
    }

    endHangmanGame(userId, won) {
        this.activeGames.delete(userId);
        
        if (won) {
            // Award seeds for winning
            return this.economy.addMoney(userId, 50, 'Hangman win');
        }
        return null;
    }

    getHangmanDisplay(game) {
        let display = '';
        for (const char of game.word) {
            if (game.guessed.has(char)) {
                display += char + ' ';
            } else {
                display += '_ ';
            }
        }
        return display.trim();
    }

    getHangmanArt(wrongGuesses) {
        const stages = [
            '```\n   +---+\n   |   |\n       |\n       |\n       |\n       |\n=========```',
            '```\n   +---+\n   |   |\n   O   |\n       |\n       |\n       |\n=========```',
            '```\n   +---+\n   |   |\n   O   |\n   |   |\n       |\n       |\n=========```',
            '```\n   +---+\n   |   |\n   O   |\n  /|   |\n       |\n       |\n=========```',
            '```\n   +---+\n   |   |\n   O   |\n  /|\\  |\n       |\n       |\n=========```',
            '```\n   +---+\n   |   |\n   O   |\n  /|\\  |\n  /    |\n       |\n=========```',
            '```\n   +---+\n   |   |\n   O   |\n  /|\\  |\n  / \\  |\n       |\n=========```'
        ];
        return stages[wrongGuesses] || stages[0];
    }

    // Battleship game management
    startBattleshipGame(userId) {
        const game = {
            type: 'battleship',
            playerBoard: this.createBattleshipBoard(),
            opponentBoard: this.createBattleshipBoard(),
            status: 'playing',
            startTime: Date.now()
        };
        
        this.activeGames.set(userId, game);
        return game;
    }

    createBattleshipBoard() {
        const board = Array(10).fill().map(() => Array(10).fill(0));
        const ships = [5, 4, 3, 3, 2]; // Ship sizes
        
        for (const shipSize of ships) {
            let placed = false;
            while (!placed) {
                const row = Math.floor(Math.random() * 10);
                const col = Math.floor(Math.random() * 10);
                const horizontal = Math.random() < 0.5;
                
                if (this.canPlaceShip(board, row, col, shipSize, horizontal)) {
                    this.placeShip(board, row, col, shipSize, horizontal);
                    placed = true;
                }
            }
        }
        
        return board;
    }

    canPlaceShip(board, row, col, size, horizontal) {
        if (horizontal) {
            if (col + size > 10) return false;
            for (let i = 0; i < size; i++) {
                if (board[row][col + i] !== 0) return false;
            }
        } else {
            if (row + size > 10) return false;
            for (let i = 0; i < size; i++) {
                if (board[row + i][col] !== 0) return false;
            }
        }
        return true;
    }

    placeShip(board, row, col, size, horizontal) {
        if (horizontal) {
            for (let i = 0; i < size; i++) {
                board[row][col + i] = 1;
            }
        } else {
            for (let i = 0; i < size; i++) {
                board[row + i][col] = 1;
            }
        }
    }

    // Game cleanup
    cleanupOldGames() {
        const now = Date.now();
        const maxGameTime = 30 * 60 * 1000; // 30 minutes
        
        for (const [userId, game] of this.activeGames.entries()) {
            if (now - game.startTime > maxGameTime) {
                this.activeGames.delete(userId);
            }
        }
    }

    // Get active game for user
    getActiveGame(userId) {
        return this.activeGames.get(userId);
    }

    // Remove active game
    removeActiveGame(userId) {
        this.activeGames.delete(userId);
    }
}

module.exports = GameManager;
