#!/bin/sh

echo "Concatenating files"
cat lib/libopt.js lib/json.js > ../microwave.all.js
echo "Sending them to Closure Compiler"
python closure.py < ../microwave.all.js > ../microwave.min.js
echo "Cleaning up"
rm ../microwave.all.js
echo "Done"