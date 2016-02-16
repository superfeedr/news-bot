commands.list = function(chatId, args, cb) {
  var page = Math.max(1, parseInt(args[0]) || 1);
  superfeedr.list(page, chatId, function(error, subscriptionsPage) {
    if(error)
      return cb('We could not list subscriptions... sorry!');


    if(subscriptionsPage.subscriptions.length == 0) {
      if(page > 1)
        return cb("There are no subscriptions. Get previous page with /list " + (page-1) );
      return cb("There are no subscriptions. Start with /subscribe");
    }

    var message = subscriptionsPage.subscriptions.map(function(s) {
      return [s.subscription.feed.title, s.subscription.feed.status.feed].join(': ')
    }).join('\n');

    if(subscriptionsPage.meta.total > subscriptionsPage.meta.by_page * subscriptionsPage.meta.page) {
      message += "\nGet next page with /list " + (subscriptionsPage.meta.page + 1);
    }

    return cb(message);
  });
};


