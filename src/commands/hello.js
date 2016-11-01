ChatBot.commands.hello = function (chatPlatform, chatId, args, cb) {
  return cb(ChatBot.responses[chatPlatform].helloCommand())
}
