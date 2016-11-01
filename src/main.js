/**
 * Main lambda function.
 */
exports.handler = function (req, res) {
  if (req['platform']) return ChatBot.chatHandler(req, res, req['platform'])
  if (req['chat_id']) return ChatBot.superfeedrHandler(req, res)
  return res.succeed(['version:', VERSION].join(' '))
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
    return ChatBot.platforms[req.chat_platform].sendMessage(req.chat_id, ChatBot.responses[req.chat_platform].brokenFeed(req['body'].status.feed), processChatPlatformResponse)
  }

  return ChatBot.platforms[req.chat_platform].sendMessage(req.chat_id, ChatBot.responses[req.chat_platform].notification(req['body']), processChatPlatformResponse)
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

var URL_REGEX = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/
/**
 * Parses commands passed via chat from the user.
 */
ChatBot.parseCommand = function (text) {
  if (text.match(URL_REGEX)) return ['url', text]

  if (text.toLowerCase() == "hello") return ['hello']

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
  if (!command) return cb(ChatBot.responses[chatPlatform].unknownCommand(command))

  if (ChatBot.commands[command[0]]) {
    ChatBot.commands[command[0]](chatPlatform, chatId, command[1], cb)
  } else {
    cb(ChatBot.responses[chatPlatform].invalidCommand(command[0]))
  }
}
