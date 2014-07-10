// Environment
env = 'development';

publicUrl = 'http://10.0.1.18:8000';
detectPublicUrlMisMatch = false;


buildDir = '/tmp/betafox-builds';
varPath = '/tmp/betafox/var';
binPath = './bin';

// Secrets
clientSessions = {
  cookieName: 'session',
  secret: 'change me',
  duration: 24 * 60 * 60 * 1000, // in milliseconds
};

// AWS - If you use S3 and/or DynamoDB
// You must configure aws access
//awsAccessKeyId = 'SomeValue';
//awsSecretAccessKey = 'SomeSecretValue';


// You must configure EITHER AWS DynamoDB or MySQL
// This will store app metadata

/* DynamoDB
dynamodbTablePrefix = 'betafox.';
dynamoReadCapacityUnits = 1;
dynamoWriteCapacityUnits = 1;
*/

/* MySQL
mysql = {
  host: 'localhost',
  user: 'root',
  password: 'pass',
  database: 'betafox'
}
*/

// App Storage - Files like Apps and Icons
// You must configure EITHER S3 or Local Disk

/* S3
awsS3PublicBucket = 'betafox-assets';
awsS3Region = awsDynamoRegion = 'us-west-1';
*/

/* Local Disk 
fileStoragePath = '/var/betafox';
*/

// Crypto - Signing Certificates
// You must configure EITHER S3 or Local Disk
// This is where sensative aspects of your
// Signing Certificate are stored

/* S3
certificateStorage = {
  awsS3PrivateBucket: 'betafox-certificate',
  awsS3ItemPrefix: 'betafox-certdb',
  localCertsDir: '/etc/betafox/certdb'
}
*/

/* Local Disk
certificateStorage = { local: '/etc/betafox/certdb' }
*/

// L10n
defaultLang = 'en';
debugLang = 'it-CH';
supportedLanguages = ['en'];
translationDirectory = '../../i18n';
disableLocaleCheck = true;


// Rarely Configured
cachifyPrefix = 'v';
expressLogFormat = 'default';
logLevel = 'info';
logFile = './var/log/betafox.log';
