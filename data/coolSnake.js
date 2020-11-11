
const WHITE = 'rgb(205,205,205)';
const BLACK = 'rgb(50,50,50)';
const KINDA_BLACK = 'rgb(100,100,100)';
const GREEN = 'rgb(207,255,179)';
const ORANGE = 'rgb(246,189,96)';
const INDIGO = 'rgb(108,105,141)';
const RED = 'rgb(237,106,90)';
const BLUE = 'rgb(175,210,233)';
const RED2 = 'rgb(191,49,0)';
const WHITE2 = 'rgb(219,223,172)';
const BADRED = '#EB8987';
const GOODGREEN = '#A8FFA9';
const MAGENTA = '#E97BFF';
const LIGHTGRAY = '#CCCCCC';
const BRAINRED = "#F0ACA3";
const SLOWGREEN = "rgba(56,128,48,0.3)";
const FASTYELLOW = "rgba(230,222,87,0.3)"

const COLORCHOICES = [RED,BLUE,INDIGO,ORANGE,GREEN,MAGENTA];

const canvas = document.getElementById('myCanvas');
//canvas.textAlign = "center";
const ctx = canvas.getContext('2d');

const BLOCKSIZE = 20
const EDGESIZE = -1
const PARTICLE_TYPE = 'random' // 'uniform' or 'random'
const PARTICLESIZE = PARTICLE_TYPE == 'uniform' ? Math.round(BLOCKSIZE * 0.3) : Math.round(BLOCKSIZE*0.4)
const PARTICLEMIN = 20 // 50
const PARTICLEMAX = 10 // 25
const PARTICLEVEL = 12.5; // 12.5
const CAMERASHAKE = 5
const SNAKEGROWTH = 3
const FPS_INITIAL = 30
const FPS_INCREASE = 0.1
const MAX_SCREEN_PARTICLES = 2000

const RIGHT = 1;
const LEFT = 2;
const UP = 3;
const DOWN = 4;

// ENEMIES THAT DEBUFF - SLOW/FAST
// ENEMY THAT CHARGES YOU, BUT IF YOU'RE DIRECTLY IN THE MIDDLE HE DIES
// 
// EXP BAR?
// SPEED ABILITY
// LASER ABILITY!!!!!

// BUGS
// FIX CAMERA - JANKY
// WHEN THE CAMERA SHAKES AND YOU CAN SEE PAST THE EDGES, YOU SHOULD BE ABLE TO SEE THE OTHER SIDES OF THE SCREEN

// CONSIDER COLOR CODING ENEMIES

function setCookie(cname, cvalue) {
  document.cookie = cname + "=" + cvalue + ";"
}

function getCookie(cname) {
  var name = cname + "=";
  var decodedCookie = decodeURIComponent(document.cookie);
  var ca = decodedCookie.split(';');
  for(var i = 0; i <ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

function Sound(src, isSFX){
	this.sound = document.createElement("audio");
	this.sound.src = src;
	this.sound.setAttribute("preload", "auto");
	this.sound.setAttribute("controls", "none");
	this.sound.style.display = "none";
	this.isSFX = isSFX
	document.body.appendChild(this.sound);

	this.play = function(){
		if ((this.isSFX && !gameState.SFXmuted) || !this.isSFX){
			this.sound.play();
		}
	}
	
	this.stop = function(){
		if (this.sound.currentTime > this.sound.duration*5/6){
			this.sound.pause();
			this.sound.currentTime = 0;
		}
	}
}

let explodeSound = new Sound('data/Explosion3.wav', true);
let deathSound = new Sound('data/Explosion4.wav', true);
let eatSound = new Sound('data/Eaten.wav', true);
let playerEatSound = new Sound('data/deadEatSound2.wav', true);
let deadEatSound = new Sound('data/deadEatSound2.wav',true);
let laserCharge = new Sound('data/LaserCharge.wav',true);
let laserShot = new Sound('data/LaserShot.wav',true);
let menuBlip = new Sound('data/menuBlip.wav',true)

const Camera = {
	pos: [0,0],
	shakeAmp: 0,
	maxShakeCounter: 0.5,
	shakeCounter: 0,
	draw: function(pos,color,outline = 0){
		ctx.fillStyle = color;
		ctx.fillRect(pos[0]-this.pos[0],pos[1]-this.pos[1],BLOCKSIZE-EDGESIZE,BLOCKSIZE-EDGESIZE);
		if (outline){
			ctx.strokeStyle = outline;
			ctx.strokeRect(pos[0]-this.pos[0],pos[1]-this.pos[1],BLOCKSIZE-EDGESIZE,BLOCKSIZE-EDGESIZE);
		}
	},
	update: function(dt){
		if (this.shakeAmp > 0){
			let quakeAmtX = Math.random() * this.shakeAmp*2 - this.shakeAmp;
			let quakeAmtY = Math.random() * this.shakeAmp*2 - this.shakeAmp;
			this.pos[0]+= quakeAmtX;
			this.pos[1]+= quakeAmtY;
			this.shakeCounter+=dt;
			this.shakeAmp-=1
			if (this.shakeCounter >= this.maxShakeCounter){
				this.shakeCounter = 0;
				this.shakeAmp = 0;
			}
		} else {
			this.pos = [0,0];
		}
	}
}

class Particle {
	constructor(x,y,spd,color){
		this.pos = [x,y];
		this.xvel = Math.random()*spd*2-spd;
		this.yvel = Math.random()*spd*2-spd;
		this.color = color;
		if (PARTICLE_TYPE === 'random'){
			this.size = Math.random()*PARTICLESIZE;
		} else if (PARTICLE_TYPE === 'uniform'){
			this.size = PARTICLESIZE;
		}
	}
	
	update(){
        if (this.yvel > 0){
            this.yvel -= 0.1;
		}
        if (this.yvel < 0){
        	this.yvel += 0.1;
        }
		if (this.xvel > 0){
			this.xvel -= 0.1;
		}
		if (this.xvel < 0){
			this.xvel += 0.1;
		}
		if (Math.abs(this.yvel)<0.1){
			this.yvel = 0;
		}
		if (Math.abs(this.xvel) < 0.1){
			this.xvel = 0;
		}
		this.pos[0]+=this.xvel;
		this.pos[1]+=this.yvel;
	}
	
	draw(){
		ctx.fillStyle = this.color;
		ctx.fillRect(this.pos[0]-gameState.Cam.pos[0],this.pos[1]-gameState.Cam.pos[1],this.size,this.size)
	}
}

class Particles {
	constructor(x,y,spd,color){
		this.particles = [];
		this.particleNum = Math.round(Math.random()*(PARTICLEMAX - PARTICLEMIN)+PARTICLEMIN);
		for (let i = 0; i < this.particleNum; i++){
			this.particles.push(new Particle(x,y,spd,color))
		}
		this.lifetimeCounter = 0;
		this.lifetime = 10;
	}
	update(dt){
		for (let p in this.particles){
			this.particles[p].update();
			this.particles[p].draw();
		}
		this.lifetimeCounter+=dt;
	}
}

class ExcitingText{
	constructor(x,y,value,color,fontSize=18){
		let fontS = fontSize;
		this.value = value;
		if (value > 0){
			this.text = "+" + value;
			fontS += 3*value;
		} else {
			this.text = "" + value;
			fontS -= 3*value;
		}
		this.color = color;
		this.font = fontS + "px Free Sans Bold";
		this.pos = [x,y];
		this.yvel = -3;
		if (this.pos[1] < 40){
			this.pos[1] = 40;
			this.yvel = 0;
		}
		this.lifeTime = 30;
		this.dead = false;
	}
	update(entities){
		this.pos[1]+=this.yvel;
		if (this.pos[1] < 40){
			this.pos[1] = 40;
			this.yvel = 0;
		}
		this.lifeTime -= 1;
		if (this.lifeTime < 0 && !this.dead){
			this.dead = true;
		}
		for (let i = 0; i < entities.length; i++){
			if ((entities[i].pos[0]-this.pos[0])**2 + (entities[i].pos[1]-this.pos[1])**2 < 10000000**2 && this !== entities[i] && this.value*entities[i].value > 0){
				entities.push(new ExcitingText(entities[i].pos[0],entities[i].pos[1],this.value + entities[i].value, this.color))
				entities.splice(i,1);
				entities.splice(entities.indexOf(this),1);
			}
		}
	}
	draw(){
		canvas.textAlign = "center";
		ctx.fillStyle = this.color;
		ctx.font = this.font;
		ctx.fillText(this.text,this.pos[0],this.pos[1]);
	}
}

class MenuText{
	constructor(x,y,text,fontSize,interactable,f = false){
		this.text = text;
		this.color = LIGHTGRAY;
		this.pos = [x,y];
		this.fontSize = fontSize
		this.font = fontSize + "px Free Sans Bold";
		this.interactFont = (fontSize + 10) + "px Free Sans Bold";
		this.selectionColor = GOODGREEN;
		this.hovered = false;
		this.interactable = interactable
		this.ability = f;
	}
	draw(){
		if (this.hovered){
			ctx.fillStyle = this.selectionColor;
			ctx.font = this.interactFont
		} else {
			ctx.fillStyle = this.color;
			ctx.font = this.font;
		}
		ctx.fillText(this.text,this.pos[0],this.pos[1])
	}
	mouseInside(x,y){
		if (y > this.pos[1]-this.fontSize && y < this.pos[1]) {
			this.hovered = true
			return true
		}
	}
}

function getApplePos(){
	return [Math.floor(Math.random()*canvas.width/BLOCKSIZE)*BLOCKSIZE,
		Math.floor(Math.random()*canvas.height/BLOCKSIZE)*BLOCKSIZE];
}

function collides(pos1,pos2){
	return Math.abs(pos1[0]-pos2[0]) <= Math.abs(EDGESIZE*2) && Math.abs(pos1[1]-pos2[1]) <= Math.abs(EDGESIZE*2)
}

let menuState = {
	intTextIndex: 0,
	okPressed: false,
	texts: [
		new MenuText(50,canvas.height/2-100,"coolSnake.js",80,false),
		new MenuText(50,canvas.height/2-60,"Made by Mustapha Yassin",30,false)
	],
	intTexts: [
		new MenuText(50,canvas.height/2 + 100,"Play.",60,true,"play"),
		new MenuText(50,canvas.height/2+200,"Instructions.",60,true,"instruct")
	],
	backButton: new MenuText(50, canvas.height - 100, "Back.", 60, true, "back")
};

const mainMenu = () => {
	ctx.fillStyle = BLACK;
	ctx.clearRect(0,0,canvas.width,canvas.height);
	ctx.fillRect(0,0,canvas.width,canvas.height);
	menuState.intTextIndex = menuState.intTextIndex % menuState.intTexts.length
	for (let t in menuState.texts){
		menuState.texts[t].draw();
	}
	for (let i=0;i< menuState.intTexts.length;i++){
		if (menuState.intTexts[i].hovered !== (menuState.intTextIndex === i)){
			menuState.intTexts[i].hovered = (menuState.intTextIndex === i);
		}
		menuState.intTexts[i].mouseInside(menuState.mouseX,menuState.mouseY)
		menuState.intTexts[i].draw();
		
		if (menuState.intTexts[i].hovered && menuState.intTextIndex === -1) {
			menuState.intTextIndex = i
		}
	}
	if (menuState.okPressed && menuState.intTextIndex !== -1){
		menuState.okPressed = false;
		switch (menuState.intTexts[menuState.intTextIndex].ability){
		case "instruct":
			menuBlip.stop();
			menuBlip.play();
			return instructionScreen()
			break;
		case "play":
			gameState.levels = false;
			gameState.survival = true;
			menuBlip.stop();
			menuBlip.play();
			return play();
			break;
		}
	}
	menuState.okPressed = false;
	window.requestAnimationFrame(mainMenu)
}

const instructionScreen = () => {
	ctx.fillStyle = BLACK;
	ctx.clearRect(0,0,canvas.width,canvas.height);
	ctx.fillRect(0,0,canvas.width,canvas.height);
	ctx.fillStyle = LIGHTGRAY
	ctx.font = '30px Free Sans Bold'
	ctx.fillText("Use the arrow keys or WASD to move your snake around the battlefield.", 50, 100)
	ctx.fillText("You can eat apples (and other snakes) to gain length and stay healthy.", 50, 165)
	ctx.fillText("Survive for as long as you can. Remember - eat or be eaten, kid.", 50, 230)
	ctx.fillText("The grey snakes are made out of stone.", 50, 360)
	ctx.fillText("Don't eat their bodies, that'll shatter your teeth.",50,425)
	ctx.fillText("Go for the head instead.",50,490)
	menuState.backButton.hovered = true
	menuState.backButton.draw()
	
	ctx.fillStyle = BRAINRED
	ctx.fillRect(400,175,BLOCKSIZE,BLOCKSIZE)
	ctx.fillRect(300,370,BLOCKSIZE,BLOCKSIZE)
	ctx.fillStyle = MAGENTA
	ctx.fillRect(240,175,BLOCKSIZE,BLOCKSIZE)
	ctx.fillStyle = INDIGO
	ctx.fillRect(400+BLOCKSIZE,175,BLOCKSIZE,BLOCKSIZE)
	ctx.fillRect(400+2*BLOCKSIZE,175,BLOCKSIZE,BLOCKSIZE)
	ctx.fillRect(400+3*BLOCKSIZE,175,BLOCKSIZE,BLOCKSIZE)
	ctx.fillStyle = LIGHTGRAY
	ctx.fillRect(300+BLOCKSIZE,370,BLOCKSIZE,BLOCKSIZE)
	ctx.fillRect(300+2*BLOCKSIZE,370,BLOCKSIZE,BLOCKSIZE)
	ctx.fillRect(300+3*BLOCKSIZE,370,BLOCKSIZE,BLOCKSIZE)
	ctx.fillRect(300+4*BLOCKSIZE,370,BLOCKSIZE,BLOCKSIZE)
	
	ctx.fillStyle = LIGHTGRAY
	ctx.font = '20px Free Sans Bold'
	ctx.fillText("Slow aura",570,570)
	ctx.fillText("Fast aura",770,570)
	appleX = 600
	appleY = 550
	ctx.fillStyle = SLOWGREEN
	for (let i = 0; i < 2; i++){
		for (let row = 0; row <= 8; row++){
			for (let col = 0; col <= 8; col++){
			ctx.fillRect((appleX-BLOCKSIZE*4 + col * BLOCKSIZE + canvas.width)%canvas.width,(appleY-BLOCKSIZE*4 + row * BLOCKSIZE + canvas.height)%canvas.height,BLOCKSIZE,BLOCKSIZE)
			}
		}
		ctx.fillStyle = FASTYELLOW
		appleX = 800
	}
	
	
	
	
	
	if (menuState.okPressed) {
		menuState.okPressed = false
		menuBlip.stop();
		menuBlip.play();
		return mainMenu();
	}
	window.requestAnimationFrame(instructionScreen)
}

let gameState = {
	snakePos: [Math.floor(canvas.width/2/BLOCKSIZE)*BLOCKSIZE,Math.floor(canvas.height/2/BLOCKSIZE)*BLOCKSIZE],
	snakeList: [[Math.floor(canvas.width/2/BLOCKSIZE)*BLOCKSIZE,Math.floor(canvas.height/2/BLOCKSIZE)*BLOCKSIZE]],
	direction: DOWN,
	lastDirection: DOWN,
	nextDirection: false,
	slowAbility: false,
	fastAbility: false,
	levels: false,
	survival: false,
	moveFreq: 2, // moves once every two frames 
	appleGet: 0,
	applePos: getApplePos(),
	appleColors: COLORCHOICES,
	appleColor: RED,
	apples: [],
	score: 0,
	colorList: [WHITE],
	Cam: Camera,
	particleList: [],
	sharks: [],
	dead: false,
	hurtCounter: 0,
	counter: 0,
	spawnCounter: 0,
	dcounter: 0,
	movedThisFrame: 0,
	entities: [],
	currentWave: 0,
	curWaveEnemies: 0,
	waveBufferTimer: 0,
	waveBuffer: 2,
	currentLevelObj: [],
	currentLevel: 0,
	scoreTime: 0,
	SFXmuted: false,
	nextFrame: -1,
};

document.addEventListener('keydown', event => {
	switch (event.keyCode){
	case 65:
	case 37: // left
		if (!(gameState.lastDirection===RIGHT) && !gameState.movedThisFrame){			
			gameState.direction = LEFT;
			gameState.movedThisFrame = 1;
		} else {
			gameState.nextDirection = LEFT;
		}
		break;
	case 87:
	case 38: 
		//up
		if (!(gameState.lastDirection===DOWN) && !gameState.movedThisFrame){			
			gameState.direction = UP;
			gameState.movedThisFrame = 1;
		} else {
			gameState.nextDirection = UP;
		}
		menuState.intTextIndex -= 1; 
		break;
	case 68:
	case 39: 
		//right
		if (!(gameState.lastDirection===LEFT) && !gameState.movedThisFrame){			
			gameState.direction = RIGHT;
			gameState.movedThisFrame = 1;
		} else {
			gameState.nextDirection = RIGHT;
		}
		break;
	case 83:
	case 40:
		//down
		if (!(gameState.lastDirection===UP) && !gameState.movedThisFrame){			
			gameState.direction = DOWN;
			gameState.movedThisFrame = 1;
		} else {
			gameState.nextDirection = DOWN;
		}
		menuState.intTextIndex += 1;
		break;
	case 90:
		gameState.fastAbility = !gameState.fastAbility;
		break;
	case 88:
		gameState.slowAbility = !gameState.slowAbility;
	case 13:
		// enter
		menuState.okPressed = true;
		break;
	case 32:
		menuState.okPressed = true;
		break;
	case 27:
		// escape
		if (!gameState.paused){
			gameState.paused = true;
		} else {
			gameState.paused = false
			lastTime = Date.now()
			play()
		}
		break;
	case 80:
		// p
		gameState.dead = true
		gameState.snakeList = [];
		gameState.colorList = [];
		window.clearTimeout(gameState.nextFrame);
		mainMenu()
		break
	case 77:
		// m
		gameState.SFXmuted = !gameState.SFXmuted
		break
	}
})

document.addEventListener('mousemove', event => {
	menuState.intTextIndex = -1
	let rect = canvas.getBoundingClientRect()
	menuState.mouseX = event.offsetX - rect.left
	menuState.mouseY = event.offsetY - rect.top
})

document.addEventListener('mouseup', event => {
	menuState.okPressed = true
	console.log(menuState.mouseX + ',' + menuState.mouseY)
})

let lastTime = Date.now();
gameState.appleColor = COLORCHOICES[Math.floor(Math.random() * COLORCHOICES.length)];
gameState.highscore = Math.floor(getCookie('highscore')*100)/100
if (gameState.highscore === "") {gameState.highscore = 0}
const play = () => {
	let now = Date.now();
	let dt = (now - lastTime)/1000.0;
	lastTime = now;
	let hurt = false;
	if (gameState.snakeList.length > 1 || gameState.dead){
		gameState.counter += dt;
		gameState.spawnCounter+=dt;
	} else {
		gameState.scoreTimer = 0
	}
	/*if (gameState.sharks.length < 1){
		gameState.sharks.push(new Charger(getApplePos(),4));
	}*/
	
	if (gameState.snakeList.length) {
		if (gameState.snakePos !== gameState.snakeList[gameState.snakeList.length-1]){
			gameState.snakePos = gameState.snakeList[gameState.snakeList.length-1];
		}
	}
	if (gameState.dead){
		gameState.snakeList = [];
		gameState.colorList = [];
		if (gameState.spawnCounter > 2){
			gameState.dead = false;
			gameState.snakePos = [Math.floor(canvas.width/2/BLOCKSIZE)*BLOCKSIZE,Math.floor(canvas.height/2/BLOCKSIZE)*BLOCKSIZE]
			gameState.snakeList = [gameState.snakePos]
			gameState.colorList = [WHITE]
			gameState.direction = DOWN;
			gameState.particleList = [];
			gameState.sharks = [];
			gameState.apples = [];
			gameState.counter = 0;
			gameState.currentWave = 0;
			gameState.curWaveEnemies = 0;
			gameState.waveBufferTimer = 0;
			gameState.currentLevelObj = [];
			for (let i = 0; i < level1.length; i++){
				gameState.currentLevelObj[i] = {
					roomLimit: level1[i].roomLimit,
					enemies: []
				}
				for (let k = 0; k < level1[i].enemies.length; k ++){
					gameState.currentLevelObj[i].enemies[k]=[level1[i].enemies[k][0],level1[i].enemies[k][1]]
				}
			}
			console.log(gameState.currentLevelObj)
		}
		
	}
	if (gameState.fastAbility && !gameState.slowAbility){
		gameState.dcounter++;
		gameState.moveFreq = 1;
		gameState.dcounter = Math.floor(gameState.dcounter);
	} else if (gameState.slowAbility && !gameState.fastAbility){
		gameState.dcounter += 0.5;
		gameState.moveFreq = 2;
	} else {
		gameState.dcounter = Math.floor(gameState.dcounter);
		gameState.dcounter++;
		gameState.moveFreq = 2;
	}
	
	if (gameState.dcounter % gameState.moveFreq === 0){
		gameState.movedThisFrame = 0;
		if (gameState.direction === DOWN){
			gameState.snakePos = [gameState.snakePos[0],gameState.snakePos[1]+BLOCKSIZE];
			if (gameState.snakePos[1]>=canvas.height){
				gameState.snakePos = [gameState.snakePos[0],0];
			}
		}
		if (gameState.direction === RIGHT){
			gameState.snakePos = [gameState.snakePos[0]+BLOCKSIZE,gameState.snakePos[1]]
			if (gameState.snakePos[0]>=canvas.width){
				gameState.snakePos = [0,gameState.snakePos[1]];
			}
		}
		if(gameState.direction === UP){
			gameState.snakePos = [gameState.snakePos[0],gameState.snakePos[1]-BLOCKSIZE];
			if (gameState.snakePos[1] < 0){
				gameState.snakePos = [gameState.snakePos[0],canvas.height-BLOCKSIZE];
			}
		}
		if (gameState.direction === LEFT){
			gameState.snakePos = [gameState.snakePos[0]-BLOCKSIZE,gameState.snakePos[1]]
			if (gameState.snakePos[0] < 0){
				gameState.snakePos = [canvas.width - BLOCKSIZE,gameState.snakePos[1]];
			}
		}
		
		if (gameState.appleGet <= 0){
			if (gameState.snakeList.length > 0){
				gameState.snakeList.shift()
			} else {
				if (!gameState.dead){
					gameState.dead = true;
					gameState.scoreTime = 0
					deathSound.stop();
					deathSound.play();
					for (let b in gameState.snakeList){
						let pcol = gameState.colorList[b];
						gameState.particleList.push(new Particles(gameState.snakeList[b][0],gameState.snakeList[b][1],PARTICLEVEL,pcol));
					}
					gameState.Cam.shakeAmp = CAMERASHAKE;
					gameState.snakeList = [];
					gameState.colorList = [];
				}
			}
		}
		let insideMyself = false;
		if (gameState.snakeList.indexOf(gameState.snakePos) !== -1 && !gameState.dead){
			let _i = 1;
			while (_i < 10){
				_i++;
				gameState.particleList.push(new Particles(gameState.snakeList[0][0],gameState.snakeList[0][1],PARTICLEVEL,WHITE));
				gameState.snakeList.shift();
			}
			gameState.Cam.shakeAmp = CAMERASHAKE;
			gameState.particleList.push(new Particles(gameState.snakePos[0],gameState.snakePos[1],PARTICLEVEL,WHITE));
			gameState.entities.push(new ExcitingText(gameState.snakePos[0],gameState.snakePos[1],-2,BADRED));
			gameState.hurt = true;
			eatSound.stop();
			eatSound.play();
			gameState.hurtCounter = 1/6;
			insideMyself = true;
		}
		for (let b = 0; b < gameState.snakeList.length-1; b++){
			if (!gameState.dead && collides(gameState.snakeList[b],gameState.snakePos)){
				let _i = 1;
				while (_i < 10){
					_i++;
					if (gameState.snakeList.length === 0)
						break;
					gameState.particleList.push(new Particles(gameState.snakeList[0][0],gameState.snakeList[0][1],PARTICLEVEL,WHITE));
					gameState.snakeList.shift();
				}
				gameState.Cam.shakeAmp = CAMERASHAKE;
				gameState.entities.push(new ExcitingText(gameState.snakePos[0],gameState.snakePos[1],-10,BADRED));
				gameState.hurt = true;
				gameState.hurtCounter = 1/6;
				eatSound.stop();
				eatSound.play();
				insideMyself = true;
			}
		}
		if (!insideMyself && !gameState.dead) {
			gameState.snakeList.push(gameState.snakePos);
			gameState.lastDirection = gameState.direction;
		}
		if (gameState.nextDirection && !(gameState.nextDirection === RIGHT && gameState.lastDirection ===LEFT || gameState.nextDirection === UP && gameState.lastDirection === DOWN || gameState.nextDirection === LEFT && gameState.lastDirection === RIGHT || gameState.nextDirection === DOWN && gameState.lastDirection === UP)){
			gameState.direction = gameState.nextDirection;
			gameState.nextDirection = false;
		} else {
			gameState.nextDirection = false;
		}
		
		gameState.appleGet -= 1;
		if (!gameState.dead && gameState.snakeList.length > 0){
			gameState.score = gameState.snakeList.length;
		}
		
		// APPLE UPDATING
		gameState.slowAbility = false;
		gameState.fastAbility = false;
		for (let k = 0; k < gameState.apples.length; k++){
			if (collides(gameState.snakePos,gameState.apples[k].pos)){
				gameState.particleList.push(new Particles(gameState.apples[k].pos[0],gameState.apples[k].pos[1],PARTICLEVEL,gameState.apples[k].color))
				gameState.entities.push(new ExcitingText(gameState.apples[k].pos[0],gameState.apples[k].pos[1],SNAKEGROWTH,GOODGREEN));
				gameState.Cam.shakeAmp = CAMERASHAKE;
				gameState.appleGet = SNAKEGROWTH;
				gameState.applePos = getApplePos();
				explodeSound.stop();
				explodeSound.play();
				for (let _i = 0; _i < gameState.appleGet; _i++){
					gameState.colorList.push(gameState.apples[k].color);
				}
				gameState.apples.splice(k,1);
				k-=1;
				gameState.appleColor = gameState.appleColors[Math.floor(Math.random() * gameState.appleColors.length)];
			}
		}
		if (gameState.apples.length < 1){
			gameState.apples.push(new Apple())
			if (Math.random()*100 < 50){
				gameState.apples.push(new SlowApple())
			}
			if (Math.random()*100 < 50){
				gameState.apples.push(new FastApple());
			}
		}
	}
	
	// SPAWNING
	if (gameState.currentLevelObj.length === 0){
		if (gameState.currentLevel === 1){
			gameState.currentLevelObj = [];
			for (let i = 0; i < level1.length; i++){
				gameState.currentLevelObj[i] = {
					roomLimit: level1[i].roomLimit,
					enemies: []
				}
				for (let k = 0; k < level1[i].enemies.length; k ++){
					gameState.currentLevelObj[i].enemies[k]=[level1[i].enemies[k][0],level1[i].enemies[k][1]]
				}
			}
		}
	}
	if (gameState.levels){
		if (gameState.sharks.length === 0 && !gameState.dead && gameState.score > SNAKEGROWTH){
			gameState.waveBufferCounter += dt;
			if (gameState.waveBufferCounter >= gameState.waveBuffer){
				gameState.currentWave++;
				gameState.waveBufferCounter = 0;
				gameState.curWaveEnemies = 0;
			}
		} else {
			gameState.waveBufferCounter = 0;
		}
	
		if (!gameState.dead && gameState.spawnCounter > 1 && gameState.score > SNAKEGROWTH){
			gameState.spawnCounter = 0;
			let newShark = spawnEnemy(gameState.curWaveEnemies,gameState.sharks.length,gameState.currentWave,gameState.currentLevelObj);
			if (newShark) {
				gameState.sharks.push(newShark);
				gameState.curWaveEnemies++;
			}
		}
	}
	if (gameState.survival){
		if (!gameState.dead && gameState.spawnCounter > 1 && gameState.score > SNAKEGROWTH && gameState.sharks.length < (gameState.counter**0.5)){
			gameState.spawnCounter = 0;
			let newSharks = [SlowingWallEnemy2, WallEnemy2, SlowingStrongLaserShooter,SlowingWeakLaserShooter,SlipperyWallEnemy,LaserShooter, FastShark,WeakLaserShooter,StrongLaserShooter,WallEnemy,ShieldEnemy,WallShark,Charger]
			let choice = Math.floor(Math.random()*newSharks.length)
			let newShark = new newSharks[choice]()		
			if (newShark) {
				gameState.sharks.push(newShark);
				gameState.curWaveEnemies++;
			}
		}
	}
	
	// SHARK UPDATING
	for (let s = 0; s<gameState.sharks.length;s++){
		if (gameState.sharks[s].pos[0] === Infinity){
			gameState.sharks.splice(s,1)
			s--;
			continue;
		}
		let shark = gameState.sharks[s];
		let cols = (bod) => collides(gameState.snakePos,bod);
		let kols = shark.bod.map(cols);
		if (shark.bod.some(cols) && (!shark.wall || shark.dead)){
			gameState.appleGet = 1;
			if (shark.bod[kols.indexOf(true)] === shark.pos || shark.bod[kols.indexOf(true)] === shark.bod[shark.bod.length-2] && !shark.ranged){
				shark.dead = true;
				explodeSound.stop();
				explodeSound.play()
				gameState.appleGet = Math.ceil(shark.bod.length/2);
				for (let b = 0; b < shark.bod.length; b++){
					gameState.particleList.push(new Particles(shark.bod[b][0],shark.bod[b][1],PARTICLEVEL/2,RED2,PARTICLESIZE))
				}
				shark.bod = [];
				shark.targetLen = 0;
			}
			if (!shark.dead){
				playerEatSound.stop();
				playerEatSound.play()
				shark.targetLen = shark.bod.length-1;
			} else {
				deadEatSound.stop();
				deadEatSound.play();
			}
			if (shark.color !== LIGHTGRAY) {gameState.colorList.push(shark.color);}
			gameState.particleList.push(new Particles(gameState.snakePos[0],gameState.snakePos[1],PARTICLEVEL/2,RED2,PARTICLESIZE/2.0))
			gameState.entities.push(new ExcitingText(gameState.snakePos[0],gameState.snakePos[1],gameState.appleGet,GOODGREEN))
			gameState.Cam.shakeAmp = CAMERASHAKE
			gameState.sharks[s].targetLen -= 1;
			gameState.sharks[s].bod.splice(kols.indexOf(true),1)
		} else if (shark.wall && collides(gameState.snakePos,shark.bod[shark.bod.length-1]) && !shark.dead){
			shark.dead = true;
			explodeSound.stop();
			explodeSound.play();
			gameState.appleGet = Math.ceil(shark.bod.length/2);
			for (let b = 0; b < shark.bod.length; b++){
				gameState.particleList.push(new Particles(shark.bod[b][0],shark.bod[b][1],PARTICLEVEL/2,RED2,PARTICLESIZE))
				gameState.colorList.push(COLORCHOICES[Math.floor(Math.random()*COLORCHOICES.length)]);
			}
			shark.bod = [];
			shark.targetLen = 0;
			gameState.particleList.push(new Particles(gameState.snakePos[0],gameState.snakePos[1],PARTICLEVEL/2,RED2,PARTICLESIZE/2.0))
			gameState.entities.push(new ExcitingText(gameState.snakePos[0],gameState.snakePos[1],gameState.appleGet,GOODGREEN))
			gameState.Cam.shakeAmp = CAMERASHAKE
			gameState.sharks[s].bod.splice(kols.indexOf(true),1)
		}
		if (shark.dead && shark.bod.length <= 0){
			gameState.sharks.splice(s,1);
		}
	}
	
	for (let s in gameState.sharks){
		let shark = gameState.sharks[s];
		if (!gameState.hurt){
			gameState.hurt = shark.update(gameState.snakeList,gameState.colorList,gameState.particleList,gameState.Cam,gameState.appleGet,gameState.sharks,dt)
			if (gameState.hurt){
				gameState.hurtCounter = 1/6;
			}
		} else {
			shark.update(gameState.snakeList,gameState.colorList,gameState.particleList,gameState.Cam,gameState.appleGet,gameState.sharks,dt)
		}
	}
	
	while (gameState.snakeList.length > gameState.colorList.length){
		gameState.colorList.push(gameState.colorList[gameState.colorList.length-1])
	}
	gameState.colorList[0] = WHITE;
	
	if (gameState.score > 1 && !gameState.dead) {gameState.scoreTime += Math.floor(gameState.score*10) / 100}
	
	gameState.Cam.update(dt);
	ctx.fillStyle = BLACK;
	ctx.clearRect(0,0,canvas.width,canvas.height);
	ctx.fillRect(0,0,canvas.width,canvas.height);
	ctx.font = "150px Free Sans Bold";
	ctx.fillStyle = KINDA_BLACK;
	canvas.textAlign = "center";
	ctx.fillText(Math.floor(gameState.score),canvas.width/2-150/4,canvas.height/2+150/4)
	ctx.font = "40px Free Sans Bold";
	canvas.textAlign = "left";
	ctx.fillStyle = LIGHTGRAY;
	if (gameState.levels){
		ctx.fillText("Wave: " + gameState.currentWave,20,50)
	} else if (gameState.survival) {
		if (gameState.scoreTime > gameState.highscore) {
			gameState.highscore = gameState.scoreTime
			setCookie('highscore', gameState.highscore)
		}
		ctx.fillText('Score: ' + Math.floor(gameState.scoreTime*100)/100,20,50)
		ctx.fillText('Highscore: ' + Math.floor(gameState.highscore*100)/100, 20, 95)
	}
	let sumPart = 0;
	for (let p = 0; p < gameState.particleList.length; p++){
		gameState.particleList[p].update(dt)
		if (gameState.particleList[p].lifetimeCounter > gameState.particleList[p].lifetime){
			gameState.particleList.splice(p,1);
			p--;
		} else sumPart += gameState.particleList[p].particles.length;
		if (sumPart > MAX_SCREEN_PARTICLES && !gameState.dead){
			gameState.particleList.shift();
		}
	}
	
	for (let s in gameState.sharks){
		gameState.sharks[s].draw(gameState.Cam.pos);
	}
	
	for (let k = 0; k < gameState.apples.length; k++){
		gameState.apples[k].draw(gameState.snakePos);
	}
	if (gameState.hurt && gameState.hurtCounter < -0.1){
		gameState.hurt = false;
	}
	gameState.hurtCounter -= dt;
	if (!gameState.dead){
		for (let b = 0; b < gameState.snakeList.length; b++){
			gameState.Cam.draw(gameState.snakeList[b],gameState.colorList[gameState.snakeList.length-1-gameState.snakeList.indexOf(gameState.snakeList[b])]) // the python code is more concise for this. all this does is matches the elements in the colorlist with those in the snakelist.
			if (gameState.hurtCounter > 0){
				gameState.Cam.draw(gameState.snakeList[b],'rgba(255,255,255,190)');
			}
		}
	}
	for (let k = 0; k < gameState.entities.length; k++){
		gameState.entities[k].update(gameState.entities);
		if (gameState.entities[k]){
			gameState.entities[k].draw();
			if (gameState.entities[k].dead){
				gameState.entities.splice(k,1);
				k-=1;
			}
		}
	}
	
	if (!gameState.paused){
		gameState.nextFrame = window.setTimeout(play,25)
		//window.requestAnimationFrame(play)
	} else {
		ctx.font = '40px Free Sans Bold'
		ctx.fillStyle = LIGHTGRAY
		ctx.fillText('press ESC to resume, P to go back to menu',canvas.width/2-400, canvas.height/2)
		ctx.fillText('M to mute',canvas.width/2-400, canvas.height/2+45)
	}
}

mainMenu();