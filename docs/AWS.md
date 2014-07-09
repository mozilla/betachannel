# Mozilla dev is 

    ssh ozten@ec2-54-198-98-151.compute-1.amazonaws.com

# AWS - Easy Deployment of BetaFox

1) Launch medium ec2 instance with Ubuntu 14.10 and not it's Public DNS


    $ ssh -i path/to/some_key.pem ubuntu@ec2-42-123-123-666.compute-1.amazonaws.com
    $ sudo aptitude install npm nodejs-legacy mysql-server mysql-client git nginx libnss3 libnss3-tools unzip zip

Configure root password for the MySQL server.

    $ sudo rm /etc/nginx/sites-enabled/default 
    $ sudo ln -s /home/ubuntu/betafox/docs/nginx.config /etc/nginx/sites-enabled/
    $ sudo service nginx restart
    $ git clone https://github.com/mozilla/betafox.git
    $ cd betafox

In the next command, obvious MySQL username and password should be changed:

    $ mysql -uroot -ppass < docs/db/schema_up_000.sql 
    $ npm rebuild
    $ npm install forever
    $ export PATH=./node_modules/.bin:$PATH
    $ cp server/config/default.js server/config/aws.js

Edit server/config/aws.js

Especially change:
* publicUrl = 'http://ec2-42-123-123-666.compute-1.amazonaws.com';
* clientSessions.secret
* mysql.user, mysql.password

And optionally:
* env = 'production';

    $ forever start ./server/bin/betafox --config-files=server/config/default.js,server/config/aws.js