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

var layerHeight = stage.getHeight();

var layer = new Kinetic.Layer({
  draggable: true,
  dragBoundFunc: function(pos) {
    return {
      x: this.getAbsolutePosition().x,
      y: pos.y
    };
  }
});

(function() {
  var lastDragMoveY;
  var lastDragMoveTime;
  var lastDragMoveYDiff;
  var lastDragMoveTimeDiff;

  layer.on('dragstart', function() {
    lastDragMoveTime = 0;
    lastDragMoveYDiff = 0;
    lastDragMoveTimeDiff = 0;
  });

  layer.on('dragmove', function() {
    var now = new Date().getTime();
    var pos = layer.getPosition();
    if (lastDragMoveTime > 0) {
      lastDragMoveYDiff = pos.y - lastDragMoveY;
      lastDragMoveTimeDiff = now - lastDragMoveTime;
    }
    lastDragMoveY = pos.y;
    lastDragMoveTime = now;
  });

  layer.on('dragend', function() {
    console.log('hoge', lastDragMoveTime, lastDragMoveTimeDiff, lastDragMoveY, lastDragMoveYDiff);
    var pos = layer.getPosition();
    var easing = Kinetic.Easings.StrongEaseOut;
    var duration = 0.3;
    var newY;
    if (pos.y > 0) {
      newY = 0;
    } else if (pos.y < -layerHeight + stage.getHeight()) {
      newY = -layerHeight + stage.getHeight();
    } else if (lastDragMoveTimeDiff > 0) {
      var diffY = lastDragMoveYDiff * 100 / lastDragMoveTimeDiff;
      if (diffY * diffY < 9) {
        return;
      }
      newY = pos.y + diffY;
      duration = 1.0;
      if (newY > 0) {
        newY = 0;
        easing = Kinetic.Easing.BounceEaseOut;
      } else if (newY < -layerHeight + stage.getHeight()) {
        newY = -layerHeight + stage.getHeight();
        easing = Kinetic.Easing.BounceEaseOut;
      }
    } else {
      return;
    }
    var tween = new Kinetic.Tween({
      node: layer,
      easing: easing,
      duration: duration,
      y: newY
    });
    tween.play();
  });
})();

stage.add(layer);

function updateRssContent(items) {
  var tmp = new Kinetic.Layer();
  var rect = new Kinetic.Rect({
    x: 0,
    y: 0,
    width: stage.getWidth(),
    height: stage.getHeight(),
    fill: '#000000'
  });
  tmp.add(rect);
  var y = 5;
  $.each(items, function(index, item) {
    var text = new Kinetic.Text({
      x: 5,
      y: y,
      text: item.title,
      fontSize: 12,
      fontFamily: 'Arial',
      fill: '#aaaaff'
    });
    y = y + text.getHeight() + 5;
    tmp.add(text);
  });
  if (y > rect.getHeight()) {
    rect.setHeight(y);
  }
  tmp.toImage({
    width: rect.getWidth(),
    height: rect.getHeight(),
    callback: function(img) {
      var image = new Kinetic.Image({
        image: img,
        x: 0,
        y: 0
      });
      layer.add(image);
      layerHeight = rect.getHeight();
      layer.draw();
    }
  });
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
