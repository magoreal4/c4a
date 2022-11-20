#!/bin/bash
# -*- ENCODING: UTF-8 -*-
npm init --y
npm i -D vite

jq '.scripts.vite="vite build --watch"' <package.json >temp.json
rm -r package.json
mv temp.json package.json

app=$(pwd | awk -F/ '{print $NF}')
echo $app

cat > vite.config.js <<EOF
const path = require('path');
const { defineConfig } = require('vite')

module.exports = defineConfig({
    build: {
        outDir: path.resolve(__dirname, '../static/js'),
        minify: true,
        rollupOptions: {
            output: {
                entryFileNames: '${app}.js',
                format: 'iife'
              },
            input: './index-${app}.js',
        }
    }
});
EOF


cat > index-${app}.js <<EOF
document.addEventListener("DOMContentLoaded", function(){


});
EOF
npm install