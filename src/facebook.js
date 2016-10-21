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
        'Content-Length': Buffer.byteLength(json)
      }
    }, function (res) {
      var d = ''
      res.setEncoding('utf8')

      res.on('data', function (chunk) {
        d += chunk
      })

      res.on('end', function () {
        if (res.statusCode >= 400 && res.statusCode < 500) {
          console.error('Facebook Error', res.statusCode, d, json)
          return callback(null, true)
        }
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
    message.message = body
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
        } else if (m && m.postback) {
          messages.push({
            from: m.sender.id,
            content: m.postback.payload
          })
        }
      }
    }
    return onMessages(messages)
  }

}

// Responses
ChatBot.responses.facebook = {}

ChatBot.responses.facebook.notification = function (body) {
  var message = {
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
      image_url: item.image,
      buttons: []
    }
    if (item.permalinkUrl) {
      element.buttons.push({
        type: 'web_url',
        url: item.permalinkUrl,
        title: 'Open Web URL'
      })
    }
    element.buttons.push({
      type: 'postback',
      title: 'Stop following',
      payload: '/unsubscribe ' + body.status.feed
    })
    message.attachment.payload.elements.push(element)
  })
  return message
}

ChatBot.responses.facebook.unknownCommand = function (command) {
  return {
    attachment: {
      type: 'template',
      payload: {
        template_type: 'button',
        text: 'Sorry, I could not understand.',
        buttons: [{
          type: 'postback',
          title: 'Show help',
          payload: '/help'
        }, {
          type: 'postback',
          title: 'List subscriptions',
          payload: '/list'
        }]
      }
    }
  }
}

ChatBot.responses.facebook.invalidCommand = function (command) {
  return {
    attachment: {
      type: 'template',
      payload: {
        template_type: 'button',
        text: 'I am sorry, but this is not a valid command.',
        buttons: [{
          type: 'postback',
          title: 'Show help',
          payload: '/help'
        }]
      }
    }
  }
}

ChatBot.responses.facebook.text = function (message) {
  return {
    text: message
  }
}

ChatBot.responses.facebook.helpCommand = function () {
  return {
    text: 'I can help you subscribe to your favorite websites and receive messages when they publish new content. Start by telling me your favorite site\'s URL (starting with http).'
  }
}

ChatBot.responses.facebook.urlCommand = function (url) {
  return {
    attachment: {
      type: 'template',
      payload: {
        template_type: 'button',
        text: 'Thanks, do you want to subscribe to that site?',
        buttons: [{
          type: 'postback',
          title: 'Subscribe',
          payload: '/subscribe ' + url
        }]
      }
    }
  }
}

ChatBot.responses.facebook.urlNotSubscribable = function (url) {
  return {
    text: 'I am sorry, but you cannot subscribe to this site for now :( Ask them to support RSS!'
  }
}

ChatBot.responses.facebook.subscriptionList = function (list) {
  var message = {
    attachment: {
      type: 'template',
      payload: {
        template_type: 'generic',
        elements: []
      }
    }
  }
  list.subscriptions.forEach(function (s) {
    var element = {
      title: s.subscription.feed.title,
      subtitle: s.subscription.feed.status.feed,
      buttons: [{
        type: 'postback',
        title: 'Stop following',
        payload: '/unsubscribe ' + s.subscription.feed.status.feed
      }]
    }
    message.attachment.payload.elements.push(element)
  })

  if (list.meta.total > list.meta.by_page * list.meta.page) {
    message.attachment.payload.elements.push({
      title: 'Next Page',
      subtitle: 'You have ' + list.meta.total + ' subscriptions.',
      buttons: [{
        type: 'postback',
        title: 'Next page',
        payload: '/list ' + (list.meta.page + 1)
      }]
    })
  }

  return message
}

ChatBot.responses.facebook.noSubscriptions = function (page) {
  return {
    attachment: {
      type: 'template',
      payload: {
        template_type: 'button',
        text: 'There are no subscriptions. Try the previous page.',
        buttons: [{
          type: 'postback',
          title: 'Previous page',
          payload: '/list ' + (page - 1)
        }]
      }
    }
  }
}

ChatBot.responses.facebook.brokenFeed = function (url) {
  return {
    attachment: {
      type: 'template',
      payload: {
        template_type: 'button',
        text: 'Hum. We got a problem fetching content from ' + url + ' . You may want to unsubscribe from it.',
        buttons: [{
          type: 'postback',
          title: 'Unsubscribe',
          payload: '/unsubscribe ' + url
        }]
      }
    }
  }
}
