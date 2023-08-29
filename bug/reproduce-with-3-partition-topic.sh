#!/usr/bin/env bash

# run kafka cluster with 3 nodes
# export docker-compose.2_3.yml && scripts/dockerComposeUp.sh

# Create test-topic with replication factor 3 and partitions 3.
# with local kafka binaries
#bin/kafka-topics.sh --bootstrap-server localhost:9092 --delete --topic test-topic
#bin/kafka-topics.sh --bootstrap-server localhost:9092 --create --topic test-topic --replication-factor 3 --partitions 3

node producer.js

STUCK_AFTER_10=true bash -c 'node consumerLongPause.js' &

# as soon as consumer instance above has received its assignemt
sleep 5
STUCK_AFTER_10=false bash -c 'node consumerLongPause.js' &

echo "Don't forget to kill the background processes afterwards"