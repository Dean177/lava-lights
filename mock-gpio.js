const logger = require('./logger-config');
const pinStatus = {};

const logPinStatus = () => {
  logger.info(JSON.stringify(pinStatus));
};

module.exports = {
  setup: (pinId, dir, edge, cb) => {
    pinStatus[pinId] = {
      direction: dir,
      edge,
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
  DIR_OUT: 'DIR_OUT'
};
