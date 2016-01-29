#!/usr/bin/env bash
curl -H "Content-Type: application/json" -X POST -d '{ "name": "projectName", "build": { "phase": "thePhase", "status": "UNSTABLE" } }' http://raspberrypi/build