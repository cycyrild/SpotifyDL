#!/bin/bash

script_dir=$(dirname "$(realpath "$0")")
input_dir="$script_dir"

current_dir=$(pwd)

output_dir="$current_dir/src/playplay/playplaymodule"

filename="playplaymodule.js"

export_name="PlayPlayModule"

if [ -d "$output_dir" ]; then
  rm -rf "$output_dir"/*
else
  mkdir -p "$output_dir"
fi

cpp_files=$(find "$input_dir" -name '*.cpp')

emcc -I"$input_dir" \
     $cpp_files \
     -std=c++20 \
     -o "$output_dir/$filename" \
     -O3 \
     -s EXPORTED_FUNCTIONS='["_process_keys"]' \
     -s NO_EXIT_RUNTIME=1 \
     -s EXPORT_ES6=1 \
     -s MODULARIZE=1 \
     -s "ENVIRONMENT=web" \
     -s EXPORT_NAME="$export_name" \
     -s LLD_REPORT_UNDEFINED=1

output_file="$output_dir/$filename"
eslint_header="/* eslint-disable */"

if [ -f "$output_file" ]; then
  sed -i "1s|^|$eslint_header\n|" "$output_file"
else
  echo "Erreur : Fichier de sortie non trouvé : $output_file"
fi
