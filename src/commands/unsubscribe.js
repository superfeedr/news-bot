commands.unsubscribe = function(chatId, args, cb) {
  if(args.length != 1)
    return cb('Please, provide a feed URL from which you want to unsubscribe. For example, /unsubscribe https://blog.superfeedr.com/atom.xml');

  superfeedr.unsubscribe(args[0], chatId, function(error) {
    if(error)
      return cb('We could not unsubscribe you to this feed... sorry!');

    return cb('Done! You will not hear from this feed again');
  });
};