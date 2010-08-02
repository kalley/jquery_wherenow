# WhereNow #

WhereNow is a jQuery plugin to do location and time based applications.  It
will gather all the information necessary and allow you to specify a home panel.

It grew from a need for an Event app I was working on.  We wanted to display
relevant information at specific times during an event, and it would be
different if you were actually at the event or you just had the app.

## Example Usage ##

``$.whereNow({
    lat: 29.7811774,
    lng: -95.5603266
}, [
    {
        start: new Date('2010-08-26 13:00:00'),
        panel: {
            here: '#agenda',
            there: '#home'
        }
    },
    {
        start: new Date('2010-08-26 13:30:00'),
        panel: '#home'
    },
    {
        start: new Date('2010-08-26 14:30:00'),
        panel: '#home'
    },
    {
        start: new Date('2010-08-26 15:30:00'),
        panel: '#home'
    },
    {
        start: new Date('2010-08-26 16:30:00'),
        panel: '#home'
    },
    {
        start: new Date('2010-08-26 17:15:00'),
        end: new Date('2010-08-26 18:00:00'),
        panel: '#home'
    }
]);``