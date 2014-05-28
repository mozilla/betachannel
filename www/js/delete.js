(function() {
  // Deleting an App is a bigger deal, go to confirmation page
  var delApps = document.querySelectorAll('.delete-app');
  for (var i = 0; i < delApps.length; i++) {
    delApps[i].addEventListener('click', function(e) {
      e.preventDefault();
      var appCode = this.getAttribute('data-app-code');
      window.location = '/confirm_delete/app/' + encodeURIComponent(appCode);
    });
  }

  var confDelApps = document.querySelectorAll('.confirm-delete-app');
  console.log('wiring up', confDelApps);
  for (var i = 0; i < confDelApps.length; i++) {
    confDelApps[i].addEventListener('click', function(e) {
      e.preventDefault();
      var actual = $('#app-name').val();
      var expected = $('#expected-app-name').val();
      if (actual !== expected) {
        $('#app-name-mismatch').show();
        return;
      }
      var csrf = document.querySelector("#csrf_token").getAttribute('value');
      var appCode = this.getAttribute('data-app-code');
      var appUrl = '/app/' + encodeURIComponent(appCode);
      var xhr = new XMLHttpRequest();
      xhr.open('DELETE', appUrl, true);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.addEventListener("loadend", function(e) {
        var data = JSON.parse(this.responseText);
        if (data && data.status === "okay") {
          window.location = '/dashboard';
        }
      }, false);
      xhr.send(JSON.stringify({
        "_csrf": csrf
      }));
      return false;
    });
  }

  // No biggie, delete version
  var delVers = document.querySelectorAll('.delete-version');
  for (var i = 0; i < delVers.length; i++) {
    delVers[i].addEventListener('click', function(e) {
      e.preventDefault();
      var csrf = document.querySelector("#csrf_token").getAttribute('value');
      var appCode = this.getAttribute('data-app-code');
      var verId = this.getAttribute('data-version-id');
      var verUrl = '/app/' + encodeURIComponent(appCode) + '/v/' +
        encodeURIComponent(verId);
      var xhr = new XMLHttpRequest();
      xhr.open('DELETE', verUrl, true);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.addEventListener("loadend", function(e) {

        var data = JSON.parse(this.responseText);
        if (data && data.status === "okay") {
          $('#version-' + verId).remove();
        }
      }, false);

      xhr.send(JSON.stringify({
        "_csrf": csrf
      }));
    });
  }
})();
