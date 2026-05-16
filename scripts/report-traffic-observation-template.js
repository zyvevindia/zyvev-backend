#!/usr/bin/env node
const {
  buildTrafficObservationTemplate,
} = require("../services/traffic-observations");
console.log(JSON.stringify(buildTrafficObservationTemplate(), null, 2));
