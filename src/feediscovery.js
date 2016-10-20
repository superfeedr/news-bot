/* A (simpistic) library to use Feediscovery */
ChatBot.feediscovery = function (url, callback) {
  var req = https.request({
    method: 'GET',
    host: 'feediscovery.appspot.com',
    port: 443,
    path: '/?url=' + encodeURI(url),
  }, function (res) {
    var body = ''
    res.setEncoding('utf8')
    res.on('data', function (chunk) {
      body += chunk
    })
    res.on('end', function () {
      callback(null, JSON.parse(body))
    })
  })
  req.on('error', callback)
  req.end()
}
