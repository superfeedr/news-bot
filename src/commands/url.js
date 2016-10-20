ChatBot.commands.url = function (chatPlatform, chatId, url, cb) {
  console.log(url)
  ChatBot.feediscovery(url, function(error, result) {
    if(error || result.length === 0) return cb(ChatBot.responses.urlNotSubscribable)
    return cb(ChatBot.responses.urlCommand, result[0].href)
  })

}
