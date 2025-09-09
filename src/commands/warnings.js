const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warnings')
        .setDescription('Check warnings for a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to check warnings for')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction, bot) {
        const user = interaction.options.getUser('user');
        const warnings = await bot.moderation.getWarnings(user.id, bot);

        if (warnings.length === 0) {
            const embed = new EmbedBuilder()
                .setTitle('✅ No Warnings')
                .setDescription(`${user} has no warnings.`)
                .setColor(0x00ff00)
                .setTimestamp();

            return await interaction.reply({ embeds: [embed] });
        }

        const embed = new EmbedBuilder()
            .setTitle(`⚠️ Warnings for ${user.username}`)
            .setDescription(`Total warnings: ${warnings.length}`)
            .setColor(0xff0000)
            .setTimestamp();

        for (let i = 0; i < Math.min(warnings.length, 10); i++) {
            const warning = warnings[i];
            const date = new Date(warning.created_at).toLocaleDateString();
            embed.addFields({
                name: `Warning #${i + 1}`,
                value: `**Reason:** ${warning.reason}\n**Date:** ${date}`,
                inline: false
            });
        }

        await interaction.reply({ embeds: [embed] });
    },

    cooldown: 5
};
