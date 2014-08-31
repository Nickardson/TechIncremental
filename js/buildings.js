define(["render", "events", "resources"], function (render, events, resources) {
    var buildings = {};

    buildings.types = [
        {name: "cheathouse",display: "CheatHouse 2.0",title: "M@d HAX0Rz"},

        {
            name: "hut",
            display: "Hut",
            title: "There's only one person here, but more are sure to move in.",
            category: "Citizens",
            out: {type: 'people', amount: resources.modifiers.mult(0.01, 'hut')},
            cost: [
                {type: "wood", amount: 5}
            ],
            output: {type: "people", amount: 1, capacity: 10},
            image: true
        },
        {
            name: "stonePit",
            display: "Stone Pit",
            title: "A hole in the ground stones can be extracted from.\nCan be worked for extra stones.",
            category: "Resources",
            out: {type: 'stone', amount: 0.1},
            cost: [
                {type: "wood", amount: 25}
            ],
            condition: resources.condition.hasAmount("hut", 1),
            output: {type: 'jobStonePit', capacity: 5},
            image: true
        },

        {
            name: "basicStockpile",
            display: "Wood/Stone Stockpile",
            title: "A solid structure to store your wood and stone.",
            category: "Storage",
            cost: [
                {type: "wood", amount: 50},
                {type: "stone", amount: 50}
            ],
            output: [
                {type: "wood", capacity: 200},
                {type: "stone", capacity: 200}
            ],
            image: true
        },

        {
            name: "wheatFarm",
            display: "Wheat Farm",
            title: "A farm which can be worked for wheat.",
            category: "Food",
            cost: [
                {type: "wood", amount: 200},
                {type: "stone", amount: 200}
            ],
            output: {type: 'jobWheatFarmer', capacity: 20},
            image: true
        },

        {
            name: "buildingMill",
            display: "Mill",
            title: "Allows you to assign workers to grind up wheat into flour.",
            category: "Food",
            cost: [
                {type: "wood", amount: 300},
                {type: "stone", amount: 500},
                {type: 'wheat', amount: 25}
            ],
            output: {type: 'jobMiller', capacity: 20},
            image: true
        },
        {
            name: "buildingWaterMill",
            display: "Water Mill",
            title: "Accumulates water very quickly.",
            category: "Resources",
            out: {type: 'water', amount: 20},
            cost: [
                {type: "wood", amount: 500},
                {type: "stone", amount: 200}
            ],
            condition: resources.condition.hasAmount("buildingMill", 1),
            image: true
        },
        {
            name: "buildingBreadBakery",
            display: "Bread Bakery",
            title: "Allows you to assign workers to turn bake flour and water into bread.",
            category: "Food",
            cost: [
                {type: "wood", amount: 500},
                {type: "stone", amount: 200}
            ],
            output: {type: 'jobBaker', capacity: 20},
            condition: resources.condition.hasAmount("buildingMill", 1),
            image: true
        },

        {
            name: "buildingLibrary",
            display: "Library",
            title: "A center for learning.  Allows you to assign researchers and get some sweet science.",
            category: "Science",
            cost: [
                {type: "wood", amount: 1000},
                {type: "stone", amount: 800}
            ],
            output: {
                type: 'jobResearcher',
                capacity: 5
            },
            condition: resources.condition.hasAmount("buildingBreadBakery", 1)
        },

        {
            name: "buildingForester",
            display: "Forester's Quarters",
            title: "Allows you to assign foresters.",
            category: "Resources",
            cost: [
                {type: "wood", amount: 2000},
                {type: "stone", amount: 400},
                {type: "food", amount: 100}
            ],
            output: {type: 'jobForester', capacity: 10}
        },
        {
            name: "buildingMiner",
            display: "Miner's Quarters",
            title: "Allows you to assign miners.",
            category: "Resources",
            cost: [
                {type: "wood", amount: 5000},
                {type: "stone", amount: 600},
                {type: "food", amount: 1000}
            ],
            output: [
                {type: 'jobMiner', capacity: 40},
                {type: 'jobIronMiner', capacity: 40},
                {type: 'jobCoalMiner', capacity: 40},
            ],
            condition: resources.condition.hasAmount("buildingForester", 1)
        },

        {
            name: "buildingStorehouse",
            display: "Storehouse",
            title: "Stores a variety of materials.",
            category: "Resources",
            cost: [
                {type: "wood", amount: 2500},
                {type: "stone", amount: 2500}
            ],
            output: [
                {type: "wood", capacity: 10000},
                {type: "stone", capacity: 10000},
                {type: "wheat", capacity: 1000},
                {type: "flour", capacity: 1000},
                {type: "food", capacity: 10000},
                {type: "ironOre", capacity: 1000},
                {type: "coal", capacity: 1000},
            ],
            resultText: "+10k capacity for <em>Wood, Stone, and Food</em>,<br/>+1k capactity for other common materials.",
            secretResults: true,
            condition: resources.condition.hasAmount("buildingBreadBakery", 1)
        },

        {
            name: "buildingSmeltery",
            display: "Smeltery",
            title: "Allows you to smelt ores into metal bars.",
            category: "Resources",
            cost: [
                {type: "wood", amount: 10000},
                {type: "stone", amount: 10000},
                {type: "coal", amount: 50}
            ],
            output: {type: 'jobIronSmelter', capacity: 10}
        },
    ];

    buildings.tick = function (res) {
        if (res.stressed) {
            res.stressed = false;
            render.renderResource(resources, res);
        }

        if (res.value <= 0)
            return;

        if (res.in) {
            if (!resources.canBuy(res.in, res.value)) {
                res.stressed = true;
                render.renderResource(resources, res);
                return;
            }
        }
        if (res.out)
            resources.transact(res.out, res.value);
        if (res.in)
            resources.transact(res.in, -res.value);
    };

    events.bind("tick", function () {
        for (var i = 0; i < buildings.types.length; i++) {
            buildings.tick(buildings.types[i]);
        }
    });

    for (var i = 0; i < buildings.types.length; i++) {
        var t = buildings.types[i];
        t.type = "building";
        resources.create(t);

        var con;
        if (t.condition != undefined) {
            con = t.condition;
        } else if (t.cost != undefined) {
            con = resources.condition.hasSeens(t.cost);
        }

        if (con) {
            // weird hacky bit because of how anon functions perform in loops
            events.bind("resource", function(building, con) {
                return function () {
                    if (!building.visible && con()) {
                        building.visible = 1;
                        render.renderResource(resources, building);
                    }
                }
            }(t, con));
        }
    }

    events.bind("first-render-resource", function (resource) {
        if (resource.type == "building") {
            resource._element.find("button").click(function () {
                if (resources.canBuy(resource.cost, 1)) {
                    resources.transact(resource.cost, -1);
                    resources.add(resource.name, 1);

                    if (resource.output != undefined) {
                        resources.transact(resource.output, 1);
                    }
                }
            });
        }
    });

    function canUse(input, out) {
        if (out) {
            if (out.length == undefined)
                out = [out];

            for (var i = 0; i < out.length; i++) {
                var x = out[i];
                // account for added capacity after this purchase
                var addCap = x.capacity || 0;
                if (resources.value(x.type) + out[i].amount > resources.limit(x.type) + addCap) {
                    return false;
                }
            }
        }

        if (input) {
            if (input.length == undefined)
                input = [input];

            for (var i = 0; i < input.length; i++) {
                if (resources.value(input[i].type) < input[i].amount) {
                    return false;
                }
            }
        }

        return true;
    }

    events.bind("tickend", function () {
        for (var i = 0; i < buildings.types.length; i++) {
            var b = buildings.types[i];
            if (b.visible) {
                if (!resources.canBuy(b.cost)) {
                    b.disabled = true;
                    b._element.find(".btn").addClass("disabled");
                } else if (b.disabled) {
                    b.disabled = false;
                    b._element.find(".btn").removeClass("disabled");
                }
            }
        }
    });

    return buildings;
});