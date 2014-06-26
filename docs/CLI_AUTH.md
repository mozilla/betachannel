# CLI Authentication

WIP

A developer may want to upload a packaged app via the command line.
We use Persona, which requires user interaction.
We also don't want to make the user copy / paste around secrets.

## Main Proposal - Secure Cookies

### Step 1) Start CLI Session

CLI code starts a CLI session. GET /cli/start-session
which responds with an encrypted cookie and this body:

```
{
  "auth": "/cli/auth/badec0ffee123456789f",
  "polling": "/cli/session/badec0ffee123456789f"
}
```

### Step 2) The CLI should launch the users browser at that URL.

The user will be presented with a Persona signin experience.
They will need to sign in, to associate their CLI with their email address.
After authenticating, they are shown
"Give access to recroom command line tool? <Yes> <No>"

Clicking Yes causes the server to associate the user with the CLI session.
"Thanks, you can close this window now".


### Step 2a) CLI polling

The CLI polls `/cli/session/badec0ffee123456789f` which will respond in one of two ways:
```
{
  "needs-user-auth": true
}
```

or

```
{
  "secure-cookie": "somerealllongstring",
  "csrf-token": "some string"
}
```

#### Polling Implementation Details

For the `polling` url, the `secure-cookie` will be given back once.
It is Trust On First Use (TOFU).

All requests after `/cli/start-session` must include the original cookies set earlier, so a cookie jar should be used.

Polling on urls that don't exist will respond with a 200 and `"needs-user-auth": true`, to discourage brute force searches for hawk credentials. These brute force attacks would not work without the encrypted cookie, anyways.

### Step 3) API Usage

Once a `secure-cookie` is obtained, BetaFox CLI APIs can be used.

By default, the CLI stores the cookie in a file, in as secure a manner as is possible.

The CLI also supports `--forget-session=true`. When used, the cookie is only used during
that CLI execution. Next time the browser will be launched again, and the user will be
re-authenticated. If they still have a web session, this will be a little slower and
they will have to close a window, but it isn't too bad.

The session cookie is a secure, encrypted cookie with the user's email address.
It is effectively an authentication token which contains a pointer to the user's identity
which cannot be tampered with. It works well over HTTP as well as TLS.

#### API calls

The CLI must accept new cookie values from the result of each call.

The CLI must update it's csrf-token from the `NEXT-CSRF-TOKEN` HTTP header in the result of the call.

The CLI must handle 401 responses. This indicates that the CLI session has expired.
The CLI would start a new CLI session and begin the flow again.

## Authenticated CLI APIs

### Uploading a packaged app

HTTP POST to /apps 

body encoding: `multipart/form-data`

Fields:

* _csrf: `value of CSRF-TOKEN`
* app_package: `zip file contents`

See API Calls section above for cookie and CSRF details.

Response HTTP Status Codes: 200, 401, 5xx

## Why a Cookie

The web services purist may turn their noses up at a session cookie.
I know I did!

Here are some factors that make it a solid choice.

* A secure cookie work over HTTP
* Many languages used to write command line tools do not do TLS properly (checking certs, etc)
* Similar semantics to OAuth 2 Bearer Tokens, just in a different HTTP header
* CLI can use the same code path as web content

Secure cookies are provide by:
* NodeJS - https://github.com/mozilla/node-client-sessions
* ? - ? (suggestions appreciated)

## Alternate Proposal - Hawk

An alternative is to secure CLI calls by signing them with Hawk.

The following is identical to the main proposal,
except the following steps are the difference from the secure cookie proposal.

### Step 0) The server must be available via HTTPS. Bail if HTTP and  stop flow.

### Step 2a) CLI polling

```
{
  "hawk-id": "some id",
  "hawk-secret": "some long string"
}
```

### Step 3) API Usage

Similar to the main proposal,
except that we may persist Hawk details instead of cookie/csrf details.

Server's backend stores a mapping between hawk-id and user's identity.

#### API Calls

All API calls are signed via Hawk. No `_csrf` is included. No HTTP Cookie is sent.

The server would provide Hawk endpoints in addition to the web content endpoints,
so that it's authentication layer would deal with hawk authentication,
instead of web based authentication.