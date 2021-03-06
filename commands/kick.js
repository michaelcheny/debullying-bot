const { MessageEmbed } = require('discord.js');
const { increaseKickCount } = require('../database/MongoDB');

module.exports = {
  name: 'kick',
  description: 'Kick the member.',

  async execute(message, args, client) {
    try {
      if (!message.member.hasPermission('KICK_MEMBERS'))
        return message
          .reply(embedMessage('You do not have permissions to use that command.'))
          .then((m) => m.delete({ timeout: 5000 }));
      if (args.length === 0)
        return message
          .reply(embedMessage('Please provide ID'))
          .then((m) => m.delete({ timeout: 5000 }));

      const member = message.guild.members.cache.get(args[0]);

      if (member) {
        await increaseKickCount(member.user.id);
        member.kick('misbehaving');
      } else {
        message.channel.send(embedMessage('That member was not found.'));
      }

      // return message.channel.send(embed);
    } catch (error) {
      console.error(error);
    }
  },
};

const embedMessage = (msg) =>
  new MessageEmbed().setDescription(msg).setColor(process.env.EMBED_COLOR);
