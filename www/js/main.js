(function() {
  $('.logo h1').fitText(0.43, {
    minFontSize: '20px', maxFontSize: '48px'
  });

  $(this).attr('disabled', null);
  $('#app_package').bind('change', function(e) {
    $('label[for="app_package"]').text('Uploading');
    $(this).parent().submit();
    $(this).attr('disabled', true);
   });
})();
