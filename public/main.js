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

var mainPane = new Kinetic.Group();
var leftPane = new Kinetic.Group();
var rightPane = new Kinetic.Group();

mainPane.setX(0);
leftPane.setX(-stage.getWidth());
rightPane.setX(stage.getWidth());

var slideLayer = new Kinetic.Layer();
slideLayer.add(mainPane);
slideLayer.add(leftPane);
slideLayer.add(rightPane);

var rssItems = [];
var rssIndex = 0;

var drawPaneFunc = null;

function playSlideTween() {
  var width = stage.getWidth();
  var posX = mainPane.getAbsolutePosition().x;
  var newRssIndex;
  var newLeftPane;
  var newMainPane;
  var newRightPane;

  if (posX > 20 && rssIndex > 0) {
    rssIndex--;
    newRssIndex = rssIndex;
    newLeftPane = rightPane;
    newMainPane = leftPane;
    newRightPane = mainPane;
    leftPane = newLeftPane;
    mainPane = newMainPane;
    rightPane = newRightPane;
    setTimeout(function() {
      newLeftPane.setX(width * (newRssIndex - 1));
      newRightPane.setX(width * (newRssIndex + 1));
      if (drawPaneFunc) {
        newLeftPane.setY(0);
        drawPaneFunc(newLeftPane, rssItems[newRssIndex - 1]);
      }
    }, 300);
    new Kinetic.Tween({
      node: slideLayer,
      easing: Kinetic.Easings.StrongEaseOut,
      duration: 0.3,
      x: -width * newRssIndex
    }).play();
  } else if (posX < -20 && rssIndex < rssItems.length - 1) {
    rssIndex++;
    newRssIndex = rssIndex;
    newLeftPane = mainPane;
    newMainPane = rightPane;
    newRightPane = leftPane;
    leftPane = newLeftPane;
    mainPane = newMainPane;
    rightPane = newRightPane;
    setTimeout(function() {
      newRightPane.setX(width * (newRssIndex + 1));
      newLeftPane.setX(width * (newRssIndex - 1));
      if (drawPaneFunc) {
        newRightPane.setY(0);
        drawPaneFunc(newRightPane, rssItems[newRssIndex + 1]);
      }
    }, 300);
    new Kinetic.Tween({
      node: slideLayer,
      easing: Kinetic.Easings.StrongEaseOut,
      duration: 0.3,
      x: -width * newRssIndex
    }).play();
  } else {
    new Kinetic.Tween({
      node: mainPane,
      easing: Kinetic.Easings.StrongEaseOut,
      duration: 0.3,
      x: -slideLayer.getAbsolutePosition().x
    }).play();
  }
}

function setupDraggableLayer(layer) {
  layer.setDraggable(true);
  var draggingX = false;
  var draggingY = false;
  var dragStartPosY = 0;
  layer.setDragBoundFunc(function(pos) {
    var newPos = {
      x: pos.x,
      y: pos.y
    };
    if (!draggingX && !draggingY) {
      if (Math.abs(newPos.y - dragStartPosY) > 35) {
        draggingY = true;
        newPos.x = 0;
      } else if (Math.abs(newPos.x) > 15) {
        draggingX = true;
        if (newPos.y > 0) {
          newPos.y = 0;
        } else if (newPos.y < -layer.getAttr('scrollHeight') + stage.getHeight()) {
          newPos.y = -layer.getAttr('scrollHeight') + stage.getHeight();
        } else {
          newPos.y = this.getAbsolutePosition().y;
        }
      } else {
        newPos.x = 0;
      }
    } else if (draggingX) {
      newPos.y = this.getAbsolutePosition().y;
    } else {
      newPos.x = 0;
    }
    return newPos;
  });

  var lastDragMoveY;
  var lastDragMoveTime;
  var lastDragMoveYDiff;
  var lastDragMoveTimeDiff;
  var scrollTween = null;

  var playBounceTween = function(targetY) {
    new Kinetic.Tween({
      node: layer,
      easing: Kinetic.Easings.StrongEaseOut,
      duration: 0.3,
      y: targetY
    }).play();
  };

  layer.on('mousedown touchstart', function() {
    if (scrollTween) {
      scrollTween.pause();
      scrollTween = null;
      var pos = layer.getPosition();
      var scrollHeight = layer.getAttr('scrollHeight');
      if (pos.y > 0) {
        playBounceTween(0);
      } else if (pos.y < -scrollHeight + stage.getHeight()) {
        playBounceTween(-scrollHeight + stage.getHeight());
      }
    }
  });

  layer.on('dragstart', function() {
    lastDragMoveYDiff = 0;
    lastDragMoveTimeDiff = 0;
    lastDragMoveY = 0;
    lastDragMoveTime = 0;
    dragStartPosY = this.getAbsolutePosition().y;
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
    if (draggingX) {
      playSlideTween();
      draggingX = false;
      return;
    }
    draggingY = false;
    var pos = layer.getPosition();
    var newY;
    var scrollHeight = layer.getAttr('scrollHeight');
    if (pos.y > 0) {
      playBounceTween(0);
      return;
    } else if (pos.y < -scrollHeight + stage.getHeight()) {
      playBounceTween(-scrollHeight + stage.getHeight());
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
      } else if (newY < -scrollHeight + stage.getHeight()) {
        if (newY < -scrollHeight + stage.getHeight() - 70) {
          newY = -scrollHeight + stage.getHeight() - 70;
        }
        onFinish = function() {
          playBounceTween(-scrollHeight + stage.getHeight());
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
}

setupDraggableLayer(mainPane);
setupDraggableLayer(leftPane);
setupDraggableLayer(rightPane);

stage.add(slideLayer);

function createSmallPane(item, width, height) {
  var group = new Kinetic.Group();
  var rect = new Kinetic.Rect({
    x: 0,
    y: 0,
    width: width,
    height: height,
    fillLinearGradientStartPointY: Math.floor(height * 0.85),
    fillLinearGradientEndPointY: height,
    fillLinearGradientColorStops: [0, '#efefef', 1, '#dcdcdc']
  });
  group.add(rect);
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
  group.add(text1);
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
  group.add(text2);
  return group;
}

function drawSmallPane(pane, items) {
  pane.removeChildren();
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
      pane.add(image);
      pane.setAttr('scrollHeight', y);
      pane.draw();
    }
  });
}

function createBigPane(item, width, height) {
  var group = new Kinetic.Group();
  var text1 = new Kinetic.Text({
    x: 0,
    y: 0,
    width: width,
    padding: 5,
    fontSize: 24,
    text: item.title,
    fontFamily: 'Arial',
    fill: '#000000'
  });
  var y = text1.getHeight();
  var rect1 = new Kinetic.Rect({
    x: 0,
    y: 0,
    width: width,
    height: y,
    fillLinearGradientStartPointY: y - 20,
    fillLinearGradientEndPointY: y,
    fillLinearGradientColorStops: [0, '#efefef', 1, '#dcdcdc']
  });
  group.add(rect1);
  group.add(text1);
  var summary = item.description.replace(/<.+?>/g, '');
  var text2 = new Kinetic.Text({
    x: 0,
    y: y,
    width: width,
    padding: 5,
    fontSize: 16,
    text: summary,
    fontFamily: 'Arial',
    fill: '#606060'
  });
  var h = text2.getHeight();
  if (y + h < height) {
    h = height - y;
  }
  var rect2 = new Kinetic.Rect({
    x: 0,
    y: y,
    width: width,
    height: h,
    fillLinearGradientStartPointY: h - 20,
    fillLinearGradientEndPointY: h,
    fillLinearGradientColorStops: [0, '#efefef', 1, '#dcdcdc']
  });
  group.add(rect2);
  group.add(text2);
  return group;
}

function drawBigPane(pane, item) {
  if (!item) {
    return;
  }
  pane.removeChildren();
  var width = stage.getWidth();
  var height = stage.getHeight();
  var tmp = createBigPane(item, width, height);
  if (tmp.getHeight() > height) {
    height = tmp.getHeight();
  }
  new Kinetic.Layer().add(tmp).toImage({
    width: width,
    height: height,
    callback: function(img) {
      var image = new Kinetic.Image({
        image: img,
        x: 0,
        y: 0
      });
      pane.add(image);
      pane.setAttr('scrollHeight', height);
      pane.draw();
    }
  });
}

function updateRssContent(items) {
  rssItems = items;
  rssIndex = 0;

  drawSmallPane(leftPane, rssItems);

  drawBigPane(mainPane, rssItems[rssIndex]);
  //drawBigPane(leftPane, rssItems[rssIndex - 1]);
  drawBigPane(rightPane, rssItems[rssIndex + 1]);

  drawPaneFunc = drawBigPane;
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
