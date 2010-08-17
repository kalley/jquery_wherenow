/**
 * WhereNow plugin.
 *
 * Used to determine if the user is within a specific time and place (if possible).
 *
 * @author Kalley Powell (kalley.powell AT gmail.com)
 *
 */
(function($, window, undefined) {

    var navigator = window.navigator;

    $.whereNow = function(coords, agenda, options, resetInstance) {
        return whereNow.instance(coords, agenda, options, resetInstance);
    };

    var instance = null, t = null,
        reset = function() {
            clearTimeout(t);
            t = null;
            instance = null;
        },
        toRad = function(deg) {
            return deg*(Math.PI/180);
        },
        toKm = function(miles) {
            return miles*1.609344;
        },
        calculateDistance = function(location, coords) {
            var dLat = toRad(location.lat-coords.latitude),
                dLng = toRad(location.lng-coords.longitude),
                a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                    Math.cos(toRad(location.lat)) * Math.cos(toRad(coords.latitude)) *
                    Math.sin(toRad(dLng)/2) * Math.sin(toRad(dLng)/2),
                c = 2 * Math.atan(Math.sqrt(a), Math.sqrt(1-a));
            return 6371 * c;
        },
        withinRadius = function(location, coords, radius) {
            var d = toKm(radius);
            return d > calculateDistance(location, coords);
        },
        whereNow = function(locations, options) {

            var self = this,
                userDeclined = false,
                opts = $.extend({}, self.defaults, options),
                START_TIME = new Date();

            self.locations = locations;
            self.locIndex = -1;
            self.oldLocIndex = -1;
            self.timeIndex = -1;
            self.oldTimeIndex = -1;
            self.changed = false;
            self.withinRadius = false;

            self.options = function(option, value) {
                if(value) {
                    opts[option] = value;
                }
                return opts[option];
            };

            (function getTimeAndPlace() {
                self.oldLocIndex = self.locIndex;
                self.oldTimeIndex = self.timeIndex;
                self.timeIndex = -1;
                self.changed = false;
                var now = new Date(),
                    suc = function(p) {
                        var location, closest, success = opts.success;
                        for(var i = 0, l = self.locations.length; i < l; i++) {
                            var d = calculateDistance(self.locations[i], p.coords);
                            if( ! closest || d < closest) {
                                closest = d;
                                self.locIndex = i;
                                location = self.locations[i];
                            }
                        }
                        self.withinRadius = withinRadius(location, p.coords, opts.radius);
                        if(self.withinRadius) {
                            if(location.success) {
                                success = location.success;
                            }
                            for(i = 0, l = location.times.length; i < l; i++) {
                                if(location.times[i].start < now && ( ! location.times[i].end || now < location.times[i].end)) {
                                    self.timeIndex = i;
                                    continue;
                                }
                                break;
                            }
                        }
                        if(self.timeIndex != -1 && location.times[self.timeIndex].success) {
                            success = location.times[self.timeIndex].success;
                        }
                        if(self.timeIndex != self.oldTimeIndex || self.locIndex != self.oldLocIndex) {
                            self.changed = true;
                        }
                        success(self, location, p.coords);
                        opts.complete(self);
                        if( ! opts.stopAt || now < opts.stopAt) {
                            t = setTimeout(getTimeAndPlace, opts.delay);
                        }
                    },
                    fail = function(e) {
                        if(e.code == 1) {
                            userDeclined = true;
                        }
                        opts.error(e, self);
                        opts.complete(self);
                        if( ! opts.stopAt || now < opts.stopAt) {
                            t = setTimeout(getTimeAndPlace, opts.delay);
                        }
                    };
                if(userDeclined || !!navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(suc, fail);
                } else {
                    fail(userDeclined ? {
                        code: 1,
                        message: 'The method failed to retrieve the location of the device because the application does not have permission to use the Location Service.'
                    } : {
                        code: 4,
                        message: 'Geolocation not available.'
                    });
                }
            })();

        };

    // expose defaults to both $.whereNow and whereNow scopes.
    $.whereNow.defaults = whereNow.prototype.defaults = {
        radius: .25,
        delay: 3000,
        api: null,
        stopAt: null,
        complete: function(whereNow) {},
        success: function(whereNow, location, currentCoordinates) {},
        error: function(error, whereNow) {}
    };

    // Allows for repetitive time by return a specific time on the current day
    // Mainly for setting times in the locations object
    $.whereNow.todayAt = whereNow.prototype.todayAt = function(hr, min, sec, ms) {
        var date = new Date(),
            parts = ['Hours', 'Minutes', 'Seconds', 'Milliseconds'];
        for(var i = 0, l = arguments.length; i < l; i++) {
            date['set'+parts[i]](arguments[i]);
        }
        return date;
    };

    // static instance. We don't want this running more than once.
    // Can reset if needed.
    whereNow.instance = function(locations, options, resetInstance) {
        if(instance === null || resetInstance) {
            reset();
            instance = new whereNow(locations, options);
        }
        return instance;
    };

})(jQuery, window);