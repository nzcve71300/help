const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('survey')
        .setDescription('Create a survey with 4 questions')
        .addStringOption(option =>
            option.setName('question1')
                .setDescription('First question')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('question2')
                .setDescription('Second question')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('question3')
                .setDescription('Third question')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('question4')
                .setDescription('Fourth question')
                .setRequired(true)),

    async execute(interaction, bot) {
        const question1 = interaction.options.getString('question1');
        const question2 = interaction.options.getString('question2');
        const question3 = interaction.options.getString('question3');
        const question4 = interaction.options.getString('question4');

        await bot.surveyManager.createSurvey(interaction, question1, question2, question3, question4);
    },

    cooldown: 30
};
