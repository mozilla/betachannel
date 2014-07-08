(function() {

  var installedApps = {};

  var install = document.querySelector('button[data-package-manifest-url]');

  if (install) {
    if (!navigator.mozApps || !navigator.mozApps.installPackage || !navigator.mozApps.getInstalled) {
      document.getElementById('needs-mozapps').classList.remove('hidden');
    } else {
      install.classList.remove('hidden');
      var request = window.navigator.mozApps.getInstalled();
      request.onerror = function(e) {
        alert("Error calling getInstalled: " + request.error.name);
      };
      request.onsuccess = function(e) {

        for (var i = 0; i < request.result.length; i++) {
          var manifestURL = request.result[i].manifestURL;
          installedApps[manifestURL] = request.result[i];
          $('[data-package-manifest-url="' + manifestURL + '"]')
            .removeClass('install')
            .addClass('launch')
            .text('Launch');
        }
      };

      install.disabled = false;

      install.addEventListener('click', function f(e) {
        var url = install.getAttribute('data-package-manifest-url');
        if ($(install).hasClass('install')) {
          var request = navigator.mozApps.installPackage(url);
          request.onsuccess = function() {
            // if (!this.result || !this.result.manifest) {
            // 	return alert('Install failed without error');
            // }
            // TODO replace "install" button with 'installed' widget
          };
          request.onerror = function() {
            alert(this.error.name);
          }
        } else if ($(install).hasClass('launch')) {
          installedApps[url].launch();
        }
      });
    }
  }

  var qel = document.querySelectorAll('.qrcode');
  for (var i = 0; i < qel.length; i++) {
    var installUrl = qel[i].getAttribute('data-qrcode-url');
    new QRCode(qel[i], installUrl);

    //var qr = qrcode(7, 'M');
    //qr.addData(installUrl);qr.make();
    //qel[i].innerHTML = qr.createImgTag();
  }
})();
