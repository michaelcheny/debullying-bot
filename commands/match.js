const { MessageEmbed } = require('discord.js');
const User = require('../database/models/user');
const Request = require('../database/models/request');

const foundGameMsg = new MessageEmbed()
  .setTitle('PLaceholder Title')
  .setDescription(
    'Awesome, next question I need to know to match you. \n2. How long do you want to play for?'
  )
  .setColor('blue')
  .setFooter(
    'Please select the emoji that best matches your time frame.\n\n💙  <30m \n💚  <1hr \n❤️  1hr+ \n💛  3hr+'
  );

const greetingMsg = new MessageEmbed()
  .setTitle('placeholder title')
  .setDescription(
    "Welcome, let's get you paired to play. I have 2 questions I need answers for. \n1. What game do you want to play? Please type out the exact title."
  )
  .setColor('blue')
  .setFooter('placeholder footer');

const postReactionMsg = new MessageEmbed()
  .setTitle('Title goes here')
  .setDescription(
    "Excellent, I'll message here for you match. You'll need to react with an emoji to begin the chat with your match. \nIn the chat, you'll share your info in order to begin playing! If you don't have a match within 10 minutes I'll message to see if you want to keep waiting or change anything up."
  )
  .setColor('blue')
  .setFooter('footer goes here');

// todo: refactor all that crap above this line to a reusable method below
const embedMessage = (title, description, sideColor, footer) => {
  new MessageEmbed()
    .setTitle(title)
    .setDescription(description)
    .setColor(sideColor)
    .setFooter(footer);
};

module.exports = {
  name: 'match',
  description: 'Matchmake for a game.',

  async execute(message, args, client) {
    // todo: check user in database and see if they're in the green, if not, return sorry message
    const msg = await message.author.send(greetingMsg);
    const filter = (collected) => collected.author.id === message.author.id;
    const collected = await msg.channel
      .awaitMessages(filter, {
        max: 1,
        time: 60000,
      })
      .catch(() => {
        message.author.send('This request timed out. Try again.');
      });

    // todo: get collect.first().content.toLowerCase() and run it through a method that checks if valid game using the big game API
    // todo:

    if (collected.first().content.toLowerCase() === 'cancel') {
      return message.author.send('Canceled');
    } else {
      // } else if (collected.first().content.toLowerCase() === 'overwatch') {
      // } else if (collected.first().content.toLowerCase() === a valid game from the api) {
      const newMsg = await message.author.send(foundGameMsg).then((embedMsg) => {
        embedMsg.react('💙');
        embedMsg.react('💚');
        embedMsg.react('❤️');
        embedMsg.react('💛');

        embedMsg
          .awaitReactions(
            (reaction, user) =>
              user.id == message.author.id &&
              (reaction.emoji.name == '💙' ||
                reaction.emoji.name == '💚' ||
                reaction.emoji.name == '❤️' ||
                reaction.emoji.name == '💛'),
            { max: 1, time: 60000 }
          )
          .then((reaction) => {
            processReaction(reaction.first().emoji.name);
          })
          .catch(() => {
            message.author.send('No reaction after 60 seconds, operation canceled');
          });
      });
    }

    // helpers
    const processReaction = async (reaction) => {
      let time;
      // case statement for different heart reactions
      switch (reaction) {
        case (reaction = '💙'):
          time = 30;
          break;
        case (reaction = '💚'):
          time = 60;
          break;
        case (reaction = '❤️'):
          time = 120;
          break;
        case (reaction = '💛'):
          time = 180;
          break;
        default:
          time = 0;
      }
      // TODO: method to check if another user in the Request collection wants to play the same game for same time
      // checkDbForMatch() ????????????????????

      // checks to see if user has existing request before processing
      updateOrCreateRequest(time);
    };

    const updateOrCreateRequest = async (time) => {
      try {
        // the chunk of commented out text below finds and updates a single request. after the team discussed, we want to log every single request to get some data

        // const filter = { id: message.author.id };
        // const update = {
        //   username: `${message.author.username}#${message.author.discriminator}`,
        //   game: collected.first().content.toLowerCase(),
        //   timeframe: time,
        //   date: Date.now(),
        // };
        // await Request.findOneAndUpdate(filter, update, {
        //   new: true,
        //   upsert: true,
        // });

        // todo: link relationship between request and user
        // todo: user field for botCalledAmount can be user.request.length

        // todo: move this crap into a controller
        const req = new Request({
          id: message.author.id,
          username: `${message.author.username}#${message.author.discriminator}`,
          game: collected.first().content.toLowerCase(),
          timeframe: time,
          user: message.author._id,
        });
        // req.user = user._id;
        await req.save();

        const user = await User.findOne({ id: message.author.id });

        user.requests.push(req);
        await user.save();

        // console.log(user.populate('Request'));
        console.log(user.requests[0]);

        // await req.save();
        await message.author.send(postReactionMsg);
      } catch (error) {
        console.error(error);
      }
    };
  },
};
