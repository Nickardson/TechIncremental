define(["resources", "events", "render"], function (resources, events, render) {

    var toolTips = false;
    var ttopt = {
        placement: 'top',
        html: true
    };

    var disablableButtons = [];

    var categories = {};

    var interact = {
        shown: {},

        /**
         * Creates a new button.
         * @param text The text on the button.
         * @returns {*|jQuery|HTMLElement}
         */
        newButton: function (options) {
            var btn = $('<button class="btn btn-default gameBtn">' + options.text + '</button>');
            if (options.title) {
                btn.attr("title", options.title);
            }
            if (options.button) {
                for (var key in options.button) {
                    btn.attr(key, options.button[key]);
                }
            }
            return btn;
        },

        /**
         * When clicked, removes some of one resource in exchange for another.
         * @param options
         * text,
         * in {type, amount},
         * out {type, amount}
         * id,
         * [shown]
         * @returns The created button
         */
        tradeButton: function (options) {
            var t = toolTips ? '' : options.text;

            disablableButtons.push(options);

            /* Add text showing what's required
            if (options.in) {
                if (!options.in.length) {
                    options.in = [options.in];
                }
                t += render.resourcesToText(resources, options.in, false);
            }
            if (options.out) {
                if (!options.out.length) {
                    options.out = [options.out];
                }
                t += render.resourcesToText(resources,options.out, true);
            }*/

            var btn = interact.newButton(options);

            if (toolTips) {
                btn.attr("title", t);
            } else {
                btn.html(t);
            }

            if (options.condition == undefined) {
                if (options.in) {
                    options.condition = resources.condition.hasSeens(options.in);
                } else {
                    options.condition = resources.condition.none;
                }
            }

            options.canUse = options.canUse || function () {
                if (options.out) {
                    if (options.out.length == undefined)
                        options.out = [options.out];
                    for (var i = 0; i < options.out.length; i++) {
                        var x = options.out[i];
                        // account for added capacity after this purchase
                        var addCap = x.capacity || 0;
                        if (resources.value(x.type) + options.out[i].amount > resources.limit(x.type) + addCap) {
                            return false;
                        }
                    }
                }

                if (options.in) {
                    if (options.in.length == undefined)
                        options.in = [options.in];
                    for (var i = 0; i < options.in.length; i++) {
                        if (resources.value(options.in[i].type) < options.in[i].amount) {
                            return false;
                        }
                    }
                }

                return true;
            };

            var onShown = function () {
                this.tooltip(ttopt);

                this.appendTo("#actions").click(function () {
                    if (!options.canUse()) {
                        return;
                    }
                    if (options.in) {
                        resources.transact(options.in, -1);
                    }
                    if (options.out) {
                        resources.transact(options.out, 1);
                    }
                }).mouseenter(function () {
                    $(this).addClass("hovered");
                }).mouseleave(function () {

                });

                options._element = this;
            };

            if (options.shown) {
                onShown.call(btn);
                interact.shown[options.id] = 1;
            } else {
                interact.appendWhen(
                    options.id,
                    btn,
                    options.condition,
                    "resource",
                    onShown);
            }

            return options;
        },

        bindJob: function (job) {
            job._element.find(".jobMinus").click(function () {
                var amount = $(this).data("amount");
                if (resources.buy(job.name, amount)) {
                    resources.add("people", amount);
                }
            });

            job._element.find(".jobPlus").click(function () {
                var amount = $(this).data("amount");
                if (resources.canAdd(job.name, amount) && resources.buy("people", amount)) {
                    resources.add(job.name, amount);
                }
            });
        },

        /**
         * Will show an element when the condition returns true.  The condition is checked immediately upon calling, and when an event named 'trigger' is fired.
         * @param id A unique ID which is used in persistence.
         * @param element The element to hide
         * @param effect Function called when element should be created.
         * @param condition A function which determines if the element is shown
         * @param trigger The trigger which will cause the condition to be evaluated.
         * @returns The element passed in.
         */
        appendWhen: function (id, element, condition, trigger, effect) {
            if (!interact.shown[id] && !condition(element)) {
                events.bind(trigger, function () {
                    if (!interact.shown[id] && condition(element)) {
                        effect.call(element);
                        interact.shown[id] = 1;
                    }
                });
            } else {
                effect.call(element);
            }
            return element;
        },

        save: function () {
            return interact.shown;
        },

        load: function (json) {
            interact.shown = json;
        }
    };

    events.bind("load", function () {
        var ls = resources.all();
        for (var i = 0; i < ls; i++) {
            var r = ls[i];
            if (r.id && interact.shown[r.id]) {

            }
        }
    });

    events.bind("tickend", function () {
        for (var i = 0; i < disablableButtons.length; i++) {
            var b = disablableButtons[i];
            if (b._element != undefined) {
                if (!b.canUse()) {
                    b._element.addClass("disabled");
                } else {
                    b._element.removeClass("disabled");
                }
            }
        }
    });

    return interact;
});