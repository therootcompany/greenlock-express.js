$(function () {
  'use strict';

  var tpl = $('.js-hostnames').html();
  $('.js-hostnames').html('');

  $('body').on('submit', 'form.js-add-site', function (ev) {
    ev.preventDefault();
    // I don't think this actually has any meaning when listening on body
    ev.stopPropagation();

    var data = {
      email: $('.js-email').val()
    , agreeTos: !!$('.js-agree-tos').prop('checked')
    , server: $('.js-server').val()
    , domains: $('.js-domains').val().split(/\s*,\s*/)
    };

    $.ajax({
      method: 'POST'
    , url: '/api/com.daplie.lex/sites'
    , data: JSON.stringify(data)
    , headers: { 'Content-Type': 'application/json; charset=utf-8' }
    }).then(function (data) {
      console.log(data);
    });
  });

  $.ajax({
    method: 'GET'
  , url: '/api/com.daplie.lex/sites'
  }).then(function (data) {
    var $hostnames = $('.js-hostnames');
    $hostnames.html('');
    data.forEach(function (config) {
      var $conf = $(tpl);
      $conf.text(config.domains);
      $hostnames.append($conf);
    });
  });
});
