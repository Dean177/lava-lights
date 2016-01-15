"use strict";
const bodyParser = require('body-parser');
const express = require('express');
const logger = require('./logger-config');
const GpioPromise =  require('./gpio-promise');
const gpio = process.env.IsPI ? require('rpi-gpio') : require('./mock-gpio');
const io = new GpioPromise(gpio);

const app = express();
app.use(bodyParser.json());

const contains = (haystack, needle) => (haystack.indexOf(needle) != -1);

const [greenPinId, redPinId] = [18, 23];
const setupPins = io.setupPins([{ pinId: redPinId, direction: gpio.DIR_OUT }, { pinId: greenPinId, direction: gpio.DIR_OUT }]);

const turnOffAllLights = () => io.writePins([{ pinId: greenPinId, value: false },  { pinId: redPinId, value: false }]);
const onBuildSuccess = () => turnOffAllLights().then(() => io.writePin(greenPinId, true));
const onBuildFailure = () => turnOffAllLights().then(() => io.writePin(redPinId, true));

app.get('/status', (request, response) => response.send('beep boop'));

app.post('/build', (request, response) => {
  const { name, build: { phase, status } } = request.body;
  logger.info(`Build notification received name: ${name}, phase: ${phase}, status: ${status}`);
  const changeBuildStatus = (status === 'STABLE') ? onBuildSuccess() : onBuildFailure();

  changeBuildStatus
    .then(() => response.status(200).send())
    .catch((err) => {
      logger.error(err);
      response.status(500).send(err);
    });
});

app.post('/light/:color/:on', (request, response) => {
  const { color, on } = request.params;
  logger.info('Manual color set', color, on);

  const isValidUrl = (contains(['green', 'red'], color) && contains(['on', 'off'], on));
  if ( ! isValidUrl) {
    const errorMessage = `Invalid url, sent color: ${color} on/off: ${on}`;
    logger.error(errorMessage);
    return response.status(400).send({ error: errorMessage });
  }

  const pinId = color == 'green' ? greenPinId : redPinId;
  const value = on === 'on';

  io.writePin(pinId, value)
    .then(() => logger.info(`Changed light status; ${color}: ${on}`))
    .then(() => response.status(200).send())
    .catch((err) => {
      logger.error(`Failed to change light status for: ${color} to: ${on}`);
      return response.status(500).send({ error: err.message })
    });
});

setupPins.then(() => {
  const port = 9000;
  app.listen(port, (err) => {
    if (err) { throw err; }
    logger.info(`Listening on ${port}`);
    logger.info(`Running on raspberryPi: ${process.env.IsPI}`);
  });
}).catch(logger.error);
