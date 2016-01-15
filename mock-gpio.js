const logger = require('./logger-config');

const pinStatus = {};
const logPinStatus = () => {
  logger.info('PinStatus', JSON.stringify(pinStatus));
};

module.exports = {
  setup: (pinId, direction, cb) => {
    pinStatus[pinId] = {
      direction,
      isSetup: true
    };
    logPinStatus();
    cb();
  },
  write: (pinId, value, cb) => {
    pinStatus[pinId]['lastValue'] = value;
    logPinStatus();
    cb();
  },
  DIR_OUT: 'out'
};
