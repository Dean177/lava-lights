function mockLog(...theArgs) {
  console.log(theArgs);
}

module.exports = {
  setup: (pinId, dir, edge, cb) => { cb(); },
  write: (pinId, value, cb) => { cb(); },
  DIR_OUT: 'DIR_OUT'
};
