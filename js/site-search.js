(function ($) {
  'use strict';

  var DEBOUNCE_MS = 200;

  // Filler words dropped from the user's query so natural phrases like
  // "Chess and Strategy Games" or "Fashion for a Cause" still match.
  // Kept tiny on purpose; nothing here is content-bearing.
  var STOPWORDS = {
    and: 1, '&': 1, the: 1, of: 1, 'for': 1,
    a: 1, an: 1, to: 1, 'in': 1, on: 1, 'with': 1
  };

  function normalize(s) {
    return (s || '').toLowerCase().replace(/\s+/g, ' ').trim();
  }

  function haystackFor(item) {
    return normalize(
      (item.title || '') + ' ' +
      (item.keywords || '') + ' ' +
      (item.text || '')
    );
  }

  function matchesQuery(haystack, queryNorm) {
    if (!queryNorm) return false;
    var words = queryNorm.split(' ').filter(function (w) {
      return w && !STOPWORDS[w];
    });
    if (!words.length) return false;
    for (var i = 0; i < words.length; i++) {
      if (haystack.indexOf(words[i]) === -1) return false;
    }
    return true;
  }

  function doSearch($input, $list, $status) {
    var index = window.SITE_SEARCH_INDEX;
    if (!index || !index.length) {
      $list.empty();
      $status.text('Search is unavailable.');
      return;
    }

    var queryNorm = normalize($input.val());
    $list.empty();

    if (!queryNorm) {
      $status.text('Type a page name or keyword to see matching resources.');
      return;
    }

    var results = [];
    for (var j = 0; j < index.length; j++) {
      var item = index[j];
      var h = haystackFor(item);
      if (matchesQuery(h, queryNorm)) results.push(item);
    }

    if (!results.length) {
      $status.text('No pages match your search.');
      return;
    }

    $status.text(results.length + ' page' + (results.length === 1 ? '' : 's') + ' found.');

    var $ul = $('<ul class="site-search-results-list no-bullet" />');
    for (var k = 0; k < results.length; k++) {
      var r = results[k];
      var $li = $('<li class="site-search-results-item" />');
      var $a = $('<a class="site-search-results-link" />')
        .attr('href', r.url)
        .text(r.title);
      $li.append($a);
      $ul.append($li);
    }
    $list.append($ul);
  }

  function debounce(fn, ms) {
    var t;
    return function () {
      var ctx = this;
      var args = arguments;
      clearTimeout(t);
      t = setTimeout(function () {
        fn.apply(ctx, args);
      }, ms);
    };
  }

  $(function () {
    var $input = $('#site-search-input');
    var $list = $('#site-search-results');
    var $status = $('#site-search-status');
    var $btn = $('#site-search-submit');
    if (!$input.length || !$list.length || !$status.length) return;

    var debounced = debounce(function () {
      doSearch($input, $list, $status);
    }, DEBOUNCE_MS);

    $input.on('input', debounced);
    $btn.on('click', function () {
      doSearch($input, $list, $status);
    });
    $input.on('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        doSearch($input, $list, $status);
        var $first = $list.find('a').first();
        if ($first.length) window.location.href = $first.attr('href');
      }
    });
  });
})(jQuery);
