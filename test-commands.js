const fs = require('fs');
const path = require('path');

const commandsPath = path.join(__dirname, 'src', 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

console.log(`Found ${commandFiles.length} command files:`);
commandFiles.forEach(file => console.log(`- ${file}`));

console.log('\nTesting each command file:');

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    try {
        const command = require(filePath);
        
        if ('data' in command && 'execute' in command) {
            console.log(`✅ ${file}: OK - ${command.data.name}`);
        } else {
            console.log(`❌ ${file}: Missing data or execute property`);
        }
    } catch (error) {
        console.log(`❌ ${file}: ERROR - ${error.message}`);
    }
}
