define(["resources", "interact"], function (resources, interact) {

    var hasChecked = false;
    var shouldSaveOnClose = true;
    var version;

    var exports = {
        setVersion: function (v) {
            version = v;
        },

        canSave: function () {
            try {
                return 'localStorage' in window && window['localStorage'] !== null;
            } catch (e) {
                return false;
            }
        },

        save: function () {
            if (!hasChecked) {
                hasChecked = true;
                if (!exports.canSave()) {
                    alert("Your browser does not support saving!  You can play just fine, but your progress will not be kept across reloads.\n\nTo be able to save your progress, update your browser.")
                }
            }

            localStorage.version = version;
            localStorage.resources = JSON.stringify(resources.save());
            localStorage.ui = JSON.stringify(interact.save());
        },

        load: function () {
            if (localStorage.version) {
                resources.load(JSON.parse(localStorage.resources));
                interact.load(JSON.parse(localStorage.ui));
            }
        },

        /**
         * Saves repeatedly.
         * @param time How many seconds between saves.
         */
        saveLoop: function (time) {
            setInterval(function () {
                exports.save();
            }, 1000 * time);
        },

        /**
         * Registers a save on close.
         */
        saveOnClose: function () {
            $(window).unload(function() {
                if (shouldSaveOnClose) {
                    exports.save();
                }
            });
        },

        clear: function () {
            var del = confirm("Are you sure you want to clear your save file?");
            if (del) {
                localStorage.clear();
                shouldSaveOnClose = false;
                window.location.reload();
            }
        }
    };

    return exports;
});