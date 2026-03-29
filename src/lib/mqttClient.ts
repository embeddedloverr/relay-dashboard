import mqtt, { MqttClient } from 'mqtt';

const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
const MQTT_USERNAME = process.env.MQTT_USERNAME || '';
const MQTT_PASSWORD = process.env.MQTT_PASSWORD || '';

let client: MqttClient | null = null;
let connectPromise: Promise<MqttClient> | null = null;

export async function getMqttClient(): Promise<MqttClient> {
  if (client && client.connected) {
    return client;
  }

  // Avoid multiple simultaneous connection attempts
  if (connectPromise) {
    return connectPromise;
  }

  connectPromise = new Promise<MqttClient>((resolve, reject) => {
    const opts: mqtt.IClientOptions = {
      clientId: `relay-dashboard-${Date.now()}`,
      clean: true,
      connectTimeout: 5000,
      reconnectPeriod: 0, // Don't auto-reconnect from server side
    };

    if (MQTT_USERNAME) {
      opts.username = MQTT_USERNAME;
      opts.password = MQTT_PASSWORD;
    }

    console.log(`[MQTT] Connecting to ${MQTT_BROKER_URL}...`);
    client = mqtt.connect(MQTT_BROKER_URL, opts);

    client.on('connect', () => {
      console.log('[MQTT] Connected successfully');
      connectPromise = null;
      resolve(client!);
    });

    client.on('error', (err) => {
      console.error('[MQTT] Connection error:', err.message);
      connectPromise = null;
      reject(err);
    });

    // Timeout fallback
    setTimeout(() => {
      if (client && !client.connected) {
        connectPromise = null;
        reject(new Error('MQTT connection timeout'));
      }
    }, 6000);
  });

  return connectPromise;
}

/**
 * Publish a message to an MQTT topic.
 * Returns true if published successfully.
 */
export async function publishMqtt(
  topic: string,
  payload: string | object
): Promise<boolean> {
  try {
    const mqttClient = await getMqttClient();
    const message = typeof payload === 'string' ? payload : JSON.stringify(payload);

    return new Promise((resolve, reject) => {
      mqttClient.publish(topic, message, { qos: 0, retain: false }, (err) => {
        if (err) {
          console.error(`[MQTT] Publish error on ${topic}:`, err.message);
          resolve(false);
        } else {
          console.log(`[MQTT] Published to ${topic}: ${message}`);
          resolve(true);
        }
      });
    });
  } catch (error) {
    console.error('[MQTT] Failed to publish:', error);
    return false;
  }
}
