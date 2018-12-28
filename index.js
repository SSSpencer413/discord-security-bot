const Discord = require("discord.js");
const client = new Discord.Client();
const antiSpamSet = {};

client.on('ready', () => {
  console.log("Logged into Discord");
  client.user.setPresence({
    game: {
      name: "the server",
      type: "WATCHING"
    },
    status: "dnd"
  });
});

client.on('message', msg =>{
  var prefix = process.env.prefix;
  
  if (msg.mentions.users.get(526591006926307338)) {
    msg.react("👋");
  }
  
  //Record the user's most recent message timestamp
  antiSpamSet[msg.author.id] = msg.createdTimestamp;
  
  let toModerate = moderateMessage(client, msg);
  if (toModerate) {
    if(msg.content.indexOf(prefix) !== 0) return;
    // This is the best way to define args. Trust me.
    const args = msg.content.slice(prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();
    // The list of if/else is replaced with those simple 2 lines:
    try {
      let commandFile = require(`./commands/${command}.js`);
      commandFile.run(client, msg, args);
    } catch (err) {
      console.error(err);
    }
  }
});

client.login(process.env.DiscordToken);

function moderateMessage(client, message) {
  if (message.author.bot) return true;
  if (message.author.id == message.guild.owner.id) return true;
  if (message.channel.name.search("spam") >= 0) return true;
  message.channel.startTyping();

  message.channel.fetchMessages({
    limit:10
  })
  .then(messages => {
    //The user(s) have to have 3 messages in a row to count as spam for this filter.
    let spamCache = 0;
    let messageArray = Array.from(messages.values());
    for (var i=1; i < 3; i++) {
      if (messageArray[i-1].content == messageArray[i].content) {
        spamCache++;
      }
    }
    
    //Check if user is on the list and see the difference between the two timestamps is greater than 700ms
    if (antiSpamSet.hasOwnProperty(message.author.id) && (message.createdTimestamp - antiSpamSet[message.author.id] <= 700)) {
      spamCache++;
    }

    if (spamCache > 1) {
      message.delete();
      return false;
    }
  })
  .catch(console.error);


  message.channel.stopTyping();
}
