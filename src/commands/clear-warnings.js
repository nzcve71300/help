const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear-warnings')
        .setDescription('Clear all warnings for a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to clear warnings for')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction, bot) {
        const user = interaction.options.getUser('user');
        
        await bot.moderation.clearWarnings(user.id, bot);

        const embed = new EmbedBuilder()
            .setTitle('✅ Warnings Cleared')
            .setDescription(`All warnings for ${user} have been cleared.`)
            .setColor(0x00ff00)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },

    cooldown: 5
};
