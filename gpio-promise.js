"use strict";
const Promise = require('promise');

class Gpio {
  constructor(gpio) {
    this.pinStatus = {};
    this.gpio = gpio;
  }

  isPinSetup(pinId) {
    return pinStatus.hasOwnProperty(pinId) && pinStatus[pinId];
  }

  setupPin(pinId, direction, edge) {
    return new Promise((fulfill, reject) => {
      this.gpio.setup(pinId, direction, edge, (err) =>  {
        this.pinStatus[pinId] = !err;
        return (err) ? reject(err) : fulfill(pinId);
      });
    });
  }

  setupPins(pinConfig) {
    return Promise.all(pinConfig.map(({ pinId, direction, edge }) => this.setupPin(pinId, direction, edge)));
  }

  writePin(pinId, value) {
    return new Promise((fulfill, reject) => {
      if (!this.isPinSetup(pinId)) {
        reject(new Error('Attempted to write to pin before pin was setup'));
      }
      this.gpio.write(pinId, value, (err) =>  { err ? reject(err) : fulfill({ pinId, value }); });
    });
  }

  writePins(pinConfig) {
    return Promise.all(pinConfig.map(({ pinId, value }) => this.writePin(pinId, value)));
  }

  destroy() {
    Object.keys(this.pinStatus).forEach((pinId) => this.pinStatus[pinId] = false);
    return Promise.resolve(this.gpio.destroy());
  }
}

module.exports = Gpio;
