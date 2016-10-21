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
  sendMessage: function (chatId, body, callback) {
    var data = {
      'chat_id': chatId,
      'parse_mode': 'Markdown'
    }

    data.text = body
    return ChatBot.platforms.telegram._post('sendMessage', data, callback)
  },

  setStatus: function (chatId, status, callback) {
    // Nothing!
  },

  // Parses a chat message
  parseChatMessage: function (request, onSetup, onMessages) {
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
    var message = '[' + item.title + '](' + item.permalinkUrl + ')'
    messages.push([body.title, message].join(' - '))
  })
  return messages.join('\n')
}

ChatBot.responses.telegram.unknownCommand = function (command) {
  return 'Sorry, I could not understand. Type /help'
}

ChatBot.responses.telegram.invalidCommand = function (command) {
  return 'I am sorry, but this is not a valid command.'
}

ChatBot.responses.telegram.text = function (message) {
  return message
}

ChatBot.responses.telegram.helpCommand = function () {
  return 'I can help you subscribe to your favorite websites and receive messages when they publish new content. Start by telling me your favorite site\'s URL (starting with http).'
}

ChatBot.responses.telegram.urlCommand = function (url) {
  return 'Thanks, do you want to subscribe to that site?'
}

ChatBot.responses.telegram.urlNotSubscribable = function (url) {
  return 'I am sorry, but you cannot subscribe to this site for now :( Ask them to support RSS!'
}

ChatBot.responses.telegram.brokenFeed = function (url) {
  return 'Hum. We got a problem fetching content from ' + url + ' . You may want to unsubscribe from it.'
}
