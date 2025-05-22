// mqtt.js
require('dotenv').config();
const mqtt = require('mqtt');

// Підключення до твого брокера (адреса і порт з .env)
const mqttClient = mqtt.connect(process.env.MQTT_URL, {
  username: process.env.MQTT_USER,
  password: process.env.MQTT_PASS,
});

mqttClient.on('connect', () => {
  console.log('Connected to MQTT broker');
  mqttClient.subscribe('gimbal/status');
});

mqttClient.on('message', (topic, message) => {
  console.log(`MQTT message: ${topic} — ${message.toString()}`);
  // Можеш сюди додати оновлення статусу для фронту через WebSocket або зберігати в змінній
});

// Функція для відправки команд ESP (публікація в топік)
function sendGimbalCommand(cmd) {
  mqttClient.publish('gimbal/cmd', cmd);
}

module.exports = { mqttClient, sendGimbalCommand };
