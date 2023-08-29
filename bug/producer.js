const { Kafka } = require('kafkajs')
const kafka = new Kafka({ clientId: 'my-producer-app', brokers: ['localhost:9092'] })
const producer = kafka.producer()
const run = async () => {
  await producer.connect()
  for (let i = 0; i < 1000; i++) {
    await producer.send({ topic: 'test-topic', messages: [{ value: `Message number ${i}` }] })
    console.log(`Sent message ${i}`)
  }
  await producer.disconnect()
}
run().catch(console.error)
