/* A (simpistic) library to post to Telegram */
var telegramBot = {
  // Sends a message to the chatId. Calls callback when done
  sendMessage: function(chatId, message, callback) {
    var data = querystring.stringify({
      'chat_id': chatId,
      'text': message,
      'parse_mode': "Markdown"
    });

    var req = https.request({
      method: 'POST',
      host: 'api.telegram.org',
      port: 443,
      path: '/bot' + telegramBotAuth + '/sendMessage',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': data.length,
      }
    }, function(res) {
      res.on('end', function() {
        callback(null);
      });
    });
    req.on('error', callback);
    req.write(data);
    req.end();
  },

  // Responds to a telegram message
  respondMessage: function(chatId, message, callback) {
    return callback({"method": "sendMessage", "chat_id": chatId, "text": message});
  }
};