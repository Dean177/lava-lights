var gpio = require('rpi-gpio');

var pin   = 18;
var delay = 2000;

gpio.setup(pin, gpio.DIR_OUT, on);

function on() {
  gpio.write(pin, 1, off);
}

function off() {
  console.log("Wrote pin on");

  setTimeout(function() {
    gpio.write(pin, 0, destroy);
  }, delay);
}

function destroy() {
  console.log("pin off");

  setTimeout(function() {
    gpio.destroy(function() { console.log('Closed pins, now exit'); });
  }, delay);
}
