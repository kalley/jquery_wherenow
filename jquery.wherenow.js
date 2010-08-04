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

    $.support.geolocation = navigator.geolocation;

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
        toDeg = function(rad) {
            return rad*(180/Math.PI);
        },
        toKm = function(miles) {
            return miles*1.609344;
        },
        calculateDistance = function(location, coords) {
            return toRad(Math.acos(
                    Math.sin(toRad(location.lat))*Math.sin(toRad(coords.lat))+
                    Math.cos(toRad(location.lat))*Math.cos(toRad(coords.lat))*Math.cos(toRad(location.lat-coords.lat))
                )*60*1.1515);
        },
        withinRadius = function(location, coords, radius) {
            var d = toKm(radius);
            return d > calculateDistance(location, coords);
        },
        whereNow = function(locations, options) {

            var self = this,
                opts = $.extend({}, this.defaults, options),
                START_TIME = new Date();

            (function getTimeAndPlace() {
                var suc = function(p) {
                        var location, timeIndex;
                        opts.success(self, location, timeIndex);
                        opts.complete(self);
                        if( ! opts.stopAt || START_TIME < opts.stopAt) {
                            t = setTimeout(getTimeAndPlace, opts.delay);
                        }
                    },
                    fail = function(e) {
                        opts.error(e, self);
                        opts.complete(self);
                        if( ! opts.stopAt || START_TIME < opts.stopAt) {
                            t = setTimeout(getTimeAndPlace, opts.delay);
                        }
                    };
                if( !!navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(suc, fail);
                } else {
                    fail({code: 4, message: 'Geolocation not available'});
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
        success: function(whereNow, location, timeIndex) {},
        error: function(error, whereNow) {}
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