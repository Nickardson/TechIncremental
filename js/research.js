define(["resources", "render", "events"], function (resources, render, events) {
    var research = {};

    research.types = {};
    research.shown = {};

    research.canUnlock = function (tech) {
        if (tech.requires) {
            if (typeof tech.requires != 'object' || tech.requires.length == undefined) {
                tech.requires = [tech.requires];
            }

            for (var i = 0; i < tech.requires.length; i++) {
                var parent = research.types[tech.requires[i]];
                if (!parent || !parent.researched) {
                    return false;
                }
            }
        }

        if (tech.condition) {
            if (!tech.condition()) {
                return false;
            }
        }

        return true;
    };

    function unlock (tech) {
        tech.researched = 1;
        tech._element.addClass("tech-completed");
        tech._element.find(".research-btn").removeClass("btn-primary").addClass("disabled btn-success completed-research-btn").html("Researched");
    }

    research.tryResearch = function (tech) {
        if (tech.researched == 1) {
            return;
        }

        var doUnlock = false;

        if (tech.cost) {
            if (typeof tech.cost == 'number') {
                if (resources.value('science') >= tech.cost) {
                    doUnlock = true;
                    resources.buy('science', tech.cost);
                }
            } else {
                if (resources.canBuy(tech.cost)) {
                    doUnlock = true;
                    resources.transact(tech.cost, -1);
                }
            }
        } else {
            doUnlock = true;
        }

        if (doUnlock) {
            if (tech.effect) {
                tech.effect.call(tech);
            }
            unlock(tech);
            events.send("research", tech);
        }
    };

    research.costText = function (tech) {
        if (tech.costText) {
            return tech.costText;
        }

        if (tech.cost) {
            if (typeof tech.cost == "number") {
                return tech.cost + ' Science';
            } else {
                return render.resourcesToText(resources, tech.cost, false, 1, false);
            }
        } else {
            return '';
        }
    };

    var index = 0;

    research.create = function (tech) {
        research.types[tech.name] = tech;
        tech._index = index++;

        tech.researched = 0;
        tech.visible = 0;

        tech.show = function () {
            research.shown[tech.name] = 1;
            tech.visible = 1;

            if (!tech._element) {
                $("#researchHead,#researchTable").css('display', '');

                var e = tech._element = $('<tr class="resource-row"></tr>').appendTo("#researchTable").data("resource", tech._index);

                /*var extra = $('<tr class="resource-row resfultr"></tr>').appendTo("#researchTable").data("resource", tech._index);
                if (tech.title) {
                    $('<td class="tech-description" colspan="2">'+tech.title+'</td>').appendTo(extra);
                }
                if (tech.effectText) {
                    $('<td class="tech-effect">'+tech.effectText+'</td>').appendTo(extra);
                }*/

                $('<td><span class="research-name">'+tech.display+'</span><br/><span class="tech-description">'+tech.title+'</span></td>').appendTo(e);
                $('<td class="research-cost">'+research.costText(tech)+'</td>').appendTo(e);

                $('<td><button class="research-btn btn btn-primary">Research</button><br/><span class="tech-effect">'+tech.effectText+'</span></td>').appendTo(e).find("button").click(function () {
                    research.tryResearch(tech);
                });

                render.sortResources($("#researchTable"));
            }
        };

        if (research.shown[tech.name] != 1 && !research.canUnlock(tech)) {
            var tryShow = function () {
                if (!research.shown[tech.name] && research.canUnlock(tech)) {
                    tech.show();
                }
            };

            events.bind("research", tryShow);
            if (tech.condition)
                events.bind("resource", tryShow);
        } else {
            tech.show();
        }
    };

    research.save = function () {
        var result = {};

        for (var key in research.types) {
            var tech = research.types[key];

            if (tech.visible || tech.researched) {
                result[key] = {
                    "v": tech.visible,
                    "r": tech.researched
                }
            }
        }

        return result;
    };

    research.load = function (json) {
        for (var key in json) {
            var data = json[key],
                tech = research.types[key];

            tech.visible = data.v;
            tech.researched = data.r;

            if (tech.visible) {
                tech.show();
            }
            if (tech.researched) {
                unlock(tech);
                events.send("research");
            }
        }
    };

    research.has = function (name) {
        return research.types[name].researched;
    };

    research.condition = {
        has: function (name) {
            return function () {
                return research.types[name].researched;
            }
        }
    };

    research.create({
        name: "curiosity",
        display: "Curiosity",
        title: "They say curiosity killed the cat, but we should be fine.",
        effectText: "Leads to great things."
    });

    research.create({
        name: "twigprof",
        display: "Twig Profiling",
        title: "Yep, that's a twig.",
        effectText: "Increases yield from twig gathering by 100%.",
        cost: {type: "twig", amount: 100},
        requires: "curiosity",
        condition: resources.condition.hasAmount("jobTwigGather", 1),
        effect: function () {
            var job = resources.get("jobTwigGather");
            job.userdata.multiplier += 1.00;
            render.renderResource(resources, job);
        }
    });

    research.create({
        name: "stoneaffinity",
        display: "Stone Affinity",
        title: "You rock.",
        effectText: "Increases yield from stone miners by 50%.",
        cost: {type: "stone", amount: 100},
        requires: "curiosity",
        condition: resources.condition.hasAmount("jobStonePit", 1),
        effect: function () {
            var job = resources.get("jobStonePit");
            job.userdata.multiplier += 0.50;
            render.renderResource(resources, job);
        }
    });

    research.create({
        name: "writing",
        display: "Writing",
        title: "We probably should have learned how to write before building a library.",
        effectText: "Increases Researcher yield by 400%.",
        effect: function () {
            var job = resources.get("jobResearcher");
            job.userdata.multiplier += 4.00;
            render.renderResource(resources, job);
        },
        cost: 10,
        requires: "curiosity",
        condition: resources.condition.hasSeen("buildingLibrary")
    });

    research.create({
        name: "calender",
        display: "Calender",
        title: "Knowing when the seasons change increases the productivity of farmers.",
        effectText: "Increases Wheat Farmer yield by 100%.",
        effect: function () {
            var job = resources.get("jobWheatFarmer");
            job.userdata.multiplier += 1.00;
            render.renderResource(resources, job);
        },
        cost: 300,
        requires: "writing"
    });

    research.create({
        name: "advcalender",
        display: "Advanced Calender",
        title: "Knowing when the seasons change increases the productivity of farmers.",
        effectText: "Increases Wheat Farmer yeidl by 100%",
        effect: function () {
            var job = resources.get("jobWheatFarmer");
            job.userdata.multiplier += 1.00;
            render.renderResource(resources, job);
        },
        requires: "calender",
        cost: 1000
    });

    return research;
});
