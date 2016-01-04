const logger = require('./logger-config');
const pinStatus = {};


module.exports = {
  setup: (pinId, dir, edge, cb) => {
    pinStatus[pinId] = {
      direction: dir,
      edge,
      isSetup: true
    };
    logger.info(pinStatus);
    cb();
  },
  write: (pinId, value, cb) => {
    pinStatus[pinId]['lastValue'] = value;
    logger.info(pinStatus);
    cb();
  },
  DIR_OUT: 'DIR_OUT'
};
