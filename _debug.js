//Lets require/import the HTTP module
var http = require('http');
var url = require('url');
var qs = require('querystring');

var bot = require(__dirname + '/dist/bot.js')
var handler = bot.handler
var ChatBot = bot.ChatBot


ChatBot.config.baseUrl          = 'https://c6dcf91a.ngrok.io'
ChatBot.config.superfeedr.login = 'telegraphbot'
ChatBot.config.superfeedr.token = '7e4de2150d78defc8b314486167560cf'
ChatBot.config.telegram.auth    = '289134957:AAF5YGsfOi1ylUj0fiwDSDW2FN4q7xxYjkI'
ChatBot.config.facebook.token   = 'EACQTcsWbosABAJmrBmeAjy2Dg4WwldLFJU33ovMX4uljq6541PQ6UTO9UylnILZALcvTfvD5jTHActnrjXo1TRGHOA2lwsmtt9NjZAEuzMJD2tUHEATNkZARsnaKtsQ7G13wBd8fmoTAwH2tZBgFLu5gmc6pSYgbO4US1niHPwZDZD'

/*
We debug using the superfeedr_local_bot which should run locally.
We run the code below and then make sure we expose it to the outside world using ngrok

$ ngrok http 8080

Then, update the ChatBot.config.baseUrl to use the right URL.
*/

// Create a server
var server = http.createServer(function(req, res) {
  function process(query, headers, post, body) {
    var x = ["chat_id", "platform", "chat_platform", "x-pubsubhubbub-callback", "x-pubsubhubbub-topic", "hub.verify_token", "hub.challenge"]
    var params = {}
    for (var i=0; i < x.length; i++) {
      params[x[i]] = query[x[i]] || post[x[i]] || headers[x[i]]
    }

    console.log('\n*', req.url, '\n\t' , JSON.stringify(params)) // log
    if(body) {
      console.log('  ', headers)
      console.log('  ')
      console.log('  ', body)
      if(headers['content-type'].match(/application\/json/))
        params['body'] = JSON.parse(body)
    }

    try {
      var response = handler(params, {succeed: function(message) {
        message = message || ''
        console.log(' ->', message)
        res.end(message.toString())
      }})
    }
    catch(e) {
      console.error(e)
      console.error(e.stack)
      res.end('ERROR') //  Not fail
    }
  }

  var query = url.parse(req.url, true).query
  var headers = req.headers
  var post = {}
  if (req.method == 'POST') {
    var body = ''
    req.on('data', function (data) {
      body += data;
    });
    req.on('end', function () {
      if(headers['content-type'] == 'application/x-www-form-urlencoded')
        post = qs.parse(body);
      process(query, headers, post, body)
    });
  }
  else {
    process(query, headers, post)
  }
});

//Lets start our server
server.listen(8080, function() {
    //Callback triggered when server is successfully listening. Hurray!
    console.log("Server listening on: http://localhost:%s", 8080);
    ChatBot.platforms.telegram.setWebhook(ChatBot.config.baseUrl, (response, unsub, body) => {
      console.log(response, body)
      // Log a message?
    } )

});