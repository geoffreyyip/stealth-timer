# stealth-timer

phase 1 done!

# note to self

Quick feature to add: Est time 1 hour. Add a local storage object so I can total up hours spent working at end of the day. Throw it in as a callback to startNewTimer(null, doThisWhenDone, null). Record finished sessions at end of timer. https://developer.mozilla.org/en-US/docs/Web/API/Storage

# purpose

A set-it-and-forget-it timer with desktop notifications, minimialistic UI, and **most importantly** a hide countdown feature. 

Why a hide countdown feature? To fulfill a personal productivity quirk of mine. I like to set concrete intervals (say 40 minutes) to do my work, but once that interval is set, I don't want to know how much time is left. I end up counting down the minutes to my break instead of actually doing my work. 

Why not just minimize the timer until it's done? Well, sometimes I want to get a snack, answer a phone call, or pick up a package from the mailman and I want to pause the timer for a bit. I'd rather not know how much time is left when I do this. If I see I have 10 minutes left in my interval, I get really lazy for the last 10 minutes.

# To Do in Phase 2

* have stealth-timer automatically log progress through the day and email report to given address at end of day
* clean up circular canvas animation so that it fully completes the circle instead of getting 99.99% of the way there
* smooth out the edges of the canvas animation; it looks somewhat jagged
* implement responsive design for mobile devices
* add an Alternating Intervals feature for High Intensity Workouts; user can supply a workout duration, a break duration, and the number of repetitions they want to do
