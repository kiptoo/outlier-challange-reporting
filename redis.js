var config = require("./config");


var redis = (module.exports = require("redis").createClient(config.redis));

redis.healthCheck = function (cb) {
  var now = Date.now().toString();
  redis.set("!healthCheck", now, function (err) {
    if (err) return cb(err);

    redis.get("!healthCheck", function (err, then) {
      if (err) return cb(err);
      if (now !== then.toString()) return cb(new Error("Redis write failed"));

      cb();
    });
  });
};
