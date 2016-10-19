/* A (simpistic) library to post to Facebook */
ChatBot.platforms.facebook = {

  _post: function (data, callback) {
    var json = JSON.stringify(data)
    var req = https.request({
      method: 'POST',
      host: 'graph.facebook.com',
      port: 443,
      path: '/v2.6/me/messages?access_token=' + ChatBot.config.facebook.token,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': json.length
      }
    }, function (res) {
      var d = ''
      res.setEncoding('utf8')

      res.on('data', function (chunk) {
        d += chunk
      })

      res.on('end', function () {
        if (res.statusCode >= 400 && res.statusCode < 500) {
          return callback(null, true)
        }
        console.error('Facebook Error', res.statusCode, d)
        return callback(null, false)
      })
    })
    req.on('error', callback)
    req.write(json)
    req.end()
  },

  // Sends a message to the chatId. Calls callback when done
  sendMessage: function (chatId, body, callback) {
    var message = {
      recipient: {id: chatId}
    }
    if (typeof body === 'string') {
      message.message = {
        text: body
      }
    } else {
      message.message = {
        attachment: {
          type: 'template',
          payload: {
            template_type: 'generic',
            elements: []
          }
        }
      }
      body.items.forEach(function (item) {
        var element = {
          title: item.title,
          subtitle: body.title,
          buttons: []
        }
        if (item.permalinkUrl) {
          element.buttons.push({
            type: 'web_url',
            url: item.permalinkUrl,
            title: 'Open Web URL'
          })
        }
        message.message.attachment.payload.elements.push(element)
      })
    }
    return ChatBot.platforms.facebook._post(message, callback)
  },

  // Parses a chat message
  parseChatMessage: function (request, onSetup, onMessages) {
    if (request['hub.challenge']) return onSetup(request['hub.challenge'])

    if (!request.body || !request.body.entry || !request.body.entry[0]) return onMessages([{}])

    var messages = []

    for (var j = 0; j < request.body.entry.length; j++) {
      var e = request.body.entry[j]
      for (var i = 0; i < e.messaging.length; i++) {
        var m = e.messaging[i]
        if (m && m.message) {
          messages.push({
            from: m.sender.id,
            content: m.message.text
          })
        }
      }
    }
    return onMessages(messages)
  }
}