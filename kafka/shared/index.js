const eventTypes = require('./event-types');
const kafkaConfig = require('./kafka-config');

module.exports = {
  ...eventTypes,
  ...kafkaConfig,
};
