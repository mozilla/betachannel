# CLI Authentication

WIP

A developer may want to upload a packaged app via the command line.
We use Persona, which requires user interaction.
We also don't want to make the user copy / paste around secrets.

## Proposal

CLI code starts a session. GET /cli/start-session
which responds with an encrypted cookie and this body:

```
{
  "auth": "/cli/auth/badec0ffee123456789f",
  "polling": "/cli/session/badec0ffee123456789f"
}
```

The CLI should launch the users browser at that URL.

The user will be presented with a Persona signin experience.
They will need to sign in, to associate their CLI with their email address.

The CLI polls `/cli/session/badec0ffee123456789f` which will respond in one of two ways:
```
{
  "needs-user-auth": true
}
```

or

```
{
  "email": "",
  "session": "somerealllongstring",
  "hawk-key": "some-long-string",
TODO id? email?
}
```

Once a hawk-key is obtained, BetaFox CLI APIs can be used.

The CLI may store the hawk-key credentials and session cookie in a file,
in as secure a manner as is possible.

The session cookie is a secure, encrypted cookie with the Hawk secrets.
This avoids a server side session for BetaFox.

## Security

For the `polling` url, the `hawk-key` will be given back once and then deleted from memory.

All requests after `/cli/start-session` must include the original cookies set earlier, so a coookie jar should be used.

Polling on urls that don't exist will respond with a 200 and `"needs-user-auth": true`, to discourage brute force searches for hawk credentials. These brute force attacks would not work without the encrypted cookie, anyways.

## Authenticated CLI APIs

### Upload Packaged App