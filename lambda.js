var config = require('./config.json');
var AWS = require('aws-sdk');
var qs = require('querystring');
var token;


exports.handler = function (event, context) {
  if (token) {
    // Container reuse, simply process the event with the key in memory
    processEvent(event, context);
  } else {
    var encryptedBuf = new Buffer(config.slashCommandToken, 'base64');
    var cipherText = {CiphertextBlob: encryptedBuf};

    var kms = new AWS.KMS();
    kms.decrypt(cipherText, function (err, data) {
      if (err) {
        console.log("Decrypt error: " + err);
        context.fail(err);
      } else {
        token = data.Plaintext.toString('ascii');
        processEvent(event, context);
      }
    });
  }
};

var processEvent = function(event, context) {
  var body = event['body'];
  var params = qs.parse(body);
  var requestToken = params['token'];

  if (requestToken !== token) {
    console.error("Request token (" + requestToken + ") does not match exptected");
    context.fail("Invalid request token");
  }

  var user = params['user_name'];
  var command = params['command'];
  var channel = params['channel_name'];
  var commandText = params['text'];

  // TODO: switch on command and actions for each command

  context.succeed({
    "response_type": "in_channel",
    text: user + " invoked " + command + " in " + channel + " with the following text: " + commandText
  });
}