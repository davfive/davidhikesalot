#!/usr/bin/env bash
# brew install -U imagemagick trash

for heic_file in "$@"; 
do

    jpeg_file="$(echo "$heic_file" | sed 's/\.heic$//i').jpg"
    (set -x;
        magick mogrify -monitor -format jpg "$heic_file";
        touch -r "$heic_file" "$jpeg_file";
    )
    if [ -f "$jpeg_file" ]; then
        (set -x; trash "$heic_file")
    fi
done