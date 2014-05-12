(function() {
  var install = document.querySelector('button[data-package-manifest-url]');
  console.log('install' + install);
  if (install) {
    if (!navigator.mozApps || !navigator.mozApps.installPackage) {
      document.getElementById('needs-mozapps').classList.remove('hidden');
      return;
    }

    install.disabled = false;
    install.addEventListener('click', function f(e) {
      var url = install.getAttribute('data-package-manifest-url');
      url = location.origin + url;
      var request = navigator.mozApps.installPackage(url);
      request.onsuccess = function() {
        // if (!this.result || !this.result.manifest) {
        // 	return alert('Install failed without error');
        // }
        alert('Installed!');
      };
      request.onerror = function() {
        alert(this.error.name);
      }
    });
  }
})();
