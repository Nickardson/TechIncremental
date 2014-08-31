define(["resources", "interact", "research"], function (resources, interact, research) {

    var hasChecked = false;
    var version;

    var Base64 = {

        // private property
        _keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",

        // public method for encoding
        encode : function (input) {
            var output = "";
            var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
            var i = 0;

            input = Base64._utf8_encode(input);

            while (i < input.length) {

                chr1 = input.charCodeAt(i++);
                chr2 = input.charCodeAt(i++);
                chr3 = input.charCodeAt(i++);

                enc1 = chr1 >> 2;
                enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
                enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
                enc4 = chr3 & 63;

                if (isNaN(chr2)) {
                    enc3 = enc4 = 64;
                } else if (isNaN(chr3)) {
                    enc4 = 64;
                }

                output = output +
                    this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
                    this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);

            }

            return output;
        },

        // public method for decoding
        decode : function (input) {
            var output = "";
            var chr1, chr2, chr3;
            var enc1, enc2, enc3, enc4;
            var i = 0;

            input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

            while (i < input.length) {

                enc1 = this._keyStr.indexOf(input.charAt(i++));
                enc2 = this._keyStr.indexOf(input.charAt(i++));
                enc3 = this._keyStr.indexOf(input.charAt(i++));
                enc4 = this._keyStr.indexOf(input.charAt(i++));

                chr1 = (enc1 << 2) | (enc2 >> 4);
                chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
                chr3 = ((enc3 & 3) << 6) | enc4;

                output = output + String.fromCharCode(chr1);

                if (enc3 != 64) {
                    output = output + String.fromCharCode(chr2);
                }
                if (enc4 != 64) {
                    output = output + String.fromCharCode(chr3);
                }

            }

            output = Base64._utf8_decode(output);

            return output;

        },

        // private method for UTF-8 encoding
        _utf8_encode : function (string) {
            string = string.replace(/\r\n/g,"\n");
            var utftext = "";

            for (var n = 0; n < string.length; n++) {

                var c = string.charCodeAt(n);

                if (c < 128) {
                    utftext += String.fromCharCode(c);
                }
                else if((c > 127) && (c < 2048)) {
                    utftext += String.fromCharCode((c >> 6) | 192);
                    utftext += String.fromCharCode((c & 63) | 128);
                }
                else {
                    utftext += String.fromCharCode((c >> 12) | 224);
                    utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                    utftext += String.fromCharCode((c & 63) | 128);
                }

            }

            return utftext;
        },

        // private method for UTF-8 decoding
        _utf8_decode : function (utftext) {
            var string = "";
            var i = 0;
            var c = c1 = c2 = 0;

            while ( i < utftext.length ) {

                c = utftext.charCodeAt(i);

                if (c < 128) {
                    string += String.fromCharCode(c);
                    i++;
                }
                else if((c > 191) && (c < 224)) {
                    c2 = utftext.charCodeAt(i+1);
                    string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                    i += 2;
                }
                else {
                    c2 = utftext.charCodeAt(i+1);
                    c3 = utftext.charCodeAt(i+2);
                    string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                    i += 3;
                }

            }

            return string;
        }

    }

    var exports = {
        shouldSaveOnClose: true,

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
            localStorage.research = JSON.stringify(research.save());
        },

        load: function () {
            if (localStorage.version) {
                if (localStorage.resources)
                    resources.load(JSON.parse(localStorage.resources));
                if (localStorage.ui)
                    interact.load(JSON.parse(localStorage.ui));
                if (localStorage.research)
                    research.load(JSON.parse(localStorage.research));
            }
        },

        export: function () {
            var d = {
                hax: "I won't tell anybody you cheated. :)",
                version: localStorage.version,
                resources: resources.save(),
                ui: interact.save(),
                research: research.save()
            };
            return Base64.encode(JSON.stringify(d));
        },

        import: function (data) {
            if (data != null) {
                var d;
                try {
                    d = JSON.parse(Base64.decode(data));
                } catch (e) {
                    alert("Error reading data, is it corrupted?");
                    return false;
                }
                localStorage.clear();
                exports.shouldSaveOnClose = false;
                console.log(d);
                localStorage.version = d.version;
                localStorage.resources = JSON.stringify(d.resources);
                localStorage.ui = JSON.stringify(d.ui);
                localStorage.research = JSON.stringify(d.research);
                window.location.reload();
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
                if (exports.shouldSaveOnClose) {
                    exports.save();
                }
            });
        },

        clear: function () {
            var del = confirm("Are you sure you want to clear your save file?");
            if (del) {
                localStorage.clear();
                exports.shouldSaveOnClose = false;
                window.location.reload();
            }
        }
    };

    return exports;
});