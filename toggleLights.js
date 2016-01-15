const Promise = require('promise');


const delay = (time) => new Promise((resolve) => setTimeout(resolve, time));
const promiseWhile = function(condition, action) {
  return new Promise((resolve, reject) => {
    var loop = function() {
      if (!condition()) return resolve();
      return Promise.resolve(action())
        .then(loop)
        .catch(reject);
    };

    process.nextTick(loop);
  });
};
Object.values = obj => Object.keys(obj).map(key => obj[key]);


const onBuildStarted = () => {
  turnOffAllLights().then(() => { startLightsFlashing() });
};

const toggleLights = () => io.writePins([
    { pinId: greenPinId, value: true }, { pinId: redPinId, value: false }])
  .then(() => delay(500))
  .then(() => io.writePins({ pinId: greenPinId, value: true }, { pinId: redPinId, value: false }))
  .then(() => delay(500));


let lightsFlashingPromise;
let shouldToggleLights = true;
const startLightsFlashing = () => {
  lightsFlashingPromise = promiseWhile(() => { return shouldToggleLights; }, toggleLights)
    .then(turnOffAllLights());
};
