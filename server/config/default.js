// Environment
env = 'development';

publicUrl = 'http://10.0.1.13:8000';

buildDir = '/tmp/betafox-builds';
varPath = '/tmp/betafox/var';

// Secrets
clientSessions = {
  cookieName: 'session',
  secret: 'change me',
  duration: 24 * 60 * 60 * 1000, // in milliseconds
};

derFilePath = '/tmp/betafox.der';

// MySQL
mysql = {
  host: 'localhost',
  user: 'app',
  password: 'password',
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
