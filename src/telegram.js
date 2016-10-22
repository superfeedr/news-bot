/* A (simpistic) library to post to Telegram */
ChatBot.platforms.telegram = {

  _post: function (method, params, callback) {
    var data = querystring.stringify(params)

    var request = {
      method: 'POST',
      host: 'api.telegram.org',
      port: 443,
      path: '/bot' + ChatBot.config.telegram.auth + '/' + method,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': data.length
      }
    }

    var req = https.request(request, function (res) {
      var d = ''
      res.setEncoding('utf8')

      res.on('data', function (chunk) {
        d += chunk
      })

      res.on('end', function () {
        if (res.statusCode >= 400 && res.statusCode < 500) {
          return callback(null, d)
        }

        return callback(null, false, d)
      })
    })
    req.on('error', callback)
    req.write(data)
    req.end()
  },

  // Sends a message to the chatId. Calls callback when done
  sendMessage: function (chatId, bodies, callback) {
    if (!Array.isArray(bodies)) {
      bodies = [bodies]
    }

    var body = bodies.shift()
    if (!body) {
      return callback()
    }
    body.chat_id = chatId
    body.parse_mode = 'Markdown'
    return ChatBot.platforms.telegram._post('sendMessage', body, function () {
      return ChatBot.platforms.telegram.sendMessage(chatId, bodies, callback)
    })
  },

  // Parses a chat message
  parseChatMessage: function (request, requestResponse, onMessages) {
    if (request['body'] && request['body']['callback_query']) {
      ChatBot.platforms.telegram._post('answerCallbackQuery', {
        callback_query_id: request['body']['callback_query']['id']
      }, function () {})

      return onMessages([{
        from: request['body'] && request['body']['callback_query'] && request['body']['callback_query']['from'] && request['body']['callback_query']['from']['id'],
        content: request['body'] && request['body']['callback_query'] && request['body']['callback_query']['data']
      }])
    }
    return onMessages([{
      from: request['body'] && request['body']['message'] && request['body']['message']['chat'] && request['body']['message']['chat']['id'],
      content: request['body'] && request['body']['message'] && request['body']['message']['text']
    }])
  },

  /**
   * Points Telegram webhooks to our bot
  */
  setWebhook: function (baseUrl, callback) {
    var data = {
      'url': [ChatBot.config.baseUrl, '?platform=telegram'].join('/')
    }
    return ChatBot.platforms.telegram._post('setWebhook', data, callback)
  }
}

// Responses
ChatBot.responses.telegram = {}

ChatBot.responses.telegram.notification = function (body) {
  var messages = []
  body.items.forEach(function (item) {
    var message = ['_' + body.title + '_', item.title].join(': ')
    messages.push({
      text: message,
      reply_markup: JSON.stringify({
        inline_keyboard: [[{
          text: 'Open',
          url: item.permalinkUrl
        }, {
          text: 'Unfollow',
          callback_data: '/unsubscribe ' + body.status.feed
        }]]
      })
    })
  })
  return messages
}

ChatBot.responses.telegram.unknownCommand = function (command) {
  return {
    text: 'Sorry, I could not understand.',
    reply_markup: JSON.stringify({
      inline_keyboard: [[{
        text: 'Help',
        callback_data: '/help'
      }, {
        text: 'List subscriptions',
        callback_data: '/list'
      }]]
    })
  }
}

ChatBot.responses.telegram.invalidCommand = function (command) {
  return {
    text: 'I am sorry, but this is not a valid command.'
  }
}

ChatBot.responses.telegram.text = function (message) {
  return {
    text: message
  }
}

ChatBot.responses.telegram.helpCommand = function () {
  return {
    text: 'I can help you subscribe to your favorite websites and receive messages when they publish new content. Start by telling me your favorite site\'s URL (starting with http).'
  }
}

ChatBot.responses.telegram.urlCommand = function (url) {
  return {
    text: 'Thanks, do you want to subscribe to that site?',
    reply_markup: JSON.stringify({
      inline_keyboard: [[{
        text: 'Yes',
        callback_data: '/subscribe ' + url
      }]]
    })
  }
}

ChatBot.responses.telegram.urlNotSubscribable = function (url) {
  return {
    text: 'I am sorry, but you cannot subscribe to this site for now :( Ask them to support RSS!'
  }
}

ChatBot.responses.telegram.brokenFeed = function (url) {
  return {
    text: 'Hum. We got a problem fetching content from ' + url + ' . You may want to unsubscribe from it.',
    reply_markup: JSON.stringify({
      inline_keyboard: [[{
        text: 'Yes',
        callback_data: '/unsubscribe ' + url
      }]]
    })
  }
}

ChatBot.responses.telegram.noSubscriptions = function (page) {
  return {
    text: 'There are no subscriptions. Try the previous page.',
    reply_markup: JSON.stringify({
      inline_keyboard: [[{
        text: 'Previous page',
        callback_data: '/list ' + (page - 1)
      }]]
    })
  }
}

ChatBot.responses.telegram.subscriptionList = function (list) {
  var messages = []
  list.subscriptions.forEach(function (s) {
    var message = '[' + s.subscription.feed.title + '](' + s.subscription.feed.status.feed + ')'
    messages.push({
      text: message,
      reply_markup: JSON.stringify({
        inline_keyboard: [[{
          text: 'Unfollow',
          callback_data: '/unsubscribe ' + s.subscription.feed.status.feed
        }]]
      })
    })
  })
  if (list.meta.total > list.meta.by_page * list.meta.page) {
    messages.push({
      text: 'You have more!',
      reply_markup: JSON.stringify({
        inline_keyboard: [[{
          text: 'Next page',
          callback_data: '/list ' + (list.meta.page + 1)
        }]]
      })
    })
  }
  return messages
}
