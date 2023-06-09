var timerFlashTime = 3000;
var timerFlashActive = false;

var goldMedalTime = 75;
var silverMedalTime = 90;

//var bronzeMedalTime = 160;
var $gold = $('#gold');
var $silver = $('#silver');
var $bronze = $('#bronze');


var debugPlayerX = 0;
var debugPlayerW = 0;
var debugCarX = 0;
var debugCarW = 0;

var fpsLock = 20;
var currentFrame = 0;

var rotateAmount = 0;
var scaleAmount = 1;

//	COLLISION
var alteredOtherCarRatio = 2.3;
var alteredOtherCarOffset = 0.4;

var playerInput 		= false;
var $canvasElement	  	= $('#canvas');

var currentLap = 1;
var maxLaps = 3;
var lapStarted = false;
var minLapSegment = 200;

var $lap1 = $('#hud-lap-1');
var $lap2 = $('#hud-lap-2');
var $lap3 = $('#hud-lap-3');
var $lapTime = $('#hud-lap-time');

var drivingCarVibrate = 2;
var idleCarVibrate = 0.5;

var fps            = 60;                      // how many 'update' frames per second
var step           = 1/fps;                   // how long is each frame (in seconds)
var width          = 970;                    // logical canvas width
var height         = 500;                     // logical canvas height
var centrifugal    = 0.45;                     // centrifugal force multiplier when going around curves
var offRoadDecel   = 0.99;                    // speed multiplier when off road (e.g. you lose 2% speed each update frame)
var skySpeed       = 0.001;                   // background sky layer scroll speed when going around curve (or up hill)
var hillSpeed      = 0.002;                   // background hill layer scroll speed when going around curve (or up hill)
var treeSpeed      = 0.003;                   // background tree layer scroll speed when going around curve (or up hill)
var skyOffset      = 0;                       // current sky scroll offset
var hillOffset     = 0;                       // current hill scroll offset
var treeOffset     = 0;                       // current tree scroll offset
var segments       = [];                      // array of road segments
var cars           = [];                      // array of cars on the road
var stats  		   = Game.stats('fps');       // mr.doobs FPS counter
var canvas         = Dom.get('canvas');       // our canvas...
var ctx            = canvas.getContext('2d'); // ...and its drawing context
var background     = null;                    // our background image (loaded below)
var sprites        = null;                    // our spritesheet (loaded below)
var resolution     = null;                    // scaling factor to provide resolution independence (computed)
var roadWidth      = 2000;                    // actually half the roads width, easier math if the road spans from -roadWidth to +roadWidth
var segmentLength  = 200;                     // length of a single segment
var rumbleLength   = 3;                       // number of segments per red/white rumble strip
var trackLength    = null;                    // z length of entire track (computed)
var lanes          = 3;                       // number of lanes
var fieldOfView    = 100;                     // angle (degrees) for field of view
var cameraHeight   = 1000;                    // z height of camera
var cameraDepth    = null;                    // z distance camera is from screen (computed)
var drawDistance   = 300;                     // number of segments to draw
var playerX        = 0;                       // player x offset from center of road (-1 to 1 to stay independent of roadWidth)
var playerZ        = null;                    // player relative z distance from camera (computed)
var fogDensity     = 5;                       // exponential fog density
var position       = 0;                       // current camera Z position (add playerZ to get player's absolute Z position)
var speed          = 0;                       // current speed
var maxSpeed       = (segmentLength/step);      // top speed (ensure we can't move more than 1 segment in a single frame to make collision detection easier)
var accel          =  maxSpeed/10;             // acceleration rate - tuned until it 'felt' right
var breaking       = -maxSpeed;               // deceleration rate when braking
var decel          = -maxSpeed/5;             // 'natural' deceleration rate when neither accelerating, nor braking
var offRoadDecel   = -maxSpeed/1.5;             // off road deceleration is somewhere in between
var offRoadLimit   =  maxSpeed/4;             // limit when off road deceleration no longer applies (e.g. you can always go at least this speed even when off road)
var totalCars      = 7;                     // total number of cars on the road
var currentLapTime = 0;                       // current lap time
var lastLapTime    = null;                    // last lap time

// DEBUGING
/*maxSpeed = maxSpeed*2;
accel = maxSpeed/3;*/

var offRoadMinSpeed = maxSpeed/10;

var turnSpeed	   = 0;
var motionControllerOutputValue = 0;

/*var hud = {
	speed:            { value: null, dom: Dom.get('speed_value')            },
	current_lap_time: { value: null, dom: Dom.get('current_lap_time_value') },
	last_lap_time:    { value: null, dom: Dom.get('last_lap_time_value')    },
	fast_lap_time:    { value: null, dom: Dom.get('fast_lap_time_value')    }
}*/

//=========================================================================
// UPDATE THE GAME WORLD
//=========================================================================

function update(dt) {




	//	TURN OFF PLAYER INPUT
		if(!playerInput) {
			return;
		};

		var n, car, carW, sprite, spriteW;
		var playerSegment = findSegment(position+playerZ);
		var playerW       = SPRITES.PLAYER_STRAIGHT.w * SPRITES.SCALE;

		var speedPercent  = speed/maxSpeed;



		

		//	MODULATE CAR SOUND
		if (!soundNotSupported) {
			source.playbackRate.value = (speedPercent*carModulationDifference) + carModulationMin;
		} else {
			/*if (speedPercent >= 0 && speedPercent <= 0.05) {
				changeCarSoundFX(0);
			} else if (speedPercent > 0.05 && speedPercent <= 0.20) {
				changeCarSoundFX(1);
			} else if (speedPercent > 0.20 && speedPercent <= 0.35) {
				changeCarSoundFX(2);
			} else if (speedPercent > 0.35 && speedPercent <= 0.50) {
				changeCarSoundFX(3);
			} else {
				changeCarSoundFX(4);
			};*/
		};
			


		var dx  = dt * 2 * speedPercent; // at top speed, should be able to cross from left to right (-1 to 1) in 1 second

		if(trackingLost) {
			motionControllerOutputValue
		}

		if (!keyDown) {
			turnSpeed	  	  = (dt * 2 * speedPercent) * (motionControllerOutputValue * 2);
		} else {
			turnSpeed	  	  = dx;
		}


		// SCREEN MOTION

		if (keyLeft)
			motionControllerOutputValue = 0.45;
		else if (keyRight)
			motionControllerOutputValue = 0.45;
		else
			motionControllerOutputValue = 0;

		if(currentFrame < fpsLock) {
			currentFrame++;
		} else {

			scaleAmount = round(1.25 - (speedPercent/4), 2);

			currentFrame = 0;
			if (keyLeft) {
				rotateAmount = round((motionControllerOutputValue*3), 2);
			    $canvasElement.css({bottom: -round((motionControllerOutputValue*25), 2)});
				scaleAmount += round((motionControllerOutputValue*0.2), 2);
			} else if (keyRight) {
				rotateAmount = -round((motionControllerOutputValue*3), 2);
				$canvasElement.css({bottom: -round((motionControllerOutputValue*25), 2)});
				scaleAmount += round((motionControllerOutputValue*0.2), 2);
			} else  {
				$canvasElement.css({bottom: 0});
				rotateAmount = 0;
			};

			$canvasElement.css({
				'-webkit-transform' : 'rotate(' + rotateAmount + 'deg) scale(' + scaleAmount + ')',
				'-moz-transform'    : 'rotate(' + rotateAmount + 'deg) scale(' + scaleAmount + ')',
				'-ms-transform'     : 'rotate(' + rotateAmount + 'deg) scale(' + scaleAmount + ')',
				'-o-transform'      : 'rotate(' + rotateAmount + 'deg) scale(' + scaleAmount + ')',
				'transform'         : 'rotate(' + rotateAmount + 'deg) scale(' + scaleAmount + ')'
			});



			//	GAME ZOOM
/*

			$canvasElement.css({
				'-webkit-transform' : 'scale(' + scaleAmount + ')',
				'-moz-transform'    : 'scale(' + scaleAmount + ')',
				'-ms-transform'     : 'scale(' + scaleAmount + ')',
				'-o-transform'      : 'scale(' + scaleAmount + ')',
				'transform'         : 'scale(' + scaleAmount + ')'
			});*/
		}


		//	ORIGINAL CALCULATION
		//var dx            = dt * 2 * speedPercent; // at top speed, should be able to cross from left to right (-1 to 1) in 1 second

		var startPosition = position;

		siteCore.apps.debugConsole.debugValue('speed', speed);
		siteCore.apps.debugConsole.debugValue('speed-percent', speedPercent);

		siteCore.apps.debugConsole.debugValue('dt-parameter', dt);
		siteCore.apps.debugConsole.debugValue('dx-parameter', dx);
		siteCore.apps.debugConsole.debugValue('turn-speed', turnSpeed);




/*		if (speedPercent > 0.1 && speedPercent < 0.3) {
			$canvasElement.addClass('fast-car-01');
			$canvasElement.removeClass('fast-car-02');
		} else if (speedPercent > 0.3) {
			$canvasElement.addClass('fast-car-02');
			$canvasElement.removeClass('fast-car-01');
		} else {
			$canvasElement.removeClass('fast-car-01');
			$canvasElement.removeClass('fast-car-02');
		};*/


		updateCars(dt, playerSegment, playerW);

		position = Util.increase(position, dt * speed, trackLength);

		if (keyLeft)
			playerX = playerX - turnSpeed;
		else if (keyRight)
			playerX = playerX + turnSpeed;



		playerX = playerX - (dx * speedPercent * playerSegment.curve * centrifugal);

		if (keyFaster)
			speed = Util.accelerate(speed, accel, dt);
		else if (keySlower)
			speed = Util.accelerate(speed, breaking, dt);
		else
			speed = Util.accelerate(speed, decel, dt);

		siteCore.apps.debugConsole.debugValue('dx-parameter', dx);

		siteCore.apps.debugConsole.debugValue('player-x', playerX);

		//	STOP PLAYER FROM GOING OFF ROAD
		if (playerX < -1) {
			playerX = -1;

			if (speed > offRoadMinSpeed) {
				speed = Util.accelerate(speed, offRoadDecel, dt);
			};


		} else if (playerX > 1) {
			playerX = 1;

			if (speed > offRoadMinSpeed) {
				speed = Util.accelerate(speed, offRoadDecel, dt);
			};
		}

		siteCore.apps.debugConsole.debugValue('player-x-after-adjustment', playerX);

	/*
		if ((playerX < -1) || (playerX > 1)) {

			if (speed > offRoadLimit)
				speed = Util.accelerate(speed, offRoadDecel, dt);

			for(n = 0 ; n < playerSegment.sprites.length ; n++) {
				sprite  = playerSegment.sprites[n];
				spriteW = sprite.source.w * SPRITES.SCALE;
				if (Util.overlap(playerX, playerW, sprite.offset + spriteW/2 * (sprite.offset > 0 ? 1 : -1), spriteW)) {
					speed = maxSpeed/5;
					position = Util.increase(playerSegment.p1.world.z, -playerZ, trackLength); // stop in front of sprite (at front of segment)
					break;
				}
			}
		}*/

				

				debugPlayerX = playerX;
				debugPlayerW = playerW;
				

		for(n = 0 ; n < playerSegment.cars.length ; n++) {
			car  = playerSegment.cars[n];
			carW = car.sprite.w * SPRITES.SCALE;
			
			siteCore.apps.debugConsole.debugValue('playerW', debugPlayerW);



			if (speed > car.speed) {
				if (Util.overlap(playerX, (playerW/(alteredOtherCarRatio+alteredOtherCarOffset)), car.offset, (carW/(alteredOtherCarRatio+alteredOtherCarOffset)), 0.8)) {
					//ctx.fillRect(playerX, 10, playerW, 10);
					//	CAR HIT
					gameSound.play(impact);
					speed    = car.speed * (car.speed/speed);
					position = Util.increase(car.z, -playerZ, trackLength);
					break;
				}
			}
		}



		playerX = Util.limit(playerX, -1, 1);     // dont ever let it go too far out of bounds
		speed   = Util.limit(speed, 0, maxSpeed); // or exceed maxSpeed

		skyOffset  = Util.increase(skyOffset,  skySpeed  * playerSegment.curve * (position-startPosition)/segmentLength, 1);
		hillOffset = Util.increase(hillOffset, hillSpeed * playerSegment.curve * (position-startPosition)/segmentLength, 1);
		treeOffset = Util.increase(treeOffset, treeSpeed * playerSegment.curve * (position-startPosition)/segmentLength, 1);

		if (position > playerZ) {
			if (currentLapTime && (startPosition < playerZ)) {
				lastLapTime    = currentLapTime;

				//currentLapTime = 0;
/*				if (lastLapTime <= Util.toFloat(Dom.storage.fast_lap_time)) {
					//Dom.storage.fast_lap_time = lastLapTime;
					//updateHud('fast_lap_time', formatTime(lastLapTime));
					//Dom.addClassName('fast_lap_time', 'fastest');
					//Dom.addClassName('last_lap_time', 'fastest');
				}
				else {
					//Dom.removeClassName('fast_lap_time', 'fastest');
					//Dom.removeClassName('last_lap_time', 'fastest');
				}*/
				//updateHud('last_lap_time', formatTime(lastLapTime));
				//Dom.show('last_lap_time');
			}
			else {
				currentLapTime += dt;
			}
		}

		siteCore.apps.debugConsole.debugValue('current-lap-time', currentLapTime);

		if (!timerFlashActive) {
			$lapTime.empty().append(formatTime(currentLapTime));
		};


		//updateHud('speed',            5 * Math.round(speed/500));
		//updateHud('current_lap_time', formatTime(currentLapTime));
}

//-------------------------------------------------------------------------



function updateCars(dt, playerSegment, playerW) {
	var n, car, oldSegment, newSegment;
	for(n = 0 ; n < cars.length ; n++) {
		car         = cars[n];
		oldSegment  = findSegment(car.z);

		//	CAR POSITION
		car.offset  = car.offset + updateCarOffset(car, oldSegment, playerSegment, playerW);
		car.z       = Util.increase(car.z, dt * car.speed, trackLength);
		car.percent = Util.percentRemaining(car.z, segmentLength); // useful for interpolation during rendering phase
		newSegment  = findSegment(car.z);
		if (oldSegment != newSegment) {
			index = oldSegment.cars.indexOf(car);
			oldSegment.cars.splice(index, 1);
			newSegment.cars.push(car);
		}
	}
}

function updateCarOffset(car, carSegment, playerSegment, playerW) {

	var i, j, dir, segment, otherCar, otherCarW, lookahead = 20, carW = car.sprite.w * SPRITES.SCALE;

	// optimization, dont bother steering around other cars when 'out of sight' of the player
	if ((carSegment.index - playerSegment.index) > drawDistance)
		return 0;

	for(i = 1 ; i < lookahead ; i++) {
		segment = segments[(carSegment.index+i)%segments.length];

		if ((segment === playerSegment) && (car.speed > speed) && (Util.overlap(playerX, playerW, car.offset, carW, 1.2))) {
			if (playerX > 0.5)
				dir = -1;
			else if (playerX < -0.5)
				dir = 1;
			else
				dir = (car.offset > playerX) ? 1 : -1;
			return dir * 1/i * (car.speed-speed)/maxSpeed; // the closer the cars (smaller i) and the greated the speed ratio, the larger the offset
		}

		for(j = 0 ; j < segment.cars.length ; j++) {
			otherCar  = segment.cars[j];
			otherCarW = otherCar.sprite.w * SPRITES.SCALE;
			if ((car.speed > otherCar.speed) && Util.overlap(car.offset, carW, otherCar.offset, otherCarW, 1.2)) {
				if (otherCar.offset > 0.5)
					dir = -1;
				else if (otherCar.offset < -0.5)
					dir = 1;
				else
					dir = (car.offset > otherCar.offset) ? 1 : -1;
				return dir * 1/i * (car.speed-otherCar.speed)/maxSpeed;
			}
		}
	}

	// if no cars ahead, but I have somehow ended up off road, then steer back on
	if (car.offset < -0.9)
		return 0.1;
	else if (car.offset > 0.9)
		return -0.1;
	else
		return 0;
}

//-------------------------------------------------------------------------

/*function updateHud(key, value) { // accessing DOM can be slow, so only do it if value has changed
	if (hud[key].value !== value) {
		hud[key].value = value;
		Dom.set(hud[key].dom, value);
	}
}*/

function formatTime(dt) {
	var minutes = Math.floor(dt/60);
	var seconds = Math.floor(dt - (minutes * 60));
	var tenths  = Math.floor(10 * (dt - Math.floor(dt)));
	if (minutes > 0)
		return minutes + "." + (seconds < 10 ? "0" : "") + seconds + "." + tenths;
	else
		return seconds + "." + tenths;
}

//=========================================================================
// RENDER THE GAME WORLD
//=========================================================================

function render() {

	if (!gamePaused) {



		var baseSegment   = findSegment(position);
		var basePercent   = Util.percentRemaining(position, segmentLength);
		var playerSegment = findSegment(position+playerZ);
		var playerPercent = Util.percentRemaining(position+playerZ, segmentLength);
		var playerY       = Util.interpolate(playerSegment.p1.world.y, playerSegment.p2.world.y, playerPercent);
		var maxy          = height;

		var currentSegment = (position/segmentLength);

		if (debug) {
			siteCore.apps.debugConsole.debugValue('current-segment', currentSegment);
			siteCore.apps.debugConsole.debugValue('current-position', (position));
		};

		//	LAP COUNTER
		if (lapStarted) {
			if(currentSegment < minLapSegment) {

				lapStarted = false;
				if (currentLap < maxLaps) {
					gameSound.play(success);
					timerFlash();
					currentLap++;
					if (currentLap == 2) {
						$lap1.css({opacity: 0});
						$lap2.css({opacity: 1});
					} else if (currentLap == 3) {
						$lap2.css({opacity: 0});
						$lap3.css({opacity: 1});
					};
				} else {
					Enabler.counter("Finished Race");
					timerFlash();
					
					if (currentLapTime < goldMedalTime) {
						$gold.css({display: 'block'});

					} else if (currentLapTime < silverMedalTime) {
						$silver.css({display: 'block'});

					} else {
						$bronze.css({display: 'block'});
					};

					siteCore.apps.viewAnimations.animateFinishedRace();
				};
			};
		} else if (currentSegment > minLapSegment) {
			lapStarted = true;
		};


		var x  = 0;
		var dx = - (baseSegment.curve * basePercent);

		ctx.clearRect(0, 0, width, height);

		Render.background(ctx, background, width, height, BACKGROUND.SKY,   skyOffset,  resolution * skySpeed  * playerY);
		Render.background(ctx, background, width, height, BACKGROUND.HILLS, hillOffset, resolution * hillSpeed * playerY);
		Render.background(ctx, background, width, height, BACKGROUND.TREES, treeOffset, resolution * treeSpeed * playerY);

		var n, i, segment, car, sprite, spriteScale, spriteX, spriteY;

		for(n = 0 ; n < drawDistance ; n++) {

			segment        = segments[(baseSegment.index + n) % segments.length];
			segment.looped = segment.index < baseSegment.index;
			segment.fog    = Util.exponentialFog(n/drawDistance, fogDensity);
			segment.clip   = maxy;

			Util.project(segment.p1, (playerX * roadWidth) - x,      playerY + cameraHeight, position - (segment.looped ? trackLength : 0), cameraDepth, width, height, roadWidth);
			Util.project(segment.p2, (playerX * roadWidth) - x - dx, playerY + cameraHeight, position - (segment.looped ? trackLength : 0), cameraDepth, width, height, roadWidth);

			x  = x + dx;
			dx = dx + segment.curve;

			if ((segment.p1.camera.z <= cameraDepth)         || // behind us
				(segment.p2.screen.y >= segment.p1.screen.y) || // back face cull
				(segment.p2.screen.y >= maxy))                  // clip by (already rendered) hill
				continue;

			Render.segment(ctx, width, lanes,
				segment.p1.screen.x,
				segment.p1.screen.y,
				segment.p1.screen.w,
				segment.p2.screen.x,
				segment.p2.screen.y,
				segment.p2.screen.w,
				segment.fog,
				segment.color);

			maxy = segment.p1.screen.y;
		}

		for(n = (drawDistance-1) ; n > 0 ; n--) {
			segment = segments[(baseSegment.index + n) % segments.length];

			for(i = 0 ; i < segment.cars.length ; i++) {
				car         = segment.cars[i];
				sprite      = car.sprite;
				spriteScale = Util.interpolate(segment.p1.screen.scale, segment.p2.screen.scale, car.percent);
				spriteX     = Util.interpolate(segment.p1.screen.x,     segment.p2.screen.x,     car.percent) + (spriteScale * car.offset * roadWidth * width/2);
				spriteY     = Util.interpolate(segment.p1.screen.y,     segment.p2.screen.y,     car.percent);

				

				Render.sprite(ctx, width, height, resolution, roadWidth, sprites, car.sprite, spriteScale, spriteX, spriteY, -0.5, -1, segment.clip);
				
				
			}

			for(i = 0 ; i < segment.sprites.length ; i++) {
				sprite      = segment.sprites[i];
				spriteScale = segment.p1.screen.scale;
				spriteX     = segment.p1.screen.x + (spriteScale * sprite.offset * roadWidth * width/2);
				spriteY     = segment.p1.screen.y;
				Render.sprite(ctx, width, height, resolution, roadWidth, sprites, sprite.source, spriteScale, spriteX, spriteY, (sprite.offset < 0 ? -1 : 0), -1, segment.clip);
			}

			if (segment == playerSegment) {
				Render.player(ctx, width, height, resolution, roadWidth, sprites, speed/maxSpeed,
					((cameraDepth/playerZ)/5),
					width/2,
					(height/2) - (cameraDepth/playerZ * Util.interpolate(playerSegment.p1.camera.y, playerSegment.p2.camera.y, playerPercent) * height/2),
					speed * (keyLeft ? -1 : keyRight ? 1 : 0),
					playerSegment.p2.world.y - playerSegment.p1.world.y);
			}
		}


	} else {
		Render.player(ctx, width, height, resolution, roadWidth, sprites, speed/maxSpeed,
					((cameraDepth/playerZ)/5),
					width/2,
					(height/2) - (cameraDepth/playerZ * Util.interpolate(playerSegment.p1.camera.y, playerSegment.p2.camera.y, playerPercent) * height/2),
					speed * (keyLeft ? -1 : keyRight ? 1 : 0),
					playerSegment.p2.world.y - playerSegment.p1.world.y);
	};
}

function findSegment(z) {
	return segments[Math.floor(z/segmentLength) % segments.length];
}

//=========================================================================
// BUILD ROAD GEOMETRY
//=========================================================================

function lastY() { return (segments.length == 0) ? 0 : segments[segments.length-1].p2.world.y; }

function addSegment(curve, y) {
	var n = segments.length;
	segments.push({
		index: n,
		p1: { world: { y: lastY(), z:  n   *segmentLength }, camera: {}, screen: {} },
		p2: { world: { y: y,       z: (n+1)*segmentLength }, camera: {}, screen: {} },
		curve: curve,
		sprites: [],
		cars: [],
		color: Math.floor(n/rumbleLength)%2 ? COLORS.DARK : COLORS.LIGHT
	});
}

function addSprite(n, sprite, offset) {
	segments[n].sprites.push({ source: sprite, offset: offset });
}

function addRoad(enter, hold, leave, curve, y) {
	var startY   = lastY();
	var endY     = startY + (Util.toInt(y, 0) * segmentLength);
	var n, total = enter + hold + leave;
	for(n = 0 ; n < enter ; n++)
		addSegment(Util.easeIn(0, curve, n/enter), Util.easeInOut(startY, endY, n/total));
	for(n = 0 ; n < hold  ; n++)
		addSegment(curve, Util.easeInOut(startY, endY, (enter+n)/total));
	for(n = 0 ; n < leave ; n++)
		addSegment(Util.easeInOut(curve, 0, n/leave), Util.easeInOut(startY, endY, (enter+hold+n)/total));
}

var ROAD = {
	LENGTH: { NONE: 0, SHORT:  25, MEDIUM:   50, LONG:  100 },
	HILL:   { NONE: 0, LOW:    20, MEDIUM:   40, HIGH:   60 },
	CURVE:  { NONE: 0, EASY:    1, MEDIUM:    2, HARD:    3 }
};

function addStraight(num) {
	num = num || ROAD.LENGTH.MEDIUM;
	addRoad(num, num, num, 0, 0);
}

function addHill(num, height) {
	num    = num    || ROAD.LENGTH.MEDIUM;
	height = height || ROAD.HILL.MEDIUM;
	addRoad(num, num, num, 0, height);
}

function addCurve(num, curve, height) {
	num    = num    || ROAD.LENGTH.MEDIUM;
	curve  = curve  || ROAD.CURVE.MEDIUM;
	height = height || ROAD.HILL.NONE;
	addRoad(num, num, num, curve, height);
}

function addLowRollingHills(num, height) {
	num    = num    || ROAD.LENGTH.SHORT;
	height = height || ROAD.HILL.LOW;
	addRoad(num, num, num,  0,                height/2);
	addRoad(num, num, num,  0,               -height);
	addRoad(num, num, num,  ROAD.CURVE.EASY,  height);
	addRoad(num, num, num,  0,                0);
	addRoad(num, num, num, -ROAD.CURVE.EASY,  height/2);
	addRoad(num, num, num,  0,                0);
}

function addSCurves() {
	addRoad(ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM,  -ROAD.CURVE.EASY,    ROAD.HILL.NONE);
	addRoad(ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM,   ROAD.CURVE.MEDIUM,  ROAD.HILL.MEDIUM);
	addRoad(ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM,   ROAD.CURVE.EASY,   -ROAD.HILL.LOW);
	addRoad(ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM,  -ROAD.CURVE.EASY,    ROAD.HILL.MEDIUM);
	addRoad(ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM,  -ROAD.CURVE.MEDIUM, -ROAD.HILL.MEDIUM);
}

function addBumps() {
	addRoad(10, 10, 10, 0,  5);
	addRoad(10, 10, 10, 0, -2);
	addRoad(10, 10, 10, 0, -5);
	addRoad(10, 10, 10, 0,  8);
	addRoad(10, 10, 10, 0,  5);
	addRoad(10, 10, 10, 0, -7);
	addRoad(10, 10, 10, 0,  5);
	addRoad(10, 10, 10, 0, -2);
}

function addDownhillToEnd(num) {
	num = num || 200;
	addRoad(num, num, num, 0, -lastY()/segmentLength);
}

function resetRoad() {
	segments = [];

	//	MIN TRACK LENGTH = 380

	addRoad(0, 100, 0, 0,  0);

	addRoad(20, 50, 20, -2,  0);

	addRoad(10, 30, 10, 0,  0);

	addRoad(10, 50, 10, 0,  17);
	addRoad(10, 20, 10, 0,  0);

	addRoad(20, 80, 20, 2,  -15);

	addRoad(10, 40, 10, 0,  0);

	addRoad(10, 50, 10, -2,  15);

	addRoad(0, 100, 0, 0,  0);

	addRoad(20, 80, 20, -2,  15);

	addRoad(20, 50, 20, 0,  0);

	addRoad(20, 50, 20, 2,  -15);


	/*addLowRollingHills();
	addSCurves();
	addCurve(ROAD.LENGTH.MEDIUM, ROAD.CURVE.MEDIUM, ROAD.HILL.LOW);
	addBumps();
	addLowRollingHills();
	addCurve(ROAD.LENGTH.LONG*2, ROAD.CURVE.MEDIUM, ROAD.HILL.MEDIUM);
	addStraight();
	addHill(ROAD.LENGTH.MEDIUM, ROAD.HILL.HIGH);
	addSCurves();
	addCurve(ROAD.LENGTH.LONG, -ROAD.CURVE.MEDIUM, ROAD.HILL.NONE);
	addHill(ROAD.LENGTH.LONG, ROAD.HILL.HIGH);
	addCurve(ROAD.LENGTH.LONG, ROAD.CURVE.MEDIUM, -ROAD.HILL.LOW);
	addBumps();
	addHill(ROAD.LENGTH.LONG, -ROAD.HILL.MEDIUM);
	addStraight();
	addSCurves();*/
	addDownhillToEnd(100);

	resetSprites();
	resetCars();

	segments[findSegment(playerZ).index + 2].color = COLORS.START;
	segments[findSegment(playerZ).index + 3].color = COLORS.START;
	/*for(var n = 0 ; n < rumbleLength ; n++)
		segments[segments.length-1-n].color = COLORS.FINISH;*/

	trackLength = segments.length * segmentLength;
}

function resetSprites() {
	var n, i;


	for(n = 0 ; n < 300 ; n += 9 + Math.floor(n/100)) {
		addSprite(n, SPRITES.CYPRESS, 1 + Math.random()*1.5);
	}


	for(n = 0 ; n < 300 ; n += 12 + Math.floor(n/100)) {
		addSprite(n, SPRITES.CYPRESS, 3 + Math.random()*0.5);
	}


	for(n = 0 ; n < 200 ; n += 40 + Math.floor(n/100)) {
		addSprite(n, SPRITES.STONEPINE,   -1 - Math.random()*2);
	}

	for(n = 0 ; n < 200 ; n += 10 + Math.floor(n/100)) {
		addSprite(n, SPRITES.STONEPINE,   -3 - Math.random()*3);
	}

	for(n = 0 ; n < 200 ; n += 40 + Math.floor(n/100)) {
		addSprite(n, SPRITES.ROSEBUSH,   -1.2 - Math.random()*2);
	}

	for(n = 0 ; n < 200 ; n += 30 + Math.floor(n/100)) {
		addSprite(n, SPRITES.SUNFLOWERS,   -1.2 - Math.random()*2);
	}

	addSprite(115, SPRITES.BILLBOARDFIAT, -2);

	addSprite(230,  SPRITES.FENCE, -1.5);
	addSprite(230,  SPRITES.FENCE, -2.5);
	addSprite(230,  SPRITES.FENCE, -3.5);

	addSprite(235,  SPRITES.ROSEBUSH, -1.65);
	addSprite(240,  SPRITES.SUNFLOWERS, -2.3);
	addSprite(245,  SPRITES.ROSEBUSH, -1.2);

	addSprite(250,  SPRITES.FARMHOUSE, -2);

	addSprite(255,  SPRITES.SUNFLOWERS, -2);
	addSprite(257,  SPRITES.ROSEBUSH, -1.2);

	addSprite(260,  SPRITES.OLIVETREE, -1.5);
	addSprite(270,  SPRITES.OLIVETREE, -1.2);

	addSprite(275,  SPRITES.FENCE, -1.5);
	addSprite(275,  SPRITES.FENCE, -2.5);
	addSprite(275,  SPRITES.FENCE, -3.5);

	for(n = 270 ; n < 600 ; n += 4 + Math.floor(n/100)) {
		addSprite(n, SPRITES.CYPRESS, -1 - Math.random()*2);
	}


	for(n = 270 ; n < 450 ; n += 4 + Math.floor(n/100)) {
		addSprite(n, SPRITES.CYPRESS, 1 + Math.random()*2);
	}



	addSprite(460,  SPRITES.FENCE, 1.5);
	addSprite(460,  SPRITES.FENCE, 2.5);
	addSprite(460,  SPRITES.FENCE, 3.5);

	addSprite(465,  SPRITES.ROSEBUSH, 1.65);
	addSprite(467,  SPRITES.SUNFLOWERS, 2.3);

	addSprite(490, SPRITES.BILLBOARDABARTH, 2);
	addSprite(495,  SPRITES.OLIVETREE, 1.5);

	for(n = 540 ; n < 900 ; n += 5 + Math.floor(n/100)) {
		addSprite(n, SPRITES.STONEPINE,   -1.25 - Math.random()*3);
	}

	for(n = 540 ; n < 900 ; n += 5 + Math.floor(n/100)) {
		addSprite(n, SPRITES.SUNFLOWERS,   -1.25 - Math.random()*3);
	}

	addSprite(700, SPRITES.BILLBOARDFIAT, 2);

	for(n = 540 ; n < 720 ; n += 5 + Math.floor(n/100)) {
		addSprite(n, SPRITES.STONEPINE,   1.25 + Math.random()*3);
	}

	for(n = 720 ; n < 900 ; n += 5 + Math.floor(n/100)) {
		addSprite(n, SPRITES.OLIVETREE,   1.25 + Math.random()*3);
	}

	for(n = 540 ; n < 900 ; n += 5 + Math.floor(n/100)) {
		addSprite(n, SPRITES.SUNFLOWERS,   1.25 + Math.random()*3);
	}


	

	addSprite(920,  SPRITES.FENCE, 1.5);
	addSprite(920,  SPRITES.FENCE, 2.5);
	addSprite(920,  SPRITES.FENCE, 3.5);

	addSprite(925,  SPRITES.ROSEBUSH, 1.65);
	addSprite(930,  SPRITES.SUNFLOWERS, 2.3);
	addSprite(935,  SPRITES.ROSEBUSH, 1.2);

	addSprite(940,  SPRITES.FARMHOUSE, 2);

	addSprite(955,  SPRITES.SUNFLOWERS, 2);
	addSprite(957,  SPRITES.ROSEBUSH, 1.2);

	addSprite(960,  SPRITES.OLIVETREE, 1.5);
	addSprite(970,  SPRITES.OLIVETREE, 1.2);

	addSprite(975,  SPRITES.FENCE, 1.5);
	addSprite(975,  SPRITES.FENCE, 2.5);
	addSprite(975,  SPRITES.FENCE, 3.5);


	for(n = 975 ; n < 1220 ; n += 10) {
		addSprite(n, SPRITES.CYPRESS, 1 + Math.random()*1);
	}


	addSprite(980, SPRITES.BILLBOARDABARTH, -2);

	for(n = 900 ; n < 1050 ; n += 40 + Math.floor(n/100)) {
		addSprite(n, SPRITES.STONEPINE,   -1 - Math.random()*2);
	}

	for(n = 900 ; n < 1050 ; n += 10 + Math.floor(n/100)) {
		addSprite(n, SPRITES.STONEPINE,   -3 - Math.random()*3);
	}

	for(n = 900 ; n < 1050 ; n += 40 + Math.floor(n/100)) {
		addSprite(n, SPRITES.ROSEBUSH,   -1.2 - Math.random()*2);
	}

	for(n = 900 ; n < 1050 ; n += 30 + Math.floor(n/100)) {
		addSprite(n, SPRITES.SUNFLOWERS,   -1.2 - Math.random()*2);
	}

	for(n = 1050 ; n < 1300 ; n += 2) {
		addSprite(n, SPRITES.CYPRESS, -1 - Math.random()*10);
	}

/*	for(n = 250 ; n < 1000 ; n += 5) {
		*//*addSprite(n,     SPRITES.COLUMN, 1.1);*//*
		addSprite(n + Util.randomInt(0,5), SPRITES.CYPRESS, 1 + (Math.random() * 2));
		addSprite(n + Util.randomInt(0,5), SPRITES.STONEPINE, -1 - (Math.random() * 2));
	}*/
/*
	for(n = 200 ; n < segments.length ; n += 3) {
		addSprite(n, Util.randomChoice(SPRITES.PLANTS), Util.randomChoice([1,-1]) * (2 + Math.random() * 5));
	}*/

/*	var side, sprite, offset;
	for(n = 1000 ; n < (segments.length-50) ; n += 100) {
		side      = Util.randomChoice([1, -1]);
		addSprite(n + Util.randomInt(0, 50), Util.randomChoice(SPRITES.BILLBOARDS), -side);
		for(i = 0 ; i < 20 ; i++) {
			sprite = Util.randomChoice(SPRITES.PLANTS);
			offset = side * (1.5 + Math.random());
			addSprite(n + Util.randomInt(0, 50), sprite, offset);
		}

	}*/

}

function resetCars() {
	cars = [];
	var n, car, segment, offset, z, sprite, speed;
	for (var n = 0 ; n < totalCars ; n++) {
		offset = Math.random() * Util.randomChoice([-0.8, 0.8]);
		z      = Math.floor(Math.random() * segments.length) * segmentLength;
		sprite = Util.randomChoice(SPRITES.CARS);
		speed  = maxSpeed/4 + Math.random() * maxSpeed/(sprite == SPRITES.SEMI ? 4 : 2);
		car = { offset: offset, z: z, sprite: sprite, speed: speed };
		segment = findSegment(car.z);
		segment.cars.push(car);
		cars.push(car);
	}
}

//=========================================================================
// THE GAME LOOP
//=========================================================================

Game.run({
	canvas: canvas, render: render, update: update, stats: stats, step: step,
	images: ["background", "sprites"],
	keys: [
		{ keys: [KEY.LEFT,  KEY.A], mode: 'down', action: function() { keyRight  = false; keyLeft   = true;  } },
		{ keys: [KEY.RIGHT, KEY.D], mode: 'down', action: function() { keyLeft   = false; keyRight  = true;  } },
		{ keys: [KEY.UP,    KEY.W], mode: 'down', action: function() { /*keyFaster = true;*/  } },
		{ keys: [KEY.DOWN,  KEY.S], mode: 'down', action: function() { /*keySlower = true;*/  } },
		{ keys: [KEY.LEFT,  KEY.A], mode: 'up',   action: function() { keyRight  = false; keyLeft   = false; } },
		{ keys: [KEY.RIGHT, KEY.D], mode: 'up',   action: function() { keyLeft   = false; keyRight  = false; } },
		{ keys: [KEY.UP,    KEY.W], mode: 'up',   action: function() { /*keyFaster = false;*/ } },
		{ keys: [KEY.DOWN,  KEY.S], mode: 'up',   action: function() { /*keySlower = false;*/ } }
	],
	ready: function(images) {
		background = images[0];
		sprites    = images[1];
		reset();
		Dom.storage.fast_lap_time = Dom.storage.fast_lap_time || 180;
		//updateHud('fast_lap_time', formatTime(Util.toFloat(Dom.storage.fast_lap_time)));
	}
});

function reset(options) {
	options       = options || {};
	canvas.width  = width  = Util.toInt(options.width,          width);
	canvas.height = height = Util.toInt(options.height,         height);
	lanes                  = Util.toInt(options.lanes,          lanes);
	roadWidth              = Util.toInt(options.roadWidth,      roadWidth);
	cameraHeight           = Util.toInt(options.cameraHeight,   cameraHeight);
	drawDistance           = Util.toInt(options.drawDistance,   drawDistance);
	fogDensity             = Util.toInt(options.fogDensity,     fogDensity);
	fieldOfView            = Util.toInt(options.fieldOfView,    fieldOfView);
	segmentLength          = Util.toInt(options.segmentLength,  segmentLength);
	rumbleLength           = Util.toInt(options.rumbleLength,   rumbleLength);
	cameraDepth            = 1 / Math.tan((fieldOfView/2) * Math.PI/180);
	playerZ                = (cameraHeight * cameraDepth);
	resolution             = height/480;
	//refreshTweakUI();

	if ((segments.length==0) || (options.segmentLength) || (options.rumbleLength))
		resetRoad(); // only rebuild road when necessary
}

//=========================================================================
// TWEAK UI HANDLERS
//=========================================================================
/*

Dom.on('resolution', 'change', function(ev) {
	var w, h, ratio;
	switch(ev.target.options[ev.target.selectedIndex].value) {
		case 'fine':   w = 970; h = 500;  ratio=w/width; break;
		case 'high':   w = 970; h = 500;  ratio=w/width; break;
		case 'medium': w = 640;  h = 480;  ratio=w/width; break;
		case 'low':    w = 480;  h = 360;  ratio=w/width; break;
	}
	reset({ width: w, height: h })
	Dom.blur(ev);
});

Dom.on('lanes',          'change', function(ev) { Dom.blur(ev); reset({ lanes:         ev.target.options[ev.target.selectedIndex].value }); });
Dom.on('roadWidth',      'change', function(ev) { Dom.blur(ev); reset({ roadWidth:     Util.limit(Util.toInt(ev.target.value), Util.toInt(ev.target.getAttribute('min')), Util.toInt(ev.target.getAttribute('max'))) }); });
Dom.on('cameraHeight',   'change', function(ev) { Dom.blur(ev); reset({ cameraHeight:  Util.limit(Util.toInt(ev.target.value), Util.toInt(ev.target.getAttribute('min')), Util.toInt(ev.target.getAttribute('max'))) }); });
Dom.on('drawDistance',   'change', function(ev) { Dom.blur(ev); reset({ drawDistance:  Util.limit(Util.toInt(ev.target.value), Util.toInt(ev.target.getAttribute('min')), Util.toInt(ev.target.getAttribute('max'))) }); });
Dom.on('fieldOfView',    'change', function(ev) { Dom.blur(ev); reset({ fieldOfView:   Util.limit(Util.toInt(ev.target.value), Util.toInt(ev.target.getAttribute('min')), Util.toInt(ev.target.getAttribute('max'))) }); });
Dom.on('fogDensity',     'change', function(ev) { Dom.blur(ev); reset({ fogDensity:    Util.limit(Util.toInt(ev.target.value), Util.toInt(ev.target.getAttribute('min')), Util.toInt(ev.target.getAttribute('max'))) }); });


function refreshTweakUI() {
	Dom.get('lanes').selectedIndex = lanes-1;
	Dom.get('currentRoadWidth').innerHTML      = Dom.get('roadWidth').value      = roadWidth;
	Dom.get('currentCameraHeight').innerHTML   = Dom.get('cameraHeight').value   = cameraHeight;
	Dom.get('currentDrawDistance').innerHTML   = Dom.get('drawDistance').value   = drawDistance;
	Dom.get('currentFieldOfView').innerHTML    = Dom.get('fieldOfView').value    = fieldOfView;
	Dom.get('currentFogDensity').innerHTML     = Dom.get('fogDensity').value     = fogDensity;
}
 */
//=========================================================================
