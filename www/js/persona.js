/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
(function() {

  var loginBtns = document.querySelectorAll(".login");
  for (var i = 0; i < loginBtns.length; i++) {
    loginBtns[i].addEventListener("click", function(e) {
      e.preventDefault();
      navigator.id.request();
    }, false);
  }

  document.querySelector(".logout").addEventListener("click", function(e) {
    e.preventDefault();
    navigator.id.logout();

  }, false);

  navigator.id.watch({
    onlogin: function(assertion) {
      $('.persona').hide();
      var csrf = document.querySelector("#csrf_token").getAttribute('value');
      var xhr = new XMLHttpRequest();
      xhr.open("POST", "/persona/verify", true);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.addEventListener("loadend", function(e) {
        var data = JSON.parse(this.responseText);
        if (data && data.status === "okay") {
          console.log("You have been logged in as: " + data.email);
          $('.logout,.greeting').show();
          $('.greeting span').text(data.email);
          if (afterLogin) { afterLogin(); }
        }
      }, false);

      xhr.send(JSON.stringify({
        assertion: assertion,
        "_csrf": csrf
      }));
    },
    onlogout: function() {
      $('.persona').hide();
      $('.login').show();
      var csrf = document.querySelector("#csrf_token").getAttribute('value');
      var xhr = new XMLHttpRequest();
      xhr.open("POST", "/persona/logout", true);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.addEventListener("loadend", function(e) {
        console.log("You have been logged out");
      });
      xhr.send(JSON.stringify({
        "_csrf": csrf
      }));
    }
  });
})();
