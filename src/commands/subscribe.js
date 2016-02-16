commands.subscribe = function(chatId, args, cb) {
  if(args.length != 1)
    return cb('Please, provide a feed URL to which you want to subscribe. For example, /subscribe https://blog.superfeedr.com/atom.xml');

  superfeedr.subscribe(args[0], chatId, function(error) {
    if(error)
      return cb('We could not subscribe you to this feed... sorry!');

    return cb('Done! Next time the feed updates, you\'ll be the first to know!');
  });
};