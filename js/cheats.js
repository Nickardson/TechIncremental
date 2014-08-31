// Bad! Bad! Developer's eyes only!
// ... and here's a usage case:
/*
require(["cheats"], function (cheats) {
    cheats.fillResources();
})
*/

define(["resources"], function (resources) {
    var cheats = {};

    cheats.fillResources = function () {
        var list = resources.all();
        for (var name in list) {
            var v = resources.get(name);
            if (v.type == "resource") {
                resources.value(name, resources.limit(name));
            }
        }
    };

    cheats.cheatHouse = function () {
        resources.value("cheathouse", 1);

        var out = [];

        var list = resources.all();
        for (var name in list) {
            var v = resources.get(name);
            if (v.type == "resource") {
                out.push({type: name, amount: 100000000000000000000});
            }
        }

        resources.get("cheathouse").out = out;
    };

    return cheats;
});