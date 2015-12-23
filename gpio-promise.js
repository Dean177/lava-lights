"use strict";
const Promise = require('promise');

class Gpio {
  constructor(gpio) {
    this.gpio = gpio;
  }

  setupPin(pinId, direction, edge) {
    return new Promise((fulfill, reject) => {
      this.gpio.setup(pinId, direction, edge, (err) =>  { err ? reject(err) : fulfill(); });
    });
  }

  setupPins(pinConfig) {
    return Promise.all(pinConfig.map(({ pinId, direction, edge }) => this.setupPin(pinId, direction, edge)));
  }

  writePin(pinId, value) {
    return new Promise((fulfill, reject) => {
      this.gpio.write(pinId, value, (err) =>  { err ? reject(err) : fulfill(); });
    });
  }

  destroy() {
    return Promise.resolve(this.gpio.destroy());
  }
}

module.exports = Gpio;
