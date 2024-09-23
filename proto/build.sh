#!/bin/bash

PROTOC_GEN_TS_PROTO="./node_modules/.bin/protoc-gen-ts_proto"
TS_PROTO_OPTS="esModuleInterop=true,forceLong=long"

WIDEVINE_PROTO="./proto/widevine.proto"
PLAYPLAY_PROTO="./proto/playplay.proto"

WIDEVINE_OUT="./src/widevine"
PLAYPLAY_OUT="./src/playplay"

echo "Generating TypeScript definitions for Widevine..."
protoc --plugin=protoc-gen-ts_proto=$PROTOC_GEN_TS_PROTO \
    --ts_proto_opt=$TS_PROTO_OPTS \
    --ts_proto_out=$WIDEVINE_OUT \
    --proto_path=$(dirname "$WIDEVINE_PROTO") \
    $WIDEVINE_PROTO

echo "Generating TypeScript definitions for PlayPlay..."
protoc --plugin=protoc-gen-ts_proto=$PROTOC_GEN_TS_PROTO \
    --ts_proto_opt=$TS_PROTO_OPTS \
    --ts_proto_out=$PLAYPLAY_OUT \
    --proto_path=$(dirname "$PLAYPLAY_PROTO") \
    $PLAYPLAY_PROTO

echo "Protobuf generation completed."
