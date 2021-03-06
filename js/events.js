define(function () {
    var exports = {};

    exports.subs = {};
    exports.bind = function(channel, sub) {
        exports.subs[channel] = exports.subs[channel] || []; //create array for channel
        exports.subs[channel].push(sub);
    };
    exports.send = function(channel) {
        var args = [].slice.call(arguments, 1); //pop off channel argument
        exports.subs[channel].forEach(function(sub) {
            sub.apply(void 0, args); //call each method listening on the channel
        });
    };
    exports.prop = function (object, name, args) {
        if (typeof object[name] == "function") {
            return object[name].call(object, args);
        } else {
            return object[name];
        }
    };

    return exports;
});