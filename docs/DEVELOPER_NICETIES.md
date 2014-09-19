# Automatically restart the server

If you want to restart the server any time you change NodeJS code,
you can do node-dev or nodemon

## node-dev

    npm install node-dev
    node-dev server/bin/betachannel

## nodemon

    npm install nodemon
    nodemon server/bin/betachannel --watch server -- --config-files=server/config/default.js,server/config/developer.js

## Code Style

    js-beutify -s 2 -r server/lib/*.js
