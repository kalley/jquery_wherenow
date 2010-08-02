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

    var instance = null, t,
        reset = function() {
            clearTimeout(t);
            t = null;
            instance = null;
        },
        whereNow = function(coords, agenda, options) {

            var i = 0, arr = [], l;

            this.panel = '';

            if( ! coords || ! coords.lat || ! coords.lng) {
                $.error('You must pass latitude and longitude coordinates');
            }

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
                    new Date(new Date(lastItem.start.valueOf())['set'+type](lastItem.start['get'+type]()+opts.duration.howMany).valueOf()),
                currentPanel = this.panel;

            // Discover the panel to use based on time and location
            function getPanel(withinBuffer, self) {
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
                self.panel = panel;
                return panel;
            }

            // If the agenda is complete and there is no location-aware state for afterwards, just get the panel.
            if(started > end && ((opts.after && ! $.isPlainObject(opts.after)) || ! $.isPlainObject(opts._default))) {
                opts.onUpdate(getPanel(false), currentPanel);
            } else {
                if($.support.geolocation && instance === null) {
                    var latDiff = 99, lngDiff = 99, self = this;
                    (function getTimeAndPlace() {
                        var suc = function(p) {
                                latDiff = Math.abs(coords.lat-p.coords.latitude),
                                    lngDiff = Math.abs(coords.lng-p.coords.longitude);
                                t = setTimeout(getTimeAndPlace, opts.delay);
                            },
                            fail = function(e) {
                                t = setTimeout(getTimeAndPlace, opts.delay);
                            };
                        opts.onUpdate(getPanel(latDiff+lngDiff <= opts.coordBuffer, self), currentPanel);
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
        onUpdate: function(panel, old_panel) {}
    };

    // static instance. We don't want this running more than once.
    // Can reset if needed.
    whereNow.instance = function(coords, agenda, options, resetInstance) {
        if(instance === null || resetInstance) {
            reset();
            instance = new whereNow(coords, agenda, options);
        }
        return instance;
    };

})(jQuery, window);