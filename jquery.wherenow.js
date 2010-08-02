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
            agenda.sort(function(a, b) {
                return a.start-b.start;
            });

            var opts = $.extend({}, this.defaults, options),
                started = new Date(),
                start, end;
            (function() {
                var earliest, latest;
                for(i = 0, l = agenda.length; i < l; i++) {
                    var end = agenda[i].end ? agenda[i].end : new Date(new Date(agenda[i].start.valueOf())['set'+opts.duration.type](agenda[i].start['get'+opts.duration.type]()+opts.duration.howMany).valueOf());
                    if( ! earliest || earliest > agenda[i].start) {
                        earliest = agenda[i].start;
                    }
                    if( ! latest || latest < end) {
                        latest = end;
                    }
                }
                start = earliest;
                end = latest;
            })();

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
                        } else {
                            break;
                        }
                    }
                } else {
                    panel = opts[start > now ? 'before' : 'after'];
                    panel = geoPanel(panel ? panel : opts._default);
                }
                return panel;
            }

            if(started > end && ((opts.after && ! $.isPlainObject(opts.after)) || ! $.isPlainObject(opts._default))) {
                panel = getPanel(false);
            } else {
                opts.onUpdate(getPanel(false));
                if($.support.geolocation && instance === null) {
                    (function getLocation() {
                        var suc = function(p) {
                                var latDiff = Math.abs(coords.lat-p.coords.latitude),
                                    lngDiff = Math.abs(coords.lng-p.coords.longitude);
                                opts.onUpdate(getPanel(latDiff+lngDiff <= opts.coordBuffer));
                                setTimeout(getLocation, opts.delay);
                            },
                            fail = function(e) {};
                        navigator.geolocation.getCurrentPosition(suc, fail);
                    })();
                }
            }

        };

    // expose defaults to both $.whereNow and whereNow scopes.
    $.whereNow.defaults = whereNow.prototype.defaults = {
        _default: '#home',
        after: null,  // home panel after all agenda items
        before: null, // home panel before all agenda items
        coordBuffer: .002,
        delay: 3000,
        duration: {
            type: 'Minutes',
            howMany: 30
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