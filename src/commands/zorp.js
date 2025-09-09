const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('zorp')
        .setDescription('Get help with ZORP Discord bot framework')
        .addStringOption(option =>
            option.setName('topic')
                .setDescription('Specific ZORP topic you need help with')
                .setRequired(false)
                .addChoices(
                    { name: 'Setup & Installation', value: 'setup' },
                    { name: 'Commands', value: 'commands' },
                    { name: 'Events', value: 'events' },
                    { name: 'Database', value: 'database' },
                    { name: 'Permissions', value: 'permissions' },
                    { name: 'Troubleshooting', value: 'errors' }
                )),

    async execute(interaction, bot) {
        const topic = interaction.options.getString('topic');
        
        await interaction.deferReply();

        try {
            let response;
            
            if (topic) {
                // Get specific topic help
                const topicData = bot.zorpHelpService.zorpKnowledge[topic];
                if (topicData) {
                    response = topicData.content;
                } else {
                    response = 'Sorry, I couldn\'t find information about that topic. Try using `/zorp` without a topic to see all available help!';
                }
            } else {
                // Get general ZORP help
                response = bot.zorpHelpService.getGeneralZORPHelp();
            }

            const embed = new EmbedBuilder()
                .setTitle('🌱 ZORP Help')
                .setDescription(response)
                .setColor(0x0099ff)
                .setFooter({ text: 'ZORP Discord Bot Framework' })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('ZORP command error:', error);
            await interaction.editReply('Sorry, I encountered an error getting ZORP help. Please try again!');
        }
    },

    cooldown: 3
};
