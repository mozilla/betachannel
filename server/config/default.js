// Environment
env = 'development';

issuer = 'localhost';

buildDir = '/tmp/betafox-builds';
varPath = '/tmp/betafox/var';

// Secrets
clientSessions = {
    cookieName: 'session',
    secret: 'change me',
    duration: 24 * 60 * 60 * 1000, // in milliseconds
};

// L10n
defaultLang = 'en';
debugLang = 'it-CH';
supportedLanguages = ['en'];
translationDirectory = '../../i18n';
disableLocaleCheck = true;


// Rarely Configured
cachifyPrefix = 'v';
expressLogFormat = 'default';
