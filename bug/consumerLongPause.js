const { Kafka } = require('kafkajs')

const kafka = new Kafka({ clientId: 'my-app', brokers: ['localhost:9092'] })
const consumer = kafka.consumer({
  groupId: 'test-group',
  sessionTimeout: 10000,
  heartbeatInterval: 3000,
})

let counter = 0

const run = async () => {
  await consumer.connect()
  await consumer.subscribe({ topic: 'test-topic', fromBeginning: true })

  await consumer.run({
    eachMessage: async ({ message }) => {
      counter++
      if (process.env.STUCK_AFTER_10 === 'true' && counter > 10) {
        console.log('Sleep 3 minutes.')
        await new Promise(resolve => setTimeout(resolve, 180000)) // 3 minutes
      }
      await new Promise(resolve => setTimeout(resolve, 2000)) // 2 seconds
      console.log({ value: message.value.toString() })
    },
  })
}

run().catch(console.error)

if (process.env.STUCK_AFTER_10 === 'true') {
  const { HEARTBEAT, FETCH } = consumer.events
  consumer.on(HEARTBEAT => console.log(`heartbeat`))
  consumer.on(FETCH, e => console.log(`fetch from nodeId: ${e.payload.nodeId}`))
}
