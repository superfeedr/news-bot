ChatBot.commands.help = function (chatPlatform, chatId, args, cb) {
  return cb(ChatBot.responses[chatPlatform].helpCommand())
}
