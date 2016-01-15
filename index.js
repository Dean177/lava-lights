"use strict";
const bodyParser = require('body-parser');
const express = require('express');
const GpioPromise =  require('./gpio-promise');
const gpio = process.env.IsPI ? require('rpi-gpio') : require('./mock-gpio');
const io = new GpioPromise(gpio);
const logger = require('./logger-config');

const app = express();
app.use(bodyParser.json());

const contains = (haystack, needle) => (haystack.indexOf(needle) != -1);

const [greenPinId, redPinId] = [18, 23];
const setupPins = io.setupPins([{ pinId: redPinId, direction: gpio.DIR_OUT }, { pinId: greenPinId, direction: gpio.DIR_OUT }]);

const turnOffAllLights = () => io.writePins([{ pinId: greenPinId, value: false },  { pinId: redPinId, value: false }]);
const onBuildSuccess = () => turnOffAllLights().then(() => io.writePin(greenPinId, true));
const onBuildFailure = () => turnOffAllLights().then(() => io.writePin(redPinId, true));

app.post('/build', (request, res) => {
  const { name, build: { phase, status } } = request.body;
  logger.info("post recieved:", name, phase, status);
  const changeBuildStatus = (status === 'STABLE') ? onBuildSuccess() : onBuildFailure();

  changeBuildStatus
    .then(res.status(200).send)
    .catch(logger.error);
});

app.post('/light/:color/:on', (req, res) => {
  const { color, on } = req.params;

  const isValidUrl = (contains(['green', 'red'], color) && contains(['on', 'off'], on));
  if ( !isValidUrl) {
    const errorMessage = `Invalid url, sent color: ${req.params.color} on/off:${req.params.on}`;
    logger.error(errorMessage);
    return res.status(400).send({ error: message});
  }

  const pinId = color == 'green' ? greenPinId : redPinId;
  const value = on === 'on';

  io.writePin(pinId, value)
    .then(() => {
      logger.info(`Changed light status ${req.params.color}:${lightStatus[req.params.color]} -> ${req.params.color}:${req.params.on}`);
    })
    .then(res.status(200).send)
    .catch((err) => {
      logger.error(`Failed to change light status for: ${color} to: ${on}`);
      res.status(500).send({ error: err.message })
    });
});

setupPins.then(() => {
  app.listen(9000, logger.error);
  logger.info(`listening on 9000`);
}).catch(logger.error);
