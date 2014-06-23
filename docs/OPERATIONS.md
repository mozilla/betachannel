# Operations

Work in progress, see [AWS](./AWS.md) for more deployment steps.
This document focuses on security aspects.

## Key generation

One of the main reasons you deploy an instance of BetaFox is to sign
packaged apps with your private keys.

These keys should be generated once and the private assets should be protected.

You can do this manually or let the server do it.
On server startup, the server will check for the presence of certificates.
If the do not exist, it will attempt to create them based on `certificateStorage`.
If there are errors while checking, it will retry or give up.

`certificateStorage` can be set to either:

    certificateStorage = { local: '/etc/betafox/certdb' }

or
    certificateStorage = {
      s3Bucket: 'betafox-certificate',
      s3ItemPrefix: 'betafox-certdb',
      localCertsDir: '/etc/betafox/certdb'
    }

Either deployent configuration requires a local directory where it is okay to read and write the cert.
At runtime when signing apps, we need a copy of the certificate on the local filesystem.
If you choose `S3` then this is just a copy of the canonical certificate stored in S3.

On server startup, if it is configured to use `S3`, then it will download and setup certificates.

### Cloud mode and S3

Review the local file system'sf optional manual steps below.
The only difference is that files on disk are copies of the S3 data.

### Local File System

#### Optional Manual Steps
Assuming you will store these sensitive assets in `/etc/betafox/certdb`, create
that directory and make sure the same user that will run the betafox NodeJS 
process can access it. Restrict access to user only.

Also, create a password file. We'll assume `/etc/betafox/password.txt`.

Run the following as the same user which will run betafox:

    $ cd $betafox
    $ chown $app_user /etc/betafox/password.txt
    $ chmod 700 /etc/betafox/password.txt
    $ ./server/bin/generate_keys /etc/betafox/certdb /etc/betafox/password.txt

The output will create several new files, for a total of four files that must be protected:
* cert8.db
* ee1.der
* key3.db
* secmod.db

as well as the original

* password.txt

Note: `password.txt` will need to be available during normal operations as it is used during the app signing process.

## Public Keys

Several assets are derived from generating keys and written to `server/www`.
This happens automatically.

* cert9.db
* key4.db
* pkcs11.txt

These files will be served up as static assets to phones during provisioning.
*They are not* part of the source code, and must be backed up along with the key material.

If any of these files are lost, the server will re-create them.

## Security Events and Revocation

If  security is compromised, you should delete the private and public assets.

In a future release, a script will be provided to automate this task.

If you are using S3, you must delete the the private items in the bucket you've configured, otherwise your app server will re-download them.

Also, developers will need to re-upload their apps and beta testers will need to re-provision their devices.

## Signing Scope

Devices need only be provisioned once for a BetaFox environment.
The same certificate is used to sign all apps, regardless of developer.

## Deployment

This server should be proxied through a webserver over SSL.
LocalWords:  cd chown ee der secmod txt www pkcs proxied webserver
