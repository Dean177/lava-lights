"use strict";
const bodyParser = require('body-parser');
const express = require('express');
const Promise = require('promise');
const GpioPromise =  require('./gpio-promise');
const rpGpio = process.env.IsPI ? require('rpi-gpio') : require('./gpio-mock');
const logger = require('./logger-config');

const app = express();
app.use(bodyParser.json());

const io = new GpioPromise(rpGpio);
const lightPins = { green: 11, red: 13 };
const lightStatus = { red: false, green: false };
const setupPins = io.setupPins([
  { pinId: lightPins.red, direction: rpGpio.DIR_OUT },
  { pinId: lightPins.green, direction: rpGpio.DIR_OUT }
]);

const contains = (haystack, needle) => (haystack.indexOf(needle) != -1);
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

const changeLights = (lightConfig) => Promise.all(
  lightConfig.map(({ color, status }) => changeLight(color, status))
);

const changeLight = (color, status) => {
  lightStatus[color] = status;
  return io.writePin(lightPins[color], status);
};

const toggleLights = () => {
  return changeLights([{color: 'green', status: true}, {color: 'red', status: false}])
    .then(() => delay(500))
    .then(() => changeLights([{color: 'green', status: false}, {color: 'red', status: true}]))
    .then(() => delay(500));
};

let lightsFlashingPromise;
let shouldToggleLights = true;
const startLightsFlashing = () => {
  lightsFlashingPromise = promiseWhile(() => { return shouldToggleLights; }, toggleLights)
    .then(turnOffAllLights());
};

const turnOffAllLights = () => {
  shouldToggleLights = false;
  const lightsOffPromise = Promise.all(
    Object.keys(lightPins).map(colorKey => {
      lightStatus[colorKey] = false;
      return io.writePin(lightPins[colorKey], false)
    })
  );

  if (lightsFlashingPromise) {
    return lightsFlashingPromise.then(() => { return lightsOffPromise});
  }
  return lightsOffPromise;
};

const onBuildStarted = () => {
  turnOffAllLights().then(() => { startLightsFlashing() });
};

const onBuildSuccess = () => {
  return turnOffAllLights().then(() => {
    return changeLights([
      { color: 'green', status: true },
      { color: 'red', status: false }
    ]);
  });
};

const onBuildFailure = () => {
  turnOffAllLights().then(() => {
    return changeLights([
      { color: 'green', status: false },
      { color: 'red', status: true }
    ]);
  });
};

app.get('/', (req, res) => res.send(lightStatus));

app.post('/build', (request, res) => {
  const { name, build: { phase, status } } = request.body;
  console.log("post recieved:", name, phase, status);

  if (phase === 'STARTED') {
    onBuildStarted();
  } else if (status === 'STABLE') {
    onBuildSuccess();
  } else {
    onBuildFailure();
  }

  res.status(200).send();
});

app.post('/light/:color/:on', (req, res) => {
  const { color, on } = req.params;
  const isValidUrl = (contains(['green', 'red'], color) && contains(['on', 'off'], on));
  if ( !isValidUrl) {
    const errorMessage = `Invalid url, sent color: ${req.params.color} on/off:${req.params.on}`;
    logger.info(errorMessage);
    return res.status(400).send({ error: message});
  }

  const pinId = lightPins[color];
  const isOn = on === 'on';

  io.writePin(pinId, isOn).then(() => {
    logger.info(`Changed light status ${req.params.color}:${lightStatus[req.params.color]} -> ${req.params.color}:${req.params.on}`);
    lightStatus[color] = (on === 'on');
    res.send(lightStatus);
  }).catch((err) => {
    logger.error(`Failed to change light status for: ${color} to: ${on}`);
    res.status(500).send({ error: err.message })
  });
});

setupPins.then(() => {
  app.listen(9000, (err) => { if (err) { throw err; } });
  logger.info(`listening on `);
}).catch((err) => {
  logger.error(err);
  throw err;
});
