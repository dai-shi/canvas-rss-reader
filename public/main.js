/*
  Copyright (C) 2013, Daishi Kato <daishi@axlight.com>
  All rights reserved.

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
  "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
  LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
  A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
  HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
  SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
  LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
  DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
  THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
  OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

/* global Kinetic: false */

var stage = new Kinetic.Stage({
  container: 'container',
  width: window.innerWidth,
  height: window.innerHeight
});

var layer = new Kinetic.Layer();

var rect = new Kinetic.Rect({
  x: 0,
  y: 0,
  width: stage.getWidth(),
  height: stage.getHeight(),
  fill: '#000000'
});

var text = new Kinetic.Text({
  x: stage.getWidth() / 2,
  y: stage.getHeight() / 2,
  text: 'Hello World!',
  fontSize: 30,
  fontFamily: 'Arial',
  fill: '#eeeeee'
});

text.setOffset({
  x: text.getWidth() / 2,
  y: text.getHeight() / 2
});

layer.add(rect);
layer.add(text);
stage.add(layer);

function updateRssContent(items) {
  $.each(items, function(index, item) {
    var text = new Kinetic.Text({
      x: 5,
      y: 5,
      text: item.title,
      fontSize: 12,
      fontFamily: 'Arial',
      fill: '#aaaaff'
    });
    text.setOffset({
      y: -index * (text.getHeight() + 5)
    });
    layer.add(text);
  });
  layer.draw();
}


var rssurl = location.hash ? location.hash.substring(1) : 'news/itmedia%26cnetjapan.rss';
if (rssurl.lastIndexOf('http://', 0) !== 0) {
  rssurl = 'http://rss-pipes.herokuapp.com/aggregator/' + rssurl;
}

$.ajax({
  type: 'GET',
  url: rssurl,
  dataType: 'xml',
  success: function(xml) {
    var $xml = $(xml);
    var items = [];
    $xml.find("item").each(function() {
      var $this = $(this);
      var item = {
        title: $this.find("title").text(),
        link: $this.find("link").text(),
        description: $this.find("description").text(),
        pubDate: $this.find("pubDate").text()
      };
      items.push(item);
    });
    updateRssContent(items);
  },
  error: function() {
    alert('failed to get the rss: ' + rssurl);
  }
});
