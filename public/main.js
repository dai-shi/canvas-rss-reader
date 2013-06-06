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
  var scrollTween = null;

  var playBounceTween = function(targetY) {
    var tween = new Kinetic.Tween({
      node: layer,
      easing: Kinetic.Easings.StrongEaseOut,
      duration: 0.3,
      y: targetY
    });
    tween.play();
  };

  layer.on('mousedown touchstart', function() {
    if (scrollTween) {
      scrollTween.pause();
      scrollTween = null;
      var pos = layer.getPosition();
      if (pos.y > 0) {
        playBounceTween(0);
      } else if (pos.y < -layerHeight + stage.getHeight()) {
        playBounceTween(-layerHeight + stage.getHeight());
      }
    }
  });

  layer.on('dragstart', function() {
    lastDragMoveYDiff = 0;
    lastDragMoveTimeDiff = 0;
    lastDragMoveY = 0;
    lastDragMoveTime = 0;
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
    var pos = layer.getPosition();
    var newY;
    if (pos.y > 0) {
      playBounceTween(0);
      return;
    } else if (pos.y < -layerHeight + stage.getHeight()) {
      playBounceTween(-layerHeight + stage.getHeight());
      return;
    } else if (lastDragMoveTimeDiff > 0) {
      var duration = 3.0;
      var speed = (lastDragMoveYDiff / lastDragMoveTimeDiff) * 1000;
      var diffY = 0.35 * duration * speed;
      if (diffY * diffY < 9) {
        return;
      }
      var easing = Kinetic.Easings.StrongEaseOut;
      var newY = pos.y + diffY;
      var onFinish = null;
      if (newY > 0) {
        if (newY > 70) {
          newY = 70;
        }
        onFinish = function() {
          playBounceTween(0);
        };
      } else if (newY < -layerHeight + stage.getHeight()) {
        if (newY < -layerHeight + stage.getHeight() - 70) {
          newY = -layerHeight + stage.getHeight() - 70;
        }
        onFinish = function() {
          playBounceTween(-layerHeight + stage.getHeight());
        };
      }
      if (onFinish) {
        duration = Math.abs(newY - pos.y) / speed;
        if (duration < 0.3) {
          duration = 0.3;
        }
        easing = Kinetic.Easings.Linear;
      }
      scrollTween = new Kinetic.Tween({
        node: layer,
        easing: easing,
        duration: duration,
        y: newY,
        onFinish: onFinish
      });
      scrollTween.play();
      return;
    } else {
      return;
    }
  });
})();

stage.add(layer);

function createSmallPane(item, width, height) {
  var tmp = new Kinetic.Group();
  var rect = new Kinetic.Rect({
    x: 0,
    y: 0,
    width: width,
    height: height,
    fillLinearGradientStartPointY: Math.floor(height * 0.85),
    fillLinearGradientEndPointY: height,
    fillLinearGradientColorStops: [0, '#efefef', 1, '#dcdcdc']
  });
  tmp.add(rect);
  var text1 = new Kinetic.Text({
    x: 0,
    y: 0,
    width: width,
    height: Math.floor(height * 0.6),
    padding: 5,
    fontSize: Math.floor((height * 0.6 - 10) / 2),
    text: item.title,
    fontFamily: 'Arial',
    fill: '#000000',
    shadowColor: '#ffffff',
    shadowBlur: -1,
    shadowOffset: 1,
    shadowOpacity: 0.9
  });
  tmp.add(text1);
  var summary = item.description.replace(/<.+?>/g, '');
  var text2 = new Kinetic.Text({
    x: 0,
    y: Math.floor(height * 0.6) - 5,
    width: width,
    height: Math.floor(height * 0.4),
    padding: 5,
    fontSize: Math.floor((height * 0.4 - 10) / 2),
    text: summary,
    fontFamily: 'Arial',
    fill: '#606060'
  });
  tmp.add(text2);
  return tmp;
}

function updateRssContent(items) {
  var tmpLayer = new Kinetic.Layer();
  var width = stage.getWidth();
  var height = 80;
  var y = 0;
  $.each(items, function(index, item) {
    var tmp = createSmallPane(item, width, height);
    tmp.setOffsetY(-y);
    y = y + height;
    tmpLayer.add(tmp);
  });
  tmpLayer.toImage({
    width: width,
    height: y,
    callback: function(img) {
      var image = new Kinetic.Image({
        image: img,
        x: 0,
        y: 0
      });
      layer.add(image);
      layerHeight = y;
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
