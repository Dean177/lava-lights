"use strict";
const express = require('express');
const GpioPromise =  require('./gpio-promise');
const rpGpio = process.env.IsPI ? require('rpi-gpio') : require('./gpio-mock');
const logger = require('./logger-config');

const app = express();
const io = new GpioPromise(rpGpio);
const contains = (haystack, needle) => (haystack.indexOf(needle) != -1);
const changeLightStatus = (light, isOn) => (io.writePin(light, isOn === 'on'));

const green = 7;
const red = 8;
const lightStatus = { red: false, green: false };
const setupPins = io.setupPins([
  { pinId: red, direction: rpGpio.DIR_OUT },
  { pinId: green, direction: rpGpio.DIR_OUT }
]);


app.get('/', (req, res) => res.send(lightStatus));

app.post('/light/:color/:on', (req, res) => {
  const { color, on } = req.params;
  const isValidUrl = (contains(['green', 'red'], color) && contains(['on', 'off'], on));
  if ( !isValidUrl) {
    const errorMessage = `Invalid url, sent color: ${req.params.color} on/off:${req.params.on}`;
    logger.info(errorMessage);
    return res.status(400).send({ error: message});
  }

  changeLightStatus(color, on).then(() => {
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
