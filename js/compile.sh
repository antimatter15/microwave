#!/bin/sh

echo "Concatenating files"
#cat lib/libopt.js opt.js  loading.js blip.js edit.js nav.js gadgets.js ops.js ordering.js render.js rpc.js search.js wave.js lib/json.js > ../microwave.all.js
cat lib/libopt.js *.js lib/json.js > ../microwave.all.js
echo "Sending them to Closure Compiler"
python closure.py < ../microwave.all.js > ../microwave.min.js
echo "Done"
wc -c ../microwave.all.js ../microwave.min.js