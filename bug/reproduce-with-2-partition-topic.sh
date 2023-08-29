#!/usr/bin/env bash

# run kafka cluster with 3 nodes
# export docker-compose.2_3.yml && scripts/dockerComposeUp.sh

# Create test-topic with replication factor 2 and partitions 2.
# with local kafka binaries
# bin/kafka-topics.sh --bootstrap-server localhost:9092 --delete --topic test-topic
# kafka-topics.sh --bootstrap-server localhost:9092 --create --topic test-topic --replication-factor 2 --partitions 2

node producer.js

STUCK_AFTER_10=true bash -c 'node consumerLongPause.js'