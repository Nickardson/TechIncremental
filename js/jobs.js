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

    var mod = resources.modifiers;

    events.bind("tick", function () {
        for (var i = 0; i < jobs.types.length; i++) {
            buildings.tick(jobs.types[i]);
        }
    });

    jobs.create({
        name: "jobTwigGather",
        display: "Twig Farmer",
        out: {type: "twig", amount: mod.mult(0.25, 'jobTwigGather')},
        title: "Gathers twigs.",
        limit: 100
    }).unlockWhen(resources.condition.hasSeens(["people", "wood"]));

    jobs.create({
        name: "jobWoodMaker",
        display: "Wood Crafter",
        in: {type: "twig", amount: 1.0},
        out: {type: "wood", amount: 0.2},
        title: "Combines twigs into wood.",
        limit: 50
    }).unlockWhen(resources.condition.hasAmount("jobTwigGather", 1));

    jobs.create({
        name: "jobStonePit",
        display: "Stone Miner",
        out: {type: "stone", amount: mod.mult(0.05, 'jobStonePit')},
        title: "Works the stone pits.",
        limit: 0
    }).unlockWhen(resources.condition.hasAmount("stonePit", 1));

    jobs.create({
        name: "jobWheatFarmer",
        display: "Wheat Farmer",
        out: {type: "wheat", amount: mod.mult(0.02, 'jobWheatFarmer')},
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

    jobs.create({
        name: "jobResearcher",
        display: "Researcher",
        in: {type: "food", amount: 2},
        out: [
            {type: "science", amount: mod.mult(0.005, 'jobResearcher')}
        ],
        title: "Researches the nature of the world.",
        limit: 0
    }).unlockWhen(resources.condition.hasAmount("buildingLibrary", 1));

    jobs.create({
        name: "jobForester",
        display: "Forester",
        in: {type: "food", amount: 2},
        out: {type: "wood", amount: 5},
        title: "Cuts down trees for lots of wood.",
        limit: 0
    }).unlockWhen(resources.condition.hasAmount("buildingForester", 1));

    jobs.create({
        name: "jobMiner",
        display: "Miner",
        in: {type: "food", amount: 2},
        out: [
            {type: "stone", amount: 5},
            {type: "ironOre", amount: 0.001}
        ],
        title: "Works in the mines, mining stone.",
        limit: 0
    }).unlockWhen(resources.condition.hasAmount("buildingMiner", 1));

    jobs.create({
        name: "jobIronMiner",
        display: "Iron Miner",
        in: {type: "food", amount: 2},
        out: [
            {type: "ironOre", amount: 0.01}
        ],
        title: "Works in the mines, mining iron.",
        limit: 0
    }).unlockWhen(resources.condition.hasAmount("buildingMiner", 1));

    jobs.create({
        name: "jobCoalMiner",
        display: "Coal Miner",
        in: {type: "food", amount: 2},
        out: [
            {type: "coal", amount: 0.05}
        ],
        title: "Works in the mines, mining coal.",
        limit: 0
    }).unlockWhen(resources.condition.hasAmount("buildingMiner", 1));

    jobs.create({
        name: "jobIronSmelter",
        display: "Iron Smelter",
        in: [
            {type: "food", amount: 2},
            {type: "ironOre", amount: 0.1},
            {type: "coal", amount: 0.5}
        ],
        out: [
            {type: "iron", amount: 0.1}
        ],
        title: "Smelts iron ore into iron bars.",
        limit: 0
    }).unlockWhen(resources.condition.hasAmount("buildingSmeltery", 1));

    return jobs;
});