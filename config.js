var querystring = require('querystring');
var https = require('https');

/* The url of our lambda. This will be sent to superfeedr when subscribing to feeds*/
var lambda = "https://xxxxx.execute-api.us-east-1.amazonaws.com/v0/";

/* The Superfeedr credentials */
var superfeedrCredentials = {
  login: 'xxxxx',
  token: 'xxxxx'
};

/*The telegram credentials*/
var telegramBotAuth = "xxxx";

var commands = {};