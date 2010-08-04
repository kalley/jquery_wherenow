# WhereNow #

WhereNow is a jQuery plugin to do location and time based applications.  It
will gather all the information necessary and allow you to specify a home panel.

It grew from a need for an Event app I was working on.  We wanted to display
relevant information at specific times during an event, and it would be
different if you were actually at the event or you just had the app.

The new API differs a lot from my original plan, though it definitely
encourages and enables a greater flexibility in use.

## Example Usage ##

    // You can have as many as you want
    var locations = [
        {
            // required properties
            lat: 29.7811774,
            lng: -95.5603266,
            times: [
                {
                    // required
                    start: new Date('2010-08-26 13:00:00'),
                    // optional, and used by the plugin
                    end: new Date('2010-08-26 14:00:00'),
                    success: function(whereNow, coordinates) {}, // This overwrites the location success method
                    // now, whatever else you want
                    name: 'Session 1'
                },
                {
                    start: new Date('2010-08-26 14:15:00'),
                    end: new Date('2010-08-26 15:15:00'),
                    name: 'Session 2'
                }
            ],
            // optional
            // This will be used if there is not a success method in the times object
            success: function(whereNow, coordinates) {}
        }, {...}
    ];

    var wN = $.whereNow(locations, {
        // in miles
        radius: .25,
        // how long between checks in milliseconds
        delay: 3000,
        // If you want to use Gears or some other geolocation api (it just needs to have a getLocation method
        api: null,
        // When you want to stop the repetitive checking of location and time.
        // Can be null, which means that it will never stop checking.
        stopAt: new Date('2010-08-26 23:00:00'),
        // gets called after everything is complete
        complete: function(whereNow, location, timeIndex) {},
        // only gets called if not defined within a specific location
        success: function(whereNow, coordinates) {},
        // gets called on error, with the error from the API
        error: function(error, whereNow) {}
    });