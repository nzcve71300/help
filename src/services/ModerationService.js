const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const Filter = require('bad-words');

class ModerationService {
    constructor() {
        this.filter = new Filter();
        this.warningImageUrl = 'https://i.imgur.com/xxdt9Ww.png';
    }

    async handleMessage(message, bot) {
        const content = message.content.toLowerCase();
        
        // Check for rude/inappropriate language
        if (this.isInappropriate(content)) {
            await this.handleWarning(message, bot);
        }
    }

    isInappropriate(content) {
        // Check for profanity
        if (this.filter.isProfane(content)) {
            return true;
        }

        // Additional rude words/phrases
        const rudePhrases = [
            'shut up', 'stfu', 'kill yourself', 'kys', 'you suck', 'youre stupid',
            'youre dumb', 'fuck you', 'fuck off', 'piss off', 'go die', 'hate you',
            'youre trash', 'youre garbage', 'nobody likes you', 'youre worthless'
        ];

        return rudePhrases.some(phrase => content.includes(phrase));
    }

    async handleWarning(message, bot) {
        try {
            // Delete the inappropriate message
            await message.delete();

            // Create warning embed
            const embed = new EmbedBuilder()
                .setTitle('⚠️ Warning Issued')
                .setDescription(`Hello ${message.author}, please be respectful in the discord. You received a warning. Breaking the rules could result in a ban from the server.`)
                .setColor(0x006400) // Dark green
                .setTimestamp()
                .setFooter({ text: 'Please follow our community guidelines' });

            // Set image directly in embed
            embed.setImage(this.warningImageUrl);

            // Send warning message
            await message.channel.send({
                embeds: [embed]
            });

            // Log warning to database
            await bot.database.run(
                'INSERT INTO warnings (user_id, moderator_id, reason) VALUES (?, ?, ?)',
                [message.author.id, bot.client.user.id, 'Inappropriate language detected']
            );

            // Send DM to user
            try {
                const dmEmbed = new EmbedBuilder()
                    .setTitle('⚠️ Warning from Server')
                    .setDescription('You received a warning for inappropriate language. Please be respectful in our community.')
                    .setColor(0xff0000)
                    .setTimestamp();

                await message.author.send({ embeds: [dmEmbed] });
            } catch (error) {
                console.log('Could not send DM to user:', error.message);
            }

        } catch (error) {
            console.error('Error handling warning:', error);
        }
    }

    async getWarningCount(userId, bot) {
        const result = await bot.database.get(
            'SELECT COUNT(*) as count FROM warnings WHERE user_id = ?',
            [userId]
        );
        return result ? result.count : 0;
    }

    async getWarnings(userId, bot) {
        return await bot.database.all(
            'SELECT * FROM warnings WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );
    }

    async clearWarnings(userId, bot) {
        await bot.database.run('DELETE FROM warnings WHERE user_id = ?', [userId]);
    }
}

module.exports = ModerationService;
