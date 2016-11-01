ChatBot.commands.url = function (chatPlatform, chatId, url, cb) {
  ChatBot.feediscovery(url, function (error, result) {
    if (error || result.length === 0) return cb(ChatBot.responses[chatPlatform].urlNotSubscribable())
    return cb(ChatBot.responses[chatPlatform].urlCommand(result[0].href))
  })
}
