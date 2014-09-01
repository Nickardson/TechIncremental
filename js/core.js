// TODO: Hide titles like "resources" and "buildings" until one of those actually exists

var GAMELOOP;

define(function (require) {
    var resources = require("resources"),
        buildings = require("buildings"),
        render = require("render"),
        interact = require('interact'),
        save = require("save"),
        events = require("events");

    render.isStartup = true;

    for (var i = 0; i < buildings.types.length; i++) {
        var t = buildings.types[i];
        t.building = true;
        resources.create(t);
    }

    interact.tradeButton({
        text: "Gather Twigs",
        category: "Manual Labor",
        out: {type: 'twig', amount: 1},
        title: "These twigs are everywhere.",
        visible: true
    });

    interact.tradeButton({
        text: "Create wood",
        category: "Manual Labor",
        id: 'cwood',
        in: {type: 'twig', amount: 5},
        out: {type: 'wood', amount: 1},
        title: "Mash 5 twigs together to make a wood."
    });

    var jobs = require("jobs"),
        research = require("research");

    // TODO: save state of hide researched button
    $("#hideResearched").change(function () {
        if (this.checked) {
            $(".tech-completed").hide();
        } else {
            $(".tech-completed").show();
        }
    });

    save.setVersion("0.0");
    save.load();
    events.send("load");
    save.saveLoop(120);
    save.saveOnClose();

    var gaTicks = 0;
    GAMELOOP = setInterval(function () {
        resources.adds = {};
        resources.isBuildingTick = true;
        events.send("tick");
        events.send("tickend");
        resources.isBuildingTick = false;
        render.updateBuildings(resources);

        resources.enforceLimits();

        gaTicks++;
        if (gaTicks > 60 * 5) {
            gaTicks = 0;
            try {
                ga('send', 'event', 'timed', 'tick', 60 * 5);
            } catch (e) {}
        }
    }, 1000);

    render.isStartup = false;
});