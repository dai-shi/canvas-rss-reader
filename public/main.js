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
  fill: 'black'
});

var text = new Kinetic.Text({
  x: stage.getWidth() / 2,
  y: stage.getHeight() / 2,
  text: 'Hello World!',
  fontSize: 30,
  fontFamily: 'Arial',
  fill: 'lightgray'
});

text.setOffset({
  x: text.getWidth() / 2,
  y: text.getHeight() / 2
});

layer.add(rect);
layer.add(text);
stage.add(layer);
