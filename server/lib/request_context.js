module.exports = function(cb) {
  return function(req, res) {
    var ctx = {};

    ctx.isAuthenticated = !! req.session.email;
    ctx.email = req.session.email;
    ctx.csrf = req.csrfToken();
    console.log('Doing ctx.csrf', ctx.csrf);

    cb(req, res, ctx);
  };
};
