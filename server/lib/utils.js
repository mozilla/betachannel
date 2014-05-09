exports.stripBOM = function(text) {
  var start = 0;
  var bomChars = ['\uFFFE', '\uFEFF'];
  if (typeof text === 'object') {
    text = new Buffer(text, 'utf8').toString('utf8');
  }
  for (var i = 0; i < text.length; i++) {
    if (text.charAt && bomChars.indexOf(text.charAt(i)) !== -1) {
      // Skip this char
      start = i + 1;
    } else {
      break;
    }
  }
  return text.substring(start);
};
