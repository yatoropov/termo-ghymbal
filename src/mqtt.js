require('dotenv').config();
const mqtt = require('mqtt');

const mqttClient = mqtt.connect(process.env.MQTT_URL);

mqttClient.on('connect', () => {
  console.log('Connected to MQTT broker');
  // Підпишися на потрібні топіки, якщо треба!
  mqttClient.subscribe('gimbal/status');
});

mqttClient.on('message', (topic, message) => {
  // Обробка вхідних повідомлень
  console.log(`MQTT message: ${topic} — ${message.toString()}`);
  // Додай тут пересилку на WebSocket, якщо треба.
});

function sendGimbalCommand(cmd) {
  // Надіслати команду на ESP32
  mqttClient.publish('gimbal/cmd', cmd);
}

module.exports = { mqttClient, sendGimbalCommand };
