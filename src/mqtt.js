require('dotenv').config();
const mqtt = require('mqtt');

let lastStatus = 'OFF';      // значення статусу
let lastStatusTime = 0;      // час останнього "OK"

const mqttClient = mqtt.connect(process.env.MQTT_URL, {
  username: process.env.MQTT_USER,
  password: process.env.MQTT_PASS,
});

mqttClient.on('connect', () => {
  console.log('Connected to MQTT broker');
  mqttClient.subscribe('gimbal/status');
});

mqttClient.on('message', (topic, message) => {
  if (topic === 'gimbal/status') {
    if (message.toString().trim() === 'OK') {
      lastStatus = 'OK';
      lastStatusTime = Date.now();
    }
  }
});

// функція, яка повертає поточний статус
function getGimbalStatus() {
  // Якщо останній "OK" не старше 5 сек — статус OK, інакше OFF
  if (Date.now() - lastStatusTime < 5000) {
    return { value: 'OK', color: 'green' };
  } else {
    return { value: 'OFF', color: 'red' };
  }
}

function sendGimbalCommand(cmd) {
  mqttClient.publish('gimbal/cmd', cmd);
}

module.exports = { mqttClient, sendGimbalCommand, getGimbalStatus };
