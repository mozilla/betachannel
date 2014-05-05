module.exports = function(cb) {
  return function(req, res) {
    var ctx = {};

    ctx.isAuthenticated = !! req.session.email;
    ctx.email = req.session.email;
    ctx.csrf = req.csrfToken();

    cb(req, res, ctx);
  };
};
