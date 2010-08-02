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

    $.whereNow = function(coords, agenda, options) {
        return whereNow.instance(coords, agenda, options);
    };

    var instance = null,
        whereNow = function(coords, agenda, options) {

            this.panel = '';

            if( ! coords || ! coords.lat || ! coords.lng) {
                $.error('You must pass latitude and longitude coordinates');
            }
            var i = 0, arr = [], l;

            if( ! agenda) {
                return;
            } else if( ! $.isArray(agenda)) {
                for(var p in agenda) {
                    arr[i++] = agenda[p];
                }
                agenda = arr;
            }
            agenda.sort(function(a, b) { // Sort by start time
                return a.start-b.start;
            });

            var opts = $.extend({}, this.defaults, options),
                started = new Date(),
                lastItem = agenda[agenda.length-1],
                type = (function(str) {
                    return str.charAt(0).toUpperCase()+str.substring(1);
                })(opts.duration.type.toLowerCase()),
                start = agenda[0].start,
                end = lastItem.end ?
                    lastItem.end :
                    new Date(new Date(lastItem.start.valueOf())['set'+type](lastItem.start['get'+type]()+opts.duration.howMany).valueOf());

            // Discover the panel to use based on time and location
            function getPanel(withinBuffer) {
                var now = new Date(),
                    panel,
                    geoPanel = function(panel) {
                        if($.isPlainObject(panel)) {
                            panel = panel[withinBuffer ? 'here' : 'there'];
                            if( ! panel) {
                                panel = panel.here;
                            }
                        }
                        return panel;
                    };
                if(start < now && now < end) {
                    for(i = 0, l = agenda.length; i < l; i++) {
                        if(agenda[i].start < now) {
                            panel = geoPanel(agenda[i].panel);
                            continue;
                        }
                        break;
                    }
                } else {
                    panel = opts[start > now ? 'before' : 'after'];
                    panel = geoPanel(panel ? panel : opts._default);
                }
                return panel;
            }

            // If the agenda is complete and there is no location-aware state for afterwards, just get the panel.
            if(started > end && ((opts.after && ! $.isPlainObject(opts.after)) || ! $.isPlainObject(opts._default))) {
                opts.onUpdate(this.panel = getPanel(false));
            } else {
                if($.support.geolocation && instance === null) {
                    var latDiff = 99, lngDiff = 99;
                    (function getTimeAndPlace() {
                        var suc = function(p) {
                                latDiff = Math.abs(coords.lat-p.coords.latitude),
                                    lngDiff = Math.abs(coords.lng-p.coords.longitude);
                                setTimeout(getTimeAndPlace, opts.delay);
                            },
                            fail = function(e) {
                                setTimeout(getTimeAndPlace, opts.delay);
                            };
                        opts.onUpdate(this.panel = getPanel(latDiff+lngDiff <= opts.coordBuffer));
                        navigator.geolocation.getCurrentPosition(suc, fail);
                    })();
                }
            }

        };

    // expose defaults to both $.whereNow and whereNow scopes.
    $.whereNow.defaults = whereNow.prototype.defaults = {
        _default: '#home',  // default panel to fallback on
        after: null,        // home panel after all agenda items
        before: null,       // home panel before all agenda items
        coordBuffer: .002,  // distance from coordinates
        delay: 3000,        // how often to update location and time
        duration: {         // default duration of entries in the agenda
            type: 'Minutes',// eg, Minutes, Hours, Days, Seconds, etc.
            howMany: 30     // Number of type to add to start time
        },
        onUpdate: function(panel) {}
    };

    // static instance. We don't want this running more than once.
    whereNow.instance = function(coords, agenda, options) {
        if(instance === null) {
            instance = new whereNow(coords, agenda, options);
        }
        return instance;
    };

})(jQuery, window);