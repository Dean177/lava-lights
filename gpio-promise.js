"use strict";
const Promise = require('promise');
const logger = require('./logger-config');

class Gpio {
  constructor(gpio) {
    this.pinStatus = {};
    this.gpio = gpio;
  }

  isPinSetup(pinId) {
    return this.pinStatus.hasOwnProperty(pinId) && this.pinStatus[pinId];
  }

  setupPin(pinId, direction) {
    return new Promise((fulfill, reject) => {
      this.gpio.setup(pinId, direction, (err) =>  {
        this.pinStatus[pinId] = !err;
        if (err) { return reject(err); }
        logger.info(`Setup ${pinId}, direction: ${direction}.`);
        fulfill({ pinId, direction });
      });
    });
  }

  setupPins(pinConfig) {
    return Promise.all(pinConfig.map(({ pinId, direction, edge }) => this.setupPin(pinId, direction, edge)));
  }

  writePin(pinId, value) {
    return new Promise((fulfill, reject) => {
      if (!this.isPinSetup(pinId)) {
        return reject(new Error('Attempted to write to pin before pin was setup'));
      }

      this.gpio.write(pinId, value ? 1 : 0, (err) =>  {
        if (err) { return reject(err); }
        logger.info(`Wrote ${value} to ${pinId}`);
        fulfill({ pinId, value });
      });
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
