// Environment
env = 'development';

publicUrl = 'http://10.0.1.18:8000';
detectPublicUrlMisMatch = false;

configCertsDir = './config/secrets/';
derFilePath = './config/secrets/betafox.der';

buildDir = '/tmp/betafox-builds';
varPath = '/tmp/betafox/var';
binPath = './bin';

// Secrets
clientSessions = {
  cookieName: 'session',
  secret: 'change me',
  duration: 24 * 60 * 60 * 1000, // in milliseconds
};

// You must configure EITHER AWS or MySQL
// Leave the other one commented out

// AWS
/*
awsAccessKeyId = 'SomeValue';
awsSecretAccessKey = 'SomeSecretValue';
dynamoReadCapacityUnits = 1;
dynamoWriteCapacityUnits = 1;
awsS3PublicBucket = 'betafox-assets';
*/

// MySQL
/*
mysql = {
  host: 'localhost',
  user: 'root',
  password: 'pass',
  database: 'betafox'
}

fileStoragePath = '/var/betafox';

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
