/**
 * Manages displaying
 */

define(["events"], function (events) {

    jQuery.fn.highlight = function () {
        $(this).each(function () {
            var el = $(this);
            $("<div/>")
                .width(el.outerWidth())
                .height(el.outerHeight())
                .css({
                    "position": "absolute",
                    "left": el.offset().left,
                    "top": el.offset().top,
                    "background-color": "#ffff99",
                    "opacity": ".7",
                    "z-index": "9999999"
                }).appendTo('body').fadeOut(1000).queue(function () { $(this).remove(); });
        });
    }

    var RED = "#ab3e3e",
        GREEN = "#4e9c49";

    var barColors = [
        ["#48CC1D", 20],
        ["#9DCC1D", 50],
        ["#9DCC1D", 80],
        ["#E0D909", 90],
        ["orange", 95],
        ["#E34444", 100]
    ];

    var render = {
        isStartup: false,

        suffixes: [
            [1000, "k"],
            [1000000, "M"],
            [1000000000, "B"],
            [1000000000000, "T"],
            [1000000000000000, " Quad."],
            [1000000000000000000, " Quint."]
        ],

        pretty: function (number) {
            // If small and has decimal component
            if (number < 100 && number % 1 != 0) {
                return number.toFixed(2);
            }

            number = Math.floor(number);

            // Larger than supplied suffixes
            if (number > render.suffixes[render.suffixes.length - 1][0] * 1000) {
                return number.toExponential(2);
            }

            // Look through suffixes
            for (var i = render.suffixes.length - 1; i >= 0; i--) {
                var s = render.suffixes[i];
                if (number >= s[0]) {
                    return (number / s[0]).toFixed(2) + s[1];
                }
            }

            return number;
        },

        /**
         * An unlimited version of toFixed
         * @param x
         * @returns {*}
         */
        toFixed: function (x) {
            var e;
            if (Math.abs(x) < 1.0) {
                e = parseInt(x.toString().split('e-')[1]);
                if (e) {
                    x *= Math.pow(10,e-1);
                    x = '0.' + (new Array(e)).join('0') + x.toString().substring(2);
                }
            } else {
                e = parseInt(x.toString().split('+')[1]);
                if (e > 20) {
                    e -= 20;
                    x /= Math.pow(10,e);
                    x += (new Array(e+1)).join('0');
                }
            }
            return x;
        },

        subRenderImage: function (resource) {
            var img = $('<td></td>').appendTo(resource._element);
            if (resource.image != undefined) {
                var src = resource.image;

                if (src === true) {
                    src = "img/" + resource.name + ".png";
                }
                $("<img>").attr("src", src).appendTo(img);
            }
        },

        subRenderJobStart: function (resource) {
            $('<td><button class="btn btn-default btn-sm jobMinus" data-amount="5">-5</button></td>').appendTo(resource._element);
            $('<td><button class="btn btn-default btn-sm jobMinus" data-amount="1">-</button></td>').appendTo(resource._element);

            if (resource.title) {
                resource._element.attr("title", resource.title);
            }
        },

        subRenderJobEnd: function (resource) {
            $('<td><button class="btn btn-default btn-sm jobPlus" data-amount="1">+</button></td>').appendTo(resource._element);
            $('<td><button class="btn btn-default btn-sm jobPlus" data-amount="5">+5</button></td>').appendTo(resource._element);
        },

        subRenderResourceAmount: function (resource, parent) {
            if (resource.type == "resource") {
                $('<td class="resource-change income-text">+0/s</td>').appendTo(resource._element);

                resource._fullness = $('<tr class="resource-row resfultr"><td colspan="4" class="resource-fullness"><div class="bar"></div></td></tr>').data("resource", resource._index).appendTo(parent);
            }
        },

        applyTooltip: function (element, title) {
            element.attr("title", title);

            element.tooltip({
                container: 'body',
                placement: 'right',
                html: true
            });
        },

        getBuildingTooltip: function (resource, resources) {
            var title = [];

            if (resource.title) {
                title.push(resource.title + '<br/>');
            }

            if (resource.cost != undefined) {
                title.push(render.resourcesToText(resources, resource.cost, false, 1, false));
            }

            if (resource.secretResults) {
                title.push(resource.resultText ? ('<span class="text-info">'+resource.resultText+'</span>') : '???');
                return title.join('');
            }

            if (resource.output != undefined) {
                title.push(render.resourcesToText(resources, resource.output, true, 1, false));
            }
            if (resource.in != undefined) {
                title.push(render.resourcesToText(resources, resource.in, false, 1, true));
            }
            if (resource.out != undefined) {
                title.push(render.resourcesToText(resources, resource.out, true, 1, true));
            }

            return title.join('');
        },

        sortResources: function (parent) {
            parent.find('tr.resource-row').sort(function(a,b) {
                var r1 = $(a).data("resource") * 1,
                    r2 = $(b).data("resource") * 1;
                var r = r1 > r2 ? 1 : -1;

                if (r1 == r2) {
                    return ($(a).hasClass("resfultr")) ? 1 : -1;
                } else {
                    return r;
                }
            }).appendTo(parent);
        },

        subRenderName: function (resource) {
            $('<td class="resource-name"></td>').html(resource.display).appendTo(resource._element);
        },

        subRenderValue: function (resource) {
            $('<td class="resource-value"></td>').appendTo(resource._element);
        },

        renderResource: function (resources, resource) {
            if (!resource.visible) {
                return;
            }
            if (!resource._hasElement) {
                resource._hasElement = true;

                // add row to respective table
                var parent = $('#' + (resource.type) + 'Table');
                resource._element = $('<tr class="resource-row"></tr>').data("resource", resource._index).appendTo(parent);

                // show container
                parent.css("display", "");
                $('#'+resource.type+'Head').css("display", "");

                // image
                render.subRenderImage(resource);

                // job minus
                if (resource.type == "job") {render.subRenderJobStart(resource);}

                render.subRenderName(resource);

                // Singleton doesn't have a value worth speaking of
                // TODO: indicate we have one
                if (resource.singleton !== true) {render.subRenderValue(resource);}

                // income and fullness
                render.subRenderResourceAmount(resource, parent);

                if (resource.type == "building" || resource.type == "job") {
                    $('<td class="cost-ps"></td>').appendTo(resource._element);
                    $('<td class="income-ps"></td>').appendTo(resource._element);
                }

                if (resource.type == "job") {
                    // job plus
                    render.subRenderJobEnd(resource);
                } else if (resource.type == "building") {
                    var t = $('<td><button class="btn btn-default btn-sm buildBuilding" data-amount="1">+</button></td>').appendTo(resource._element);
                    render.applyTooltip(t.find("button"), render.getBuildingTooltip(resource, resources));
                }

                events.send("first-render-resource", resource);

                // re-sort
                render.sortResources(parent);

                if (!render.isStartup) {
                    setTimeout(function () {
                        resource._element.highlight();
                    }, 100);
                }
            }
            var val = render.pretty(resource.value);

            if (resource.in) {
                resource._element.find(".cost-ps").html(render.resourcesToText(resources, resource.in, false, resource.value, true));
            }
            if (resource.out) {
                resource._element.find(".income-ps").html(render.resourcesToText(resources, resource.out, true, resource.value, true));
            }

            if (resource.limit < Infinity) {
                val += " / " + render.pretty(resource.limit);

                if (resource._fullness) {
                    var fullness = Math.min(100, Math.floor((resource.value / resource.limit) * 100));
                    var bar = resource._fullness.find(".bar");
                    bar.css("width", fullness + '%');

                    for (var i = 0; i < barColors.length; i++) {
                        var col = barColors[i];
                        if (fullness <= col[1]) {
                            bar.css("border-color", col[0]);
                            break;
                        }
                    }
                }
            }
            resource._element.find(".resource-value").html(val);

            if (resource.stressed) {
                resource._element.addClass("danger");
            } else {
                resource._element.removeClass("danger");
            }
        },

        updateBuildings: function (resources) {
            $(".resource-change").html("+0/s");
            for (var key in resources.adds) {
                var r = resources.get(key);
                if (r._hasElement) {
                    var d = r._element.find(".resource-change");
                    if (resources.adds[key] > 0) {
                        d.css("color", GREEN);
                        d.html("+" + render.pretty(resources.adds[key]) + "/s");
                    } else if (resources.adds[key] < 0) {
                        d.css("color", RED);
                        d.html(render.pretty(resources.adds[key]) + "/s");
                    } else {
                        d.html("");
                    }
                }
            }
        },

        /**
         * Gets text representing a resource or list of resources
         * @param resources
         * @param res
         * @param isIncome
         * @param mult
         * @param isPerSecond
         * @returns {string}
         */
        resourcesToText: function (resources, res, isIncome, mult, isPerSecond) {
            var gray = false;
            if (mult === 0) {
                gray = true;
            }
            mult = mult || 1;
            if (res.length == undefined)
                res = [res];

            var sign = isIncome ? '+' : '-';
            var ls = [];
            for (var i = 0; i < res.length; i++) {
                var o = res[i];
                if (o.visible == false) {
                    continue;
                }

                if (o.amount) {
                    var s = sign + render.pretty(events.prop(o, 'amount', mult) * mult) + ' ' + resources.display(events.prop(o, 'type', mult));
                    if (isPerSecond) {
                        s += "/s";
                    }
                    ls.push(s);
                }
                if (o.capacity) {
                    ls.push(sign + render.pretty(events.prop(o, 'capacity', mult) * mult) + ' Max ' + resources.display(events.prop(o, 'type', mult)));
                }
            }

            for (var i = 2; i < ls.length; i+=2) {
                ls[i] = '<br/>' + ls[i];
            }

            return '<span class="' + (gray ? "text-muted " : (isIncome ? 'income-text' : "cost-text")) + '">' + ls.join(", ") + '</span>';
        }
    };

    return render;
});