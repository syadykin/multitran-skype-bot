var restify = require('restify');
var builder = require('botbuilder');
var restler = require('restler');
var jquery = require.resolve('jquery');
var jsdom = require('jsdom');
var iconv = new require('iconv').Iconv('CP1251', 'UTF-8');

if(! process.env.MICROSOFT_APP_ID || ! process.env.MICROSOFT_APP_PASSWORD) {
  console.err('No MICROSOFT_APP_ID and MICROSOFT_APP_PASSWORD defined in env');
  process.exit(1);
}

var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, 'localhost', function () {
   console.log('%s listening to %s', server.name, server.url);
});

var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());

bot.dialog('/', function (session) {
  restler
    .get('http://www.multitran.ru/c/m.exe', {
      query: {
        CL: 1,
        s: session.message.text,
        l1: 1
      },
      decoding: 'binary',
      headers: {
        'Accept-Language': 'ru,uk,en'
      }
    })
    .on('success', function(data) {
      data = new Buffer(data, 'binary');

      try {
        data = iconv.convert(data).toString('utf8');
      } catch(e) { console.log('can\'t convert'); }

      jsdom.env(data, [jquery], function(e, window) {
        var translate = window.$('table:eq(9) td:eq(2)').text().trim();
        session.send(translate || 'Nothing found');
        window.close();
      });
    });
});
