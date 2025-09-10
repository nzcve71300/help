class EconomyService {
    constructor(database) {
        this.database = database;
        this.currencyName = '🌱 Seeds';
        this.currencySymbol = '🌱';
    }

    async getUser(userId, username = null) {
        let user = await this.database.get('SELECT * FROM users WHERE user_id = ?', [userId]);
        
        if (!user) {
            // Create new user
            await this.database.run(
                'INSERT INTO users (user_id, username, balance) VALUES (?, ?, ?)',
                [userId, username, 1000]
            );
            user = await this.database.get('SELECT * FROM users WHERE user_id = ?', [userId]);
        } else if (username && user.username !== username) {
            // Update username
            await this.database.run('UPDATE users SET username = ? WHERE user_id = ?', [username, userId]);
            user.username = username;
        }

        return user;
    }

    async getBalance(userId) {
        const user = await this.getUser(userId);
        return user.balance;
    }

    async addMoney(userId, amount, reason = 'Unknown', username = null) {
        const user = await this.getUser(userId, username);
        const newBalance = user.balance + amount;

        await this.database.run(
            'UPDATE users SET balance = ?, total_earned = total_earned + ? WHERE user_id = ?',
            [newBalance, amount, userId]
        );

        // Log transaction
        await this.database.run(
            'INSERT INTO transactions (user_id, amount, type, description) VALUES (?, ?, ?, ?)',
            [userId, amount, 'earn', reason]
        );

        return newBalance;
    }

    async removeMoney(userId, amount, reason = 'Unknown') {
        const user = await this.getUser(userId);
        if (user.balance < amount) {
            return false; // Insufficient funds
        }

        const newBalance = user.balance - amount;
        await this.database.run('UPDATE users SET balance = ? WHERE user_id = ?', [newBalance, userId]);

        // Log transaction
        await this.database.run(
            'INSERT INTO transactions (user_id, amount, type, description) VALUES (?, ?, ?, ?)',
            [userId, -amount, 'spend', reason]
        );

        return newBalance;
    }

    async transferMoney(fromUserId, toUserId, amount, reason = 'Transfer') {
        const fromUser = await this.getUser(fromUserId);
        if (fromUser.balance < amount) {
            return false; // Insufficient funds
        }

        await this.removeMoney(fromUserId, amount, `Transfer to ${toUserId}`);
        await this.addMoney(toUserId, amount, `Transfer from ${fromUserId}`);

        return true;
    }

    async dailyReward(userId, username = null) {
        const user = await this.getUser(userId, username);
        const now = new Date();
        const lastDaily = user.last_daily ? new Date(user.last_daily) : null;

        // Check if user can claim daily
        if (lastDaily) {
            const timeDiff = now - lastDaily;
            const hoursDiff = timeDiff / (1000 * 60 * 60);
            
            if (hoursDiff < 24) {
                const hoursLeft = 24 - hoursDiff;
                return { success: false, hoursLeft: Math.ceil(hoursLeft) };
            }
        }

        // Calculate streak bonus
        let streak = user.daily_streak;
        if (lastDaily) {
            const daysDiff = Math.floor((now - lastDaily) / (1000 * 60 * 60 * 24));
            if (daysDiff === 1) {
                streak += 1;
            } else if (daysDiff > 1) {
                streak = 1; // Reset streak
            }
        } else {
            streak = 1;
        }

        // Calculate reward (base 100 + streak bonus)
        const baseReward = 100;
        const streakBonus = Math.min(streak * 10, 200); // Max 200 bonus
        const totalReward = baseReward + streakBonus;

        // Update user
        await this.database.run(
            'UPDATE users SET balance = balance + ?, daily_streak = ?, last_daily = ?, total_earned = total_earned + ? WHERE user_id = ?',
            [totalReward, streak, now.toISOString(), totalReward, userId]
        );

        // Log transaction
        await this.database.run(
            'INSERT INTO transactions (user_id, amount, type, description) VALUES (?, ?, ?, ?)',
            [userId, totalReward, 'daily', `Daily reward (streak: ${streak})`]
        );

        return { success: true, reward: totalReward, streak: streak };
    }

    async getLeaderboard(limit = 10) {
        return await this.database.all(
            'SELECT user_id, username, balance, total_earned FROM users ORDER BY balance DESC LIMIT ?',
            [limit]
        );
    }

    async getTransactionHistory(userId, limit = 10) {
        return await this.database.all(
            'SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
            [userId, limit]
        );
    }

    async getGameStats(userId) {
        let stats = await this.database.get('SELECT * FROM game_stats WHERE user_id = ?', [userId]);
        
        if (!stats) {
            await this.database.run('INSERT INTO game_stats (user_id) VALUES (?)', [userId]);
            stats = await this.database.get('SELECT * FROM game_stats WHERE user_id = ?', [userId]);
        }

        return stats;
    }

    async updateGameStats(userId, gameType, won) {
        const stats = await this.getGameStats(userId);
        
        const winField = `${gameType}_wins`;
        const lossField = `${gameType}_losses`;
        
        if (won) {
            await this.database.run(
                `UPDATE game_stats SET ${winField} = ${winField} + 1, total_games = total_games + 1 WHERE user_id = ?`,
                [userId]
            );
        } else {
            await this.database.run(
                `UPDATE game_stats SET ${lossField} = ${lossField} + 1, total_games = total_games + 1 WHERE user_id = ?`,
                [userId]
            );
        }
    }

    formatCurrency(amount) {
        return `${this.currencySymbol} ${amount.toLocaleString()}`;
    }
}

module.exports = EconomyService;
