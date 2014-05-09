// Environment
env = 'development';

publicUrl = 'http://10.0.1.13:8000';

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



// MySQL
mysql = {
  host: 'localhost',
  user: 'root',
  password: 'pass',
  database: 'betafox'
}

// L10n
defaultLang = 'en';
debugLang = 'it-CH';
supportedLanguages = ['en'];
translationDirectory = '../../i18n';
disableLocaleCheck = true;


// Rarely Configured
cachifyPrefix = 'v';
expressLogFormat = 'default';
