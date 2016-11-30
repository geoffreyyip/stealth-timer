// CLEAN UP: do I need terminateCurrTime function? Each time I press play, I'm adding a new timer... I think.

// Note to self: timer circle border should be in canvas instead. This'll allow me to draw a partial circle animation 
// on top of regular canvas. Otherwise, I'd have to sync up CSS styling and canvas rules. which is ugh.

const MINUTES_PER_HOUR = 60;
const SECONDS_PER_MINUTE = 60;
const MILLISECONDS_PER_SECOND = 1000;

const ONE_SECOND = 1000;
const TENTH_OF_A_SECOND = 100;
const REFRESH_RATE = TENTH_OF_A_SECOND;

const REGULAR = 1;
const WORKOUT = 2;

let currTimer = null;
let currDisplay = null;
let mode = REGULAR;	

$(document).ready(function() {
	// debugging purposes
	let beta = new CircleAnimation();

	let canvas = document.querySelector("canvas");

	// set it to be over clock element
	let clockRect = document.querySelector(".clock").getBoundingClientRect();
	canvas.style.position = "absolute";
	canvas.style.left = clockRect.x + "px";
	canvas.style.top = clockRect.y + "px";

	let cx = canvas.getContext("2d");
	// arc(x, y, radius, startAngle, endAngle)
	cx.arc(250, 250, 250, 0, 2 * Math.PI);
	cx.lineWidth = 3;
	cx.stroke();

	// status indicator: blue color means this file compiled.
	$("body").css({"background-color": "blue"});

	// toggle mode
	$("#toWorkout").on("click", function() {
		mode = WORKOUT;

		$("#toRegular").show();
		$("#toWorkout").hide();

		$("#repetitions").show();
		$("#break-entry").show();
	});

	$("#toRegular").on("click", function() {
		mode = REGULAR;

		$("#toWorkout").show();
		$("#toRegular").hide();

		$("#repetitions").hide();
		$("#break-entry").hide();
	})

	$("#play").on("click", function() {
		const timer = currTimer || startNewTimer(mode);
		timer.play();
		currTimer = timer;

		const display = currDisplay || new TimeDisplay(timer);		
	});

	$("#pause").on("click", function() {
		if (currTimer) currTimer.pause();
	});

	$("#stop").on("click", function() {
		// terminates both currTimer and currDisplay
		if (currTimer) terminateCurrTimer();
		if (currDisplay) terminateCurrDisplay();
		document.getElementById("loop-alarm").pause();

		$("#hours").text("00");
		$("#minutes").text("00");
		$("#seconds").text("00");		
	});

	$("#hide").on("click", function() {
		$("#countdown-display").hide();

		$("#show").show();
		$("#hide").hide();
	});
	
	$("#show").on("click", function() {
		$("#countdown-display").show();

		$("#hide").show();
		$("#show").hide();
	});
});

/*
note constructor does not start timer, you must explictily call the play method

@param Object Duration - object containing hours, minutes and seconds properties
@param Function whatToDoNext - instructions to execute on hitting zero
*/
class CountdownTimer {
	constructor(duration, whatToDoNext) {
		this.duration = toMilliseconds(duration.hours, 
			duration.minutes, 
			duration.seconds);
		this.timeLeft = this.duration;

		// onTimeUp defaults to playNotification if no whatToDoNext passed
		this.onTimeUp = whatToDoNext || playNotification;
		this.prevTime = Date.now();
	}

	play() {
		clearInterval(this.tracker);
		this.prevTime = Date.now();	
		this.tracker = setInterval(() => this.countdown(), REFRESH_RATE);
	}

	pause() {
		clearInterval(this.tracker);
	}

	stop() {
		clearInterval(this.tracker);
		this.timeLeft = this.duration;
	}

	// call Date.now() to get millseconds elapsed since startpoint
	countdown() {
		// calculate time elapsed
		const elapsed = Date.now() - this.prevTime;
		this.prevTime = Date.now();
		this.timeLeft -= elapsed;

		// terminate when time runs out
		if (this.timeLeft <= 0) {
			this.stop();
			this.onTimeUp();
		}
	}


	getTimeLeft() {
		return this.timeLeft;
	}

	getDuration() {
		return this.duration;
	}
}

class AlternatingIntervals {
	constructor(workout, rest, repetitions, doThisOnSwitch) {
		this.workoutTimer = new CountdownTimer(workout, () => this.switch());
		this.restTimer = new CountdownTimer(rest, () => this.switch());
		this.repetitions = repetitions;

		this.currTimer = this.workoutTimer;
	}

	play() {
		this.currTimer.play();
	}

	pause() {
		this.currTimer.pause();
	}

	stop() {
		this.currTimer.stop();
	}

	terminate() {
		terminateCurrTimer();
	}

	switch() {
		if (doThisOnSwitch) {
			doThisOnSwitch();
		}

		if (this.currTimer == this.workoutTimer) {
			this.restTimer.play();
			this.currTimer = this.restTimer;
		}
		else if (this.repetitions > 0) {
			this.workoutTimer.play();
			this.currTimer = this.workoutTimer;
			this.repetitions--;
		}
		else {
			this.terminate();
		}
	}
}

/*
modifies DOM to reflect time left in current timer
*/
class TimeDisplay {
	constructor(timer) {
		this.timer = timer;
		this.ticker = setInterval(() => this.displayTime(), TENTH_OF_A_SECOND);
	}

	displayTime() {
		console.log("displayTime running");
		// add one second buffer for display purposes
		let timeLeft = this.timer.getTimeLeft();
		timeLeft += ONE_SECOND;

		// convert to hours:minutes:seconds format
		let seconds = Math.floor(timeLeft / 
			MILLISECONDS_PER_SECOND) % SECONDS_PER_MINUTE;
		const minutes = Math.floor(timeLeft / 
			(MILLISECONDS_PER_SECOND * SECONDS_PER_MINUTE)) % MINUTES_PER_HOUR;
		const hours = Math.floor(timeLeft / 
			(MILLISECONDS_PER_SECOND * SECONDS_PER_MINUTE * MINUTES_PER_HOUR));

		// update timer elements
		$("#hours").text(padWithZeros(hours, 2));
		$("#minutes").text(padWithZeros(minutes, 2));
		$("#seconds").text(padWithZeros(seconds, 2));	
	}

	stop() {
		clearInterval(this.ticker);
	}

}

class CircleAnimation {
	constructor() {
		console.log("constructor is running");

		// for sandboxing
		let canvas = document.querySelector("canvas");

		// set it to be over clock element
		let clockRect = document.querySelector(".clock").getBoundingClientRect();
		canvas.style.position = "absolute";
		canvas.style.left = clockRect.x + "px";
		canvas.style.top = clockRect.y + "px";

		let cx = canvas.getContext("2d");
		// arc(x, y, radius, startAngle, endAngle)
		cx.arc(250, 250, 250, 0, 2 * Math.PI);
		cx.lineWidth = 3;
		cx.stroke();
	}
}

function playNotification() {
	document.getElementById("loop-alarm").play();
}

function startNewTimer(mode) {
	if (mode == REGULAR) {
		const timeEntry = {
			hours: parseInt($("#hours-work").val()) || 0,
			minutes: parseInt($("#minutes-work").val()) || 0,
			seconds: parseInt($("#seconds-work").val()) || 0
			}
		return new CountdownTimer(timeEntry, function() {
			playNotification();
			terminateCurrTimer();	
		});
	} 
	else if (mode == WORKOUT) {
		const timeEntry = {
			hours: parseInt($("#hours-work").val()) || 0,
			minutes: parseInt($("#minutes-work").val()) || 0,
			seconds: parseInt($("#seconds-work").val()) || 0
			};

		const breakEntry = {
			hours: parseInt($("#hours-break").val()) || 0,
			minutes: parseInt($("#minutes-break").val()) || 0,
			seconds: parseInt($("#seconds-break").val()) || 0
		}

		const repetitions = parseInt($("#repetitions-entry").val());
		return new AlternatingIntervals(timeEntry, breakEntry, repetitions);
	}
}

function toMilliseconds(hours, minutes, seconds) {
	const totalMinutes = (hours * MINUTES_PER_HOUR) + minutes;
	const totalSeconds = (totalMinutes * SECONDS_PER_MINUTE) + seconds;
	return totalSeconds * MILLISECONDS_PER_SECOND;
}

function padWithZeros(num, width) {
	let result = num.toString();
	while(result.length < 2) {
		result = "0" + result.toString();
	}
	return result;
}

function terminateCurrTimer() {
	currTimer.stop();
	currTimer = null;
}

function terminateCurrDisplay() {
	currDisplay.stop();
	currDisplay = null;
}