#!/bin/bash

script_dir=$(dirname "$(realpath "$0")")

current_dir=$(pwd)

output_dir="$current_dir/src/playplay/playplaymodule"

filename="playplaymodule.js"

export_name="PlayPlayModule"

if [ -d "$output_dir" ]; then
  rm -rf "$output_dir"/*
else
  mkdir -p "$output_dir"
fi

cpp_files=$(ls "$script_dir"/*.cpp)

emcc -v $cpp_files -o "$output_dir/$filename" -O3 \
    -s EXPORTED_FUNCTIONS='["_process_keys"]' \
    -s NO_EXIT_RUNTIME=1 \
    -s EXPORT_ES6=1 \
    -s MODULARIZE=1 \
    -s "ENVIRONMENT=web" \
    -s EXPORT_NAME="\"$export_name\""

eslint_header="/* eslint-disable */"

output_file="$output_dir/$filename"

sed -i "1s|^|$eslint_header\n|" "$output_file"