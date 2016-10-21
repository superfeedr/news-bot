ChatBot.commands.version = function (chatPlatform, chatId, args, cb) {
  return cb(ChatBot.responses[chatPlatform].text(['version:', VERSION].join(' ')))
}
