# termo-ghymbal
ESP32-CAM-GHYMBAL

# Termo-Ghymbal

## Як запустити

1. Клонувати репозиторій:
git clone https://github.com/yatoropov/termo-ghymbal.git
cd termo-ghymbal

markdown
Копіювати
Редагувати

2. Створити `.env` файл (приклад див. у `.env.example`):
ADMIN_LOGIN=admin
ADMIN_PASS=123456
SESSION_SECRET=my_super_secret
MQTT_URL=mqtt://test.mosquitto.org:1883

markdown
Копіювати
Редагувати

3. Встановити залежності та запустити:
npm install
npm start

markdown
Копіювати
Редагувати

4. Відкрити у браузері:
http://<SERVER_IP>:8080

yaml
Копіювати
Редагувати

## MQTT

- MQTT брокер (за замовчуванням test.mosquitto.org, але краще поставити свій)
- Команди для гімбала надсилаються у топік `gimbal/cmd`
- ESP32 має бути підписаний на `gimbal/cmd` і відправляти статус у `gimbal/status`

---
