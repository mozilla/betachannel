# BetaFox

Give beta testers access to your Apps

This is the source code to the BetaFox webapp.

FirefoxOS, Firefox for Android and other future runtimes let developers write Open Web Apps.
Distributing privileged apps to remote testers is very difficult.

This webapp allows developers to upload their packaged apps and
gives them versioned install links.
Beta testers can install the app from the link.

## Dependencies

* NodeJS 10.x or greater
* Python
* MySQL
* [NSS Tools](https://developer.mozilla.org/en-US/docs/Mozilla/Projects/NSS/Tools)

See docs/AWS.md for a fast, simple Ubuntu/EC2 based install.

## Developer Installation

    $ mysql < docs/db/schema_up_000.sql

    $ npm install
    $ npm start

`npm install` isn't required for stage and production servers.
The node modules required are checked in with the source code.
`npm rebuild` is required for all environments.

The webapp is available at http://localhost:8000

## Development

Client side assets are prepared and built with [GruntJS](http://gruntjs.com/).

    grunt

Minified or built assets are commited into `git`.

## Get Involved

https://wiki.mozilla.org/Mobile/Projects/BetaFox
