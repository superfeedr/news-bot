/**
 * Main lambda function.
 */
exports.handler = function (req, res) {
  if (req['platform']) return ChatBot.chatHandler(req, res, req['platform'])
  if (req['chat_id']) return ChatBot.superfeedrHandler(req, res)
  return res.succeed('Hum. who are you?')
}
exports.ChatBot = ChatBot

/**
 * Handles messages from Superfeedr.
 */
ChatBot.superfeedrHandler = function (req, res) {
  function processChatPlatformResponse (error, unsubscribe) {
    if (error) {
      // Not sure what to do...
    }
    if (unsubscribe) {
      ChatBot.superfeedr.unsubscribe(req['x-pubsubhubbub-topic'], req['x-pubsubhubbub-callback'])
    }
    res.succeed('Thanks') // finish by responding? If we fail there will be retries
  }

  // If we have no items, this must be a notification about an error in the feed
  if (!req['body']['items']) {
    return ChatBot.platforms[req.chat_platform].sendMessage(req.chat_id, 'Hum. We got a problem fetching content from ' + req['body']['status']['feed'] + '. You may want to unsubscribe from it.', processChatPlatformResponse)
  }

  return ChatBot.platforms[req.chat_platform].sendMessage(req.chat_id, req['body'], processChatPlatformResponse)
}

/**
 * Handles requests from chat platforms. We should identify commands and handle them
 */
ChatBot.chatHandler = function (req, res, platform) {
  ChatBot.platforms[platform].parseChatMessage(req, function (response) {
    return res.succeed(response)
  }, function (messages) {
    ChatBot.processMessages(messages, platform, function () {
      return res.succeed({})
    })
  })
}

/**
 * Process the messages received synchronously
 */
ChatBot.processMessages = function (messages, platform, done) {
  var message = messages.pop()

  if (!message) return done()
  if (!message.from || !message.content) return ChatBot.processMessages(messages, platform, done)

  var command = ChatBot.parseCommand(message.content)

  ChatBot.handleCommand(command, platform, message.from, message.content, function (response) {
    ChatBot.platforms[platform].sendMessage(message.from, response, function (error, unsubscribe) {
      if (error) {
        ChatBot.parseCommand('Sorry there was an error. ' + error)
      }
      ChatBot.processMessages(messages, platform, done)
    })
  })
}

/**
 * Parses commands passed via chat from the user.
 */
ChatBot.parseCommand = function (text) {
  var tokens = text.split(' ')
  if (!tokens[0].match(/^\//)) return null

  var command = []
  var cmd = tokens.shift()
  var m = cmd.match(/\/(\w*)/)
  if (m) {
    command.push(m[1])
    command.push(tokens)
  }
  return command
}

/**
 * Handles commands...
 */
ChatBot.handleCommand = function (command, chatPlatform, chatId, text, cb) {
  if (!command) return cb('Sorry, I could not understand \'' + text + '\'. Please, use /help to get the list of commands.')

  var listOfCommands = Object.keys(ChatBot.commands)

  var invalidCommandMessage = 'I am sorry, but ' + command[0] + ' this is not a valid command. Try ' + listOfCommands.map(function (c) { return '/' + c }).join(', ')
  if (ChatBot.commands[command[0]]) {
    ChatBot.commands[command[0]](chatPlatform, chatId, command[1], cb)
  } else {
    return cb(invalidCommandMessage)
  }
}
