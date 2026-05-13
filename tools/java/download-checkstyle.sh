#!/bin/bash
# Download checkstyle JAR if not present
version="10.26.1"
jarName="checkstyle-$version-all.jar"
jarPath="$(dirname "$0")/checkstyle.jar"
url="https://github.com/checkstyle/checkstyle/releases/download/checkstyle-$version/$jarName"

if [ ! -f "$jarPath" ]; then
    echo "Downloading checkstyle $version..."
    curl -L -o "$jarPath" "$url"
    echo "Downloaded: $jarPath"
else
    echo "checkstyle JAR already exists."
fi
