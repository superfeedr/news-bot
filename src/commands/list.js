ChatBot.commands.list = function (chatPlatform, chatId, args, cb) {
  var page = Math.max(1, parseInt(args[0]) || 1)
  ChatBot.superfeedr.list(page, {platform: chatPlatform, channel: chatId}, function (error, subscriptionsPage) {
    if (error) return cb(ChatBot.responses[chatPlatform].text('We could not list subscriptions... sorry!'))

    if (subscriptionsPage.subscriptions.length === 0) {
      if (page > 1) return cb(ChatBot.responses[chatPlatform].noSubscriptions(page))
      return cb(ChatBot.responses[chatPlatform].text('There are no subscriptions. What\'s your favorite site?'))
    }

    return cb(ChatBot.responses[chatPlatform].subscriptionList(subscriptionsPage))
  })
}
