define(["render", "resourcetypes", "events"], function (render, resourceTypes, events) {
    var list = {};

    events.bind("resource", function (resource) {
        if (!resource.hidden) {
            render.renderResource(resources, resource);
        }
    });

    var _currentIndex = 1;

    var resources = {
        adds: {},
        isBuildingTick: false,

        /**
         * Creates a resource.
         * @param res Configuration for the resource
         * required: name
         * @returns {Resource}
         */
        create: function (res) {
            // Number of this resource possessed
            res.value = res.value || 0;
            res._index = _currentIndex++;
            // Display name
            res.display = res.display || res.name;
            // Whether it is current visible in the list.
            res.visible = res.visible || res.value > 0;

            res.userdata = res.userdata || {};

            if (res.limit == undefined) {
                res.limit = Infinity;
            }

            list[res.name] = res;

            events.send("resource", res);

            return res;
        },

        /**
         * Gets a resource by name
         * @param name The name to find the resource by.
         * @returns {Resource}
         */
        get: function (name) {
            return list[name];
        },

        /**
         * Gets or sets the value of a resource.
         * @param name The name of the resource
         * @param (amount) If provided, sets the resource's value to this value.
         * @returns {Number} The value.
         */
        value: function (name, amount) {
            var res = resources.get(name);

            if (!res) {
                throw new Error("Resource '" + name + "' does not exist.");
            }

            if (amount !== undefined) {
                res.value = amount;

                if (amount > 0) {
                    res.visible = 1;
                }
                if (res.changed) {
                    res.changed.call(res);
                }
                events.send("resource", res);
            }

            return res.value;
        },

        /**
         * Forces all resources to be contained within their limit.
         */
        enforceLimits: function () {
            for (var i in list) {
                var res = list[i];
                if (res.value > res.limit) {
                    resources.value(res.name, res.limit);
                }
            }
        },

        /**
         * Gets or sets the limit for this resource.
         * @param name
         * @param (limit)
         * @returns {*}
         */
        limit: function (name, limit) {
            var res = resources.get(name);
            if (limit !== undefined) {
                res.limit = limit;
                events.send("resource", res);
                return limit;
            } else {
                if (res.limit == undefined) {
                    return Infinity;
                } else {
                    return res.limit;
                }
            }
        },

        addLimit: function (name, amount) {
            resources.limit(name, resources.limit(name) + amount);
        },

        display: function (name) {
            try {
                return resources.get(name).display;
            } catch (e) {
                console.error("Could not get display for", name, e);
            }
        },

        /**
         * Adjusts the value of the resource.
         * @param name The name of the resource
         * @param amount The amount to adjust by.
         */
        add: function (name, amount) {
            if (resources.isBuildingTick) {
                if (resources.adds[name] != undefined) {
                    resources.adds[name] += amount
                } else {
                    resources.adds[name] = amount;
                }
            }

            resources.value(name, resources.value(name) + amount);
        },

        /**
         * 'Purchases' given an amount.  Does not complete an transaction if there is not enough money.
         * @param name The name of the resource
         * @param amount How much the thing costs
         * @returns {boolean} True if the transaction was successful, false if it was not.
         */
        buy: function (name, amount) {
            if (resources.value(name) >= amount) {
                resources.add(name, -amount);
                return true;
            }
            return false;
        },

        canBuy: function (currencies, multiplier) {
            multiplier = multiplier || 1;

            if (!currencies) {
                return false;
            }

            if (currencies.length == undefined) {
                currencies = [currencies];
            }

            for (var i = 0; i < currencies.length; i++) {
                var c = currencies[i];
                if (resources.value(events.prop(c, 'type', multiplier)) < events.prop(c, 'amount', multiplier) * multiplier) {
                    return false;
                }
            }

            return true;
        },

        /**
         * Unchecked transaction of multiple currencies
         * @param currencies
         * @param direction The way money is flowing, 1 for adding resources, -1 for removing.
         */
        transact: function (currencies, direction) {
            if (typeof currencies == 'function') {
                currencies = currencies(direction);
            } else if (typeof currencies == 'object' && currencies.length == undefined) {
                currencies = [currencies];
            }
            direction = direction || 1;

            for (var i = 0; i < currencies.length; i++) {
                var c = currencies[i];

                if (c.capacity !== undefined)
                    resources.addLimit(events.prop(c, 'type', direction), events.prop(c, 'capacity', direction) * direction);

                if (c.amount !== undefined)
                    resources.add(events.prop(c, 'type', direction), events.prop(c, 'amount', direction) * direction);
            }
        },

        canAdd: function (name, amount) {
            return resources.value(name) + amount <= resources.limit(name);
        },

        /**
         * Contains function generators for various conditions relating to resources
         */
        condition: {
            hasAmount: function (name, amount) {
                return function () {
                    return resources.value(name) >= amount;
                }
            },

            /**
             * Returns a function to check whether we have enough of all items in a list of currencies, formatted [{type: "", amount: x}]
             * @param currencies
             * @returns {Function}
             */
            hasAmounts: function (currencies) {
                return function () {
                    for (var i = 0; i < currencies.length; i++) {
                        if (resources.value(currencies[i].type) < currencies[i].amount) {
                            return false;
                        }
                    }
                    return true;
                }
            },

            hasSeen: function (name) {
                return function () {
                    return resources.get(name).visible;
                }
            },

            hasSeens: function (currencies) {
                return function () {
                    for (var i = 0; i < currencies.length; i++) {
                        var x = currencies[i];
                        if (typeof x == "object") {
                            x = x.type;
                        }
                        if (!resources.get(x).visible) {
                            return false;
                        }
                    }
                    return true;
                }
            },

            /**
             * Static
             * @returns {boolean}
             */
            none: function(){return true;}
        },

        modifiers: {
            /**
             * A modifier which multiplies a given value by the given resource's 'multiplier' userdata.
             * @param original The base amount
             * @param name The name of the resource whose multiplier affects this mod.
             * @returns {Function}
             */
            mult: function (original, name) {
                return function () {
                    var u = resources.get(name).userdata;
                    u.multiplier = u.multiplier || 1;
                    return original * u.multiplier;
                }
            }
        },

        all: function () {
            return list;
        },

        /**
         * Returns JSON for use in saving
         * @returns {{}}
         */
        save: function () {
            var result = {};

            for (key in list) {
                var res = list[key];
                result[key] = {
                    v: res.value,
                    vi: res.visible ? 1 : 0
                };

                if (res.limit !== Infinity) {
                    result[key]["l"] = res.limit;
                }

                if (Object.keys(res.userdata).length > 0) {
                    result[key]["u"] = res.userdata;
                }
            }

            return result;
        },

        /**
         * Loads resource values from JSON.
         * @param json
         */
        load: function (json) {
            for (key in json) {
                var res = list[key],
                    data = json[key];
                try {
                    res.value = data.v;
                    res.visible = data.vi;
                    if (data["l"] !== undefined)
                        res.limit = data["l"];
                    if (data["u"] !== undefined)
                        res.userdata = data["u"];
                    events.send("resource", res);
                } catch (e) {
                    console.error("Failed to load resource", key, e);
                }
            }
        }
    };

    // Load in resource types
    for (var i = 0; i < resourceTypes.types.length; i++) {
        resourceTypes.types[i].type = "resource";
        resources.create(resourceTypes.types[i]);
    }

    return resources;
});