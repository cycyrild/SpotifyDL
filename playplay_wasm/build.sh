#!/bin/bash

# Determine the directory where the script is located
script_dir=$(dirname "$(realpath "$0")")

# Current directory where the script is executed from
current_dir=$(pwd)

# Output directory where the build result will be placed
output_dir="$current_dir/src/playplay/playplaymodule"
filename="playplaymodule.js"

# Check if output_dir exists and clean it
if [ -d "$output_dir" ]; then
  rm -rf "$output_dir"/*
else
  mkdir -p "$output_dir"
fi

# Gather all the .cpp files in the script directory
cpp_files=$(ls "$script_dir"/*.cpp)

# Compile with emcc
emcc -v $cpp_files -o "$output_dir/$filename" -O3 \
    -s EXPORTED_FUNCTIONS='["_process_keys"]' \
    -s NO_EXIT_RUNTIME=1 \
    -s EXPORT_ES6=1 \
    -s MODULARIZE=1 \
    -s "ENVIRONMENT=web" \
    -s EXPORT_NAME='"PlayPlayModule"'
