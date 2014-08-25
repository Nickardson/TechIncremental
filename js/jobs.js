define(["resources", "render", "events", "interact", "buildings"], function (resources, render, events, interact, buildings) {
    var jobs = {};

    jobs.types = [];

    jobs.create = function (options) {
        options.type = "job";
        options.visible = 0;

        if (options.in && options.in.length == undefined)
            options.in = [options.in];
        if (options.out && options.out.length == undefined)
            options.out = [options.out];

        options = resources.create(options);

        options.unlock = function () {
            options.visible = 1;
            render.renderResource(resources, options);
            interact.bindJob(options);
        };

        options.unlockWhen = function (condition, trigger) {
            trigger = trigger || "resource";
            if (!interact.shown[options.name] && !condition(options)) {
                events.bind(trigger, function () {
                    if (!interact.shown[options.name] && condition(options)) {
                        options.unlock();
                        interact.shown[options.name] = 1;
                    }
                });
            } else {
                options.unlock();
            }
            return options;
        };

        jobs.types.push(options);

        return options;
    };

    events.bind("tick", function () {
        for (var i = 0; i < jobs.types.length; i++) {
            buildings.tick(jobs.types[i]);
        }
    });

    jobs.create({
        name: "jobTwigGather",
        display: "Twig Farmer",
        out: {type: "twig", amount: 0.25},
        title: "Gathers twigs.",
        limit: 100
    }).unlockWhen(resources.condition.hasSeens(["people", "wood"]));

    jobs.create({
        name: "jobWoodMaker",
        display: "Wood Crafter",
        in: {type: "twig", amount: 1.0},
        out: {type: "wood", amount: 0.2},
        title: "Combines twigs into wood.",
        limit: 25
    }).unlockWhen(resources.condition.hasAmount("jobTwigGather", 4));

    jobs.create({
        name: "jobStonePit",
        display: "Stone Miner",
        out: {type: "stone", amount: 0.05},
        title: "Works the stone pits.",
        limit: 0
    }).unlockWhen(resources.condition.hasAmount("stonePit", 1));

    jobs.create({
        name: "jobWheatFarmer",
        display: "Wheat Farmer",
        out: {type: "wheat", amount: 0.05},
        title: "Works the fields, planting and harvesting wheat.",
        limit: 0
    }).unlockWhen(resources.condition.hasAmount("wheatFarm", 1));

    jobs.create({
        name: "jobMiller",
        display: "Miller",
        in: {type: "wheat", amount: 0.10},
        out: {type: "flour", amount: 0.01},
        title: "Mills wheat to create flour.",
        limit: 0
    }).unlockWhen(resources.condition.hasAmount("buildingMill", 1));

    jobs.create({
        name: "jobBaker",
        display: "Bread Baker",
        in: [
            {type: "flour", amount: 0.01},
            {type: "water", amount: 0.05}
        ],
        out: {type: "food", amount: 1},
        title: "Bakes bread with flour and water.",
        limit: 0
    }).unlockWhen(resources.condition.hasAmount("buildingBreadBakery", 1));

    return jobs;
});