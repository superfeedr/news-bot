ChatBot.commands.version = function (chatPlatform, chatId, args, cb) {
  return cb(['version:', VERSION].join(' '))
}
