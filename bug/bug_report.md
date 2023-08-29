**Describe the bug**
Given a consumer that consumes from fewer partitions than there are nodeIds in the kafka cluster.
Then, kafkajs does not remove this consumer from its group even if it blocks for > session timeout.

This is because kafkajs creates fetchers for all nodeIds in the cluster.
Then, for the fetcher with a nodeId that is not a partion leader, `ConsumerGroup.fetch(nodeId)` filters out
all topic partitions for this nodeId which results in an empty `requests` array.
It then sleeps for `maxWaitTime` and returns an empty batch (basically simulating a broker fetch to an empty partition).
```javascript
  topicPartitions = this.filterPartitionsByNode(nodeId, topicPartitions)
  ...
  const requests = topicPartitions.map(...)
  ...
  if (!requests.length) {
    await sleep(this.maxWaitTime)
    return []
  }
```

The empty batch returned by `ConsumerGroup.fetch` will cause `Runner.fetch(nodeId)` to send a heartbeat:
```javascript
    if (batches.length === 0) {
      await this.heartbeat()
    }
```

**To Reproduce**

To reproduce this behaviour you can, for example,
1. create a topic with two partions in a three-node cluster
2. create a topic with three partitions in a three-node cluster and start two consumers
   
In both cases, block one consumer in its `eachMessage` or `eachBatch` handler for > session timeout:
```javascript
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

```
See https://github.com/ckuehne/kafkajs/blob/47cca410b6dcf22e6268b70ebe59e6428e52539b/bug/consumerLongPause.js 
for the whole consumer.

Detailed reproduction hints below.

***With 2 partitions and 1 consumer***

See
https://github.com/ckuehne/kafkajs/blob/47cca410b6dcf22e6268b70ebe59e6428e52539b/bug/reproduce-with-2-partition-topic.sh

***With 3 partitions and 3 consumers***
See
https://github.com/ckuehne/kafkajs/blob/47cca410b6dcf22e6268b70ebe59e6428e52539b/bug/reproduce-with-3-partition-topic.sh

**Expected behavior**
Rebalance after `eachMessage` handler has been stuck longer than the session timeout.
The stuck consumer should be removed from its group.

**Observed behavior**

Consumer keeps sending hearbeats to the broker nodeId that is not a parition leader.
This keeps the hanging consumer in the group.

```
{ value: 'Message number 17' }
fetch from nodeId: 1
heartbeat
{ value: 'Message number 19' }
Sleep 3 minutes.
fetch from nodeId: 1
heartbeat
fetch from nodeId: 1
heartbeat
```

**Environment:**
- OS: Mac OS Ventura 13.4
- KafkaJS version 2.2.4
- Kafka version confluentinc/cp-kafka:5.3.1
- NodeJS version v20.3.1

**Additional context**
Add any other context about the problem here.
