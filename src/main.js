/* Main lambda function. context is the object from the API gateway mapping */
exports.handler = function(event, context) {
  if(typeof(event["chat_id"]) != 'undefined' && event["chat_id"] !== '') {
    return superfeedrHandler(event, context);
  }

  if(event["body"] && event["body"]["message"] && typeof(event["body"]["message"]["chat"]) != 'undefined') {
    return telegramHandler(event, context);
  }
  return context.succeed("Hum. who are you?");
};


/* Handles messages from Superfeedr. */
function superfeedrHandler(event, context) {
  // If we have no items, this must be a notification about an error in the feed
  if(!event["body"]["items"]) {
    return telegramBot.sendMessage(event["chat_id"], "Hum. We got a problem fetching content from " + event["body"]["status"]["feed"] + ". You may want to unsubscribe from it.", function() {
      return context.succeed("Thanks");
    });
  }
  // For each new item in the feed, let's send it to
  event["body"]["items"].forEach(function(item) {
    var message = "[" + item.title + "](" + item.permalinkUrl + ")";
    message = [event["body"].title, message].join(' - ');
    return telegramBot.sendMessage(event["chat_id"], message, function() {
      return context.succeed("Thanks");
    });
  });
};

/*
  Handles chat messages from Telegram.
  We should identify commands and handle them
  We should respond for the commands we dd not process or do not understand
*/
function telegramHandler(event, context) {
  if(!event["body"]["message"] || !event["body"]["message"]["text"]) {
    return context.succeed({}); // Meh
  }
  var command = parseCommand(event["body"]["message"]["text"]);
  handleCommand(command, event["body"]["message"]["chat"]["id"], function(message) {
    return telegramBot.respondMessage(event["body"]["message"]["chat"]["id"], message, function(response) {
      context.succeed(response)
    })
  });
};

/*
  Parses commands passed via chat from the user.
*/
function parseCommand(text) {
  // We need to
  var tokens = text.split(' ');
  if(!tokens[0].match(/^\//))
    return null;
  var command = [];
  var cmd = tokens.shift();
  var m;
  if(m = cmd.match(/\/(\w*)/)) {
    command.push(m[1]);
    command.push(tokens);
  }
  return command;
};

/* Handles commands... mostly sends messages to Superfeedr!*/
function handleCommand(command, chatId, cb) {

  if(!command)
    return cb('Please, use /help to get the list of commands');

  var listOfCommands = Object.keys(commands);

  var invalidCommandMessage = 'I am sorry, but ' + command[0] + ' this is not a valid command. Try ' + listOfCommands.map(function(c) { return '/' + c}).join(', ');
  if(commands[command[0]]) {
    commands[command[0]](chatId, command[1], cb);
  }
  else {
    return cb(invalidCommandMessage);
  }
};