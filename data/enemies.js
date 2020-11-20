class Shark {
	constructor(){
		this.pos = getApplePos();
		this.bod = [this.pos];
		this.dir = [UP,DOWN,LEFT,RIGHT][Math.floor(Math.random()*4)];
		this.targetLen = 5;
		this.target = [0,0];
		this.color = COLORCHOICES[Math.floor(Math.random()*COLORCHOICES.length)];
		this.dead = 0;
		this.fast = false;
		this.activated = false; // maybe add an activation mechanic once you get close to them, they look like apples unactivated?
		this.moveFreq = 6;
		this.moveCounter = 0;
	}
	update(playerBod,colList,particleList,cam,appleGet,sharkList,dt){
		this.moveCounter++;
		let hit = false;
		let newappleGet = appleGet;
		if (playerBod.indexOf(this.target) === -1){
			this.getTarget(playerBod);
		}
		if (this.targetLen <= 2){
			this.dead = true;
		}
		if (!this.dead && this.moveCounter % this.moveFreq === 0){
			let colIndex = -1;
			for (let i = 0; i < playerBod.length; i++){
				if (collides(playerBod[i],this.pos)){
					colIndex=i;
				}
			}
			if (colIndex!==-1){
				let pcol = colList.splice(colIndex,1);
				playerBod.splice(colIndex,1)
				particleList.push(new Particles(this.pos[0],this.pos[1],PARTICLEVEL,pcol,PARTICLESIZE));
				eatSound.stop();
				eatSound.play();
				hit = true;
				this.targetLen += 1;
				gameState.entities.push(new ExcitingText(this.pos[0],this.pos[1],-1,BADRED));
				cam.shakeAmp = CAMERASHAKE;
			}
			this.decideMove();
			if (this.dir === RIGHT){
				this.pos = [this.pos[0]+BLOCKSIZE,this.pos[1]];
				if (this.pos[0]>canvas.width-BLOCKSIZE){
					this.pos = [0,this.pos[1]];
				}
			}
			if (this.dir === UP){
				this.pos = [this.pos[0],this.pos[1]-BLOCKSIZE];
				if (this.pos[1]<0){
					this.pos = [this.pos[0],canvas.height - BLOCKSIZE];
				}
			}
			if (this.dir === LEFT){
				this.pos = [this.pos[0]-BLOCKSIZE,this.pos[1]];
				if (this.pos[0]<0){
					this.pos = [canvas.width-BLOCKSIZE,this.pos[1]];
				}
			}
			if (this.dir === DOWN){
				this.pos = [this.pos[0],this.pos[1]+BLOCKSIZE];
				if (this.pos[1]>canvas.height-BLOCKSIZE){
					this.pos = [this.pos[0],0];
				}
			}
			this.bod.push(this.pos);
			if (this.bod.length > this.targetLen){
				this.bod.shift();
			}
		}
		return this.extraUpdate(playerBod,colList,particleList,cam,appleGet,sharkList,dt) || hit;
	}
	decideMove(){
		let options = [];
		if (!this.target || !this.target[0]) return;
		if (this.target[0] < this.pos[0] && this.dir!==RIGHT){
			options.push(LEFT)
		}
		if (this.target[0] > this.pos[0] && this.dir!==LEFT){
			options.push(RIGHT)
		}
		if (this.target[1] < this.pos[1] && this.dir!==DOWN){
			options.push(UP)
		}
		if (this.target[1] > this.pos[1] && this.dir!== UP){
			options.push(DOWN)
		}
		if (options.length > 0){
			this.dir = options[Math.floor(Math.random()*options.length)];
		} else {
			this.dir = [LEFT,RIGHT,UP,DOWN][Math.floor(Math.random()*options.length)];
		}
	}
	getTarget(playerBod){
		let closest = [Infinity, null];
		for (let b in playerBod){
			let pos = playerBod[b];
			let mag = (pos[0]-this.pos[0])**2 + (pos[1]-this.pos[1])**2;
			if (mag < closest[0]){
				closest = [mag,pos];
			}
		}
		this.target = closest[1];
	}
	draw(campos){
		for (let b = 0; b < this.bod.length;b++){
			ctx.fillStyle = this.color;
			if (b === this.bod.length-1 && !this.dead){
				ctx.fillStyle = BRAINRED;
			}
			if (this.dead){
				ctx.fillStyle = WHITE2;
			}
			ctx.fillRect(this.bod[b][0]-campos[0],this.bod[b][1]-campos[1],BLOCKSIZE-EDGESIZE,BLOCKSIZE-EDGESIZE);
			ctx.strokeStyle = 'rgba(255,0,0,0.2)';
			ctx.lineWidth = 3;
			//ctx.strokeRect(this.bod[b][0]-campos[0],this.bod[b][1]-campos[1],BLOCKSIZE-EDGESIZE,BLOCKSIZE-EDGESIZE)
		}
	}
	extraUpdate(){
		return;
	}
}

class FastShark extends Shark {
	constructor(){
		super();
		this.fast = true;
		this.isFastShark = true
		this.targetLen = 6;
		this.moveFreq = 1; // should be 2
		this.dir = [UP,DOWN,LEFT,RIGHT][Math.floor(Math.random()*4)];
	}
	decideMove(){
		return;
	}
}

class SplitterShark extends Shark {
	constructor(){
		super();
		this.targetLen = 12;
		this.splitter = true;
		this.splitAlready = false;
		this.splitColor = this.color;
		while (this.splitColor === this.color) this.splitColor = COLORCHOICES[Math.floor(Math.random()*COLORCHOICES.length)];
	}
	draw(campos){
		for (let b = 0; b < this.bod.length;b++){
			ctx.fillStyle = this.color;
			if (b < this.bod.length/2){
				ctx.fillStyle = this.splitColor;
			}
			if (b === this.bod.length-1 && !this.dead){
				ctx.fillStyle = BRAINRED;
			}
			if (this.dead){
				ctx.fillStyle = WHITE2;
			}
			ctx.fillRect(this.bod[b][0]-campos[0],this.bod[b][1]-campos[1],BLOCKSIZE-EDGESIZE,BLOCKSIZE-EDGESIZE);
			ctx.strokeStyle = 'rgba(255,0,0,0.2)';
			ctx.lineWidth = 3;
			//ctx.strokeRect(this.bod[b][0]-campos[0],this.bod[b][1]-campos[1],BLOCKSIZE-EDGESIZE,BLOCKSIZE-EDGESIZE)
		}
	}
}

class WeakLaserShooter {
	constructor(){
		this.color = COLORCHOICES[Math.floor(Math.random()*COLORCHOICES.length)];
		this.pos = getApplePos();
		this.bod = [[this.pos[0]+BLOCKSIZE,this.pos[1]],[this.pos[0],this.pos[1]+BLOCKSIZE],[this.pos[0]-BLOCKSIZE,this.pos[1]],[this.pos[0],this.pos[1]-BLOCKSIZE],this.pos];
		this.fast = true;
		this.shootCounter = 0;
		this.shootDelay = 1.5;
		this.dead = false;
		this.drawLaserAmount = 8/60;
		this.drawLaserCounter = 0;
		this.shot = [];
		this.ranged = true;
	}
	update(playerBod,colList,particleList,cam,appleGet,sharkList,dt){
		let hit = false;
		if (!this.dead){
			this.drawLaserCounter -= dt;
			this.shootCounter+=dt;
			if (this.shootCounter > this.shootDelay){
				this.shootCounter = 0;
				let target = Math.floor(Math.random()*(playerBod.length-1))
				let blockRemoved = playerBod.splice(target,1);
				if (blockRemoved[0]){
					particleList.push(new Particles(blockRemoved[0][0],blockRemoved[0][1],PARTICLEVEL/2,RED2,PARTICLESIZE));
					gameState.entities.push(new ExcitingText(blockRemoved[0][0],blockRemoved[0][1],-1,BADRED));
					deathSound.stop();
					deathSound.play();
					hit = true;
					cam.shakeAmp = CAMERASHAKE;
					this.drawLaserCounter = this.drawLaserAmount;
					this.shot = blockRemoved[0];
				}
			}
		}
		return hit
	}
	draw(campos){
		for (let b = 0; b < this.bod.length;b++){
			if (this.drawLaserCounter > 0 && !this.dead){
				ctx.strokeStyle = WHITE
				ctx.lineWidth = 3;
				ctx.beginPath();
				ctx.moveTo(this.pos[0]+BLOCKSIZE/2,this.pos[1]+BLOCKSIZE/2);
				ctx.lineTo(this.shot[0],this.shot[1]);
				ctx.stroke();
				ctx.closePath();
			}
			ctx.fillStyle = this.color;
			if (b === this.bod.length-1 && !this.dead){
				ctx.fillStyle = BRAINRED;
			}
			if (this.dead){
				ctx.fillStyle = WHITE2;
			}
			ctx.fillRect(this.bod[b][0]-campos[0],this.bod[b][1]-campos[1],BLOCKSIZE-EDGESIZE,BLOCKSIZE-EDGESIZE);
			ctx.strokeStyle = 'rgba(255,0,0,0.2)';
			ctx.lineWidth = 3;
			//ctx.strokeRect(this.bod[b][0]-campos[0],this.bod[b][1]-campos[1],BLOCKSIZE-EDGESIZE,BLOCKSIZE-EDGESIZE);
		}
	}
}

class SlowingWeakLaserShooter extends WeakLaserShooter {
	constructor(){
		super();
		let newApple = new SlowApple(this.pos);
		newApple.color = BRAINRED;
		gameState.apples.push(newApple)
	}
}

class StrongLaserShooter {
	constructor(){
		this.color = COLORCHOICES[Math.floor(Math.random()*COLORCHOICES.length)];
		this.pos = getApplePos();;
		this.bod = [[this.pos[0]+BLOCKSIZE,this.pos[1]],[this.pos[0]+2*BLOCKSIZE,this.pos[1]],[this.pos[0],this.pos[1]+BLOCKSIZE],[this.pos[0],this.pos[1]+2*BLOCKSIZE],[this.pos[0]-BLOCKSIZE,this.pos[1]],[this.pos[0]-2*BLOCKSIZE,this.pos[1]],[this.pos[0],this.pos[1]-BLOCKSIZE],[this.pos[0],this.pos[1]-2*BLOCKSIZE],this.pos];
		this.fast = true;
		this.shootCounter = 0;
		this.shootDelay = 1.5;
		this.dead = false;
		this.drawLaserAmount = 8/60;
		this.drawLaserCounter = 0;
		this.targetDir = 0;
		this.dirIndex = 0;
		this.dirs = [UP,LEFT,DOWN,RIGHT]
		this.ranged = true;
	}
	update(playerBod,colList,particleList,cam,appleGet,sharkList,dt){
		let hit = false;
		if (!this.dead){
			this.drawLaserCounter -= dt;
			if (this.bod.length < 9){
				let headCount = {
					right:0,
					left:0,
					down:0,
					up:0
				};
				for (let b = 0; b < this.bod.length;b++){
					if (this.bod[b][0]>this.pos[0]){
						headCount.right+=1;
					}
					if (this.bod[b][1]>this.pos[1]){
						headCount.down +=1;
					}
					if (this.bod[b][0]<this.pos[0]){
						headCount.left += 1;
					}
					if (this.bod[b][1]<this.pos[1]){
						headCount.up +=1;
					}
				}
				if (headCount.right < 2 && this.dirs.indexOf(RIGHT) !== -1){
					this.dirs.splice(this.dirs.indexOf(RIGHT),1);
				}
				if (headCount.up < 2 && this.dirs.indexOf(UP) !== -1){
					this.dirs.splice(this.dirs.indexOf(UP),1);
				}
				if (headCount.left < 2&& this.dirs.indexOf(LEFT) !== -1){
					this.dirs.splice(this.dirs.indexOf(LEFT),1);
				}
				if (headCount.down < 2 && this.dirs.indexOf(DOWN) !== -1){
					this.dirs.splice(this.dirs.indexOf(DOWN),1);
				}
			}
			this.shootCounter+=dt;
			if (this.shootCounter > this.shootDelay*2/3 && !this.switched){
				this.switched = true;
				//laserCharge.stop();
				//laserCharge.play();
				this.dirIndex = (this.dirIndex + 1) % this.dirs.length;
				this.targetDir = this.dirs[this.dirIndex]
			}
			if (this.shootCounter > this.shootDelay){
				this.shootCounter = 0;
				this.switched = false;
				let blocksRemoved = [];
				for (let b = 0; b < playerBod.length; b++){
					let bodpos = playerBod[b];
					if (this.targetDir === UP && bodpos[0] === this.pos[0] && bodpos[1] < this.pos[1]){
						blocksRemoved.push(bodpos);
						playerBod.splice(b,1);
						b-=1;
					}
					else if (this.targetDir === DOWN && bodpos[0] === this.pos[0] && bodpos[1] > this.pos[1]){
						blocksRemoved.push(bodpos);
						playerBod.splice(b,1);
						b-=1;
					}
					else if (this.targetDir === RIGHT && bodpos[1] === this.pos[1] && bodpos[0] > this.pos[0]){
						blocksRemoved.push(bodpos);
						playerBod.splice(b,1);
						b-=1;
					}
					else if (this.targetDir === LEFT && bodpos[1] === this.pos[1] && bodpos[0] < this.pos[0]){
						blocksRemoved.push(bodpos);
						playerBod.splice(b,1);
						b-=1;
					}
				}
				
				for (let b = 0; b < blocksRemoved.length;b++){
					particleList.push(new Particles(blocksRemoved[b][0],blocksRemoved[b][1],PARTICLEVEL/2,RED2,PARTICLESIZE));
					gameState.entities.push(new ExcitingText(blocksRemoved[b][0],blocksRemoved[b][1],-1,BADRED));
				}
				if (blocksRemoved.length > 0){
					deathSound.stop();
					deathSound.play();
					hit = true;
					cam.shakeAmp = CAMERASHAKE;
				}
				this.drawLaserCounter = this.drawLaserAmount;
				laserShot.stop();
				laserShot.play();
			}
		}
		return hit
	}
	draw(campos){
		for (let b = 0; b < this.bod.length;b++){
			if (!this.dead){	
				if (this.drawLaserCounter > 0 || this.switched ){
					if (this.drawLaserCounter > 0){
						ctx.lineWidth = 5;
						ctx.strokeStyle = 'rgba(255,0,0,0.5)'
					} else {
						ctx.lineWidth = 3;
						ctx.strokeStyle = 'rgba(255,0,0,0.1)'
					}
					ctx.beginPath();
					ctx.moveTo(this.pos[0]+BLOCKSIZE/2,this.pos[1]+BLOCKSIZE/2);
					if (this.targetDir === UP){
						ctx.lineTo(this.pos[0]+BLOCKSIZE/2,0);
					}
					if (this.targetDir === DOWN){
						ctx.lineTo(this.pos[0]+BLOCKSIZE/2,canvas.height)
					}
					if (this.targetDir === LEFT){
						ctx.lineTo(0,this.pos[1]+BLOCKSIZE/2)
					}
					if (this.targetDir===RIGHT){
						ctx.lineTo(canvas.width,this.pos[1]+BLOCKSIZE/2)
					}
					ctx.stroke();
					ctx.closePath();
				}
			}
			ctx.fillStyle = this.color;
			if (b === this.bod.length-1 && !this.dead){
				ctx.fillStyle = BRAINRED;
			}
			// 0:UP 1:LEFT 2:DOWN 3:RIGHT
			if (this.targetDir===UP && this.bod[b][1] < this.pos[1] || this.targetDir===DOWN && this.bod[b][1] > this.pos[1] || this.targetDir ===  LEFT && this.bod[b][0] < this.pos[0] || this.targetDir === RIGHT && this.bod[b][0] > this.pos[0]){
				ctx.fillStyle = RED;
			}
			if (this.dead){
				ctx.fillStyle = WHITE2;
			}
			ctx.fillRect(this.bod[b][0]-campos[0],this.bod[b][1]-campos[1],BLOCKSIZE-EDGESIZE,BLOCKSIZE-EDGESIZE);
			ctx.lineWidth = 3;
			ctx.strokeStyle = 'rgba(255,0,0,0.2)';
			//ctx.strokeRect(this.bod[b][0]-campos[0],this.bod[b][1]-campos[1],BLOCKSIZE-EDGESIZE,BLOCKSIZE-EDGESIZE);
		}
	}
}

class SlowingStrongLaserShooter extends StrongLaserShooter{
	constructor(){
		super();
		let newApple = new SlowApple(this.pos);
		newApple.color = BRAINRED;
		gameState.apples.push(newApple)
	}
}

class LaserShooter extends StrongLaserShooter { // shoots 4 lasers in the basic directions every time, also moves after each shot
	constructor(){
		super();
		this.bod = [
			[this.pos[0]+BLOCKSIZE,this.pos[1]],
			[this.pos[0]+BLOCKSIZE,this.pos[1]+BLOCKSIZE],
			[this.pos[0]+BLOCKSIZE,this.pos[1]-BLOCKSIZE],
			[this.pos[0]-BLOCKSIZE,this.pos[1]+BLOCKSIZE],
			[this.pos[0]-BLOCKSIZE,this.pos[1]],
			[this.pos[0]-BLOCKSIZE,this.pos[1]-BLOCKSIZE],
			[this.pos[0],this.pos[1]-BLOCKSIZE],
			[this.pos[0],this.pos[1]+BLOCKSIZE],
			this.pos
		];
	}
	update(playerBod,colList,particleList,cam,appleGet,sharkList,dt){
		let hit = false;
		if (!this.dead){
			this.drawLaserCounter -= dt;
			this.shootCounter+=dt;
			if (this.shootCounter > this.shootDelay*2/3 && !this.switched){
				this.switched = true;
				this.dirIndex = (this.dirIndex + 1) % this.dirs.length;
				this.targetDir = this.dirs[this.dirIndex]
			}
			if (this.shootCounter > this.shootDelay){
				let newpos = [this.pos[0],this.pos[1]];
				if (this.dirs[this.dirIndex] === RIGHT){
					newpos[0]+= BLOCKSIZE;
				}
				if (this.dirs[this.dirIndex] === LEFT){
					newpos[0]-=BLOCKSIZE;
				}
				if (this.dirs[this.dirIndex] === DOWN){
					newpos[1]+=BLOCKSIZE;
				}
				if (this.dirs[this.dirIndex] === UP){
					newpos[1]-=BLOCKSIZE;
				}
				newpos[0] = (newpos[0]+canvas.width)%canvas.width;
				newpos[1] = (newpos[1]+canvas.height)%canvas.height;
				for (let b = 0; b < this.bod.length; b++) {
					this.bod[b][0] = (this.bod[b][0] + newpos[0] - this.pos[0] + canvas.width)%canvas.width;
					this.bod[b][1] = (this.bod[b][1] + newpos[1] - this.pos[1] + canvas.height)%canvas.height;
				}
				this.pos = this.bod[this.bod.length-1]
				this.shootCounter = 0;
				this.switched = false;
				let blocksRemoved = [];
				let closest = {right: null, left:null, up: null, down: null, rightIndex: null, leftIndex: null, upIndex: null, downIndex: null}
				for (let b = 0; b < playerBod.length; b++){
					let bodpos = playerBod[b];
					if (bodpos[0] === this.pos[0] && bodpos[1] < this.pos[1] && (!closest.up || bodpos[1] > closest.up[1])){
						closest.up = bodpos;
						closest.upIndex = b;
					}
					else if (bodpos[0] === this.pos[0] && bodpos[1] > this.pos[1] && (!closest.down || bodpos[1] < closest.down[1])){
						closest.down = bodpos;
						closest.downIndex = b;
					}
					else if (bodpos[1] === this.pos[1] && bodpos[0] > this.pos[0] && (!closest.right || bodpos[0] < closest.right[0])){
						closest.right = bodpos;
						closest.rightIndex = b;
					}
					else if (bodpos[1] === this.pos[1] && bodpos[0] < this.pos[0] && (!closest.left || bodpos[0] > closest.left[0])){
						closest.left = bodpos;
						closest.leftIndex = b;
					}
				}
				if (closest.right){
					blocksRemoved.push(closest.right);
					playerBod.splice(closest.rightIndex,1)
					closest.leftIndex--;
					closest.upIndex--;
					closest.downIndex--;
				}
				if (closest.left){
					blocksRemoved.push(closest.left);
					playerBod.splice(closest.leftIndex,1);
					closest.downIndex--;
					closest.upIndex--;
				}
				if (closest.down){
					blocksRemoved.push(closest.down);
					playerBod.splice(closest.downIndex,1);
					closest.upIndex--;
				}
				if (closest.up){
					blocksRemoved.push(closest.up)
					playerBod.splice(closest.upIndex,1);
				}
				
				for (let b = 0; b < blocksRemoved.length;b++){
					particleList.push(new Particles(blocksRemoved[b][0],blocksRemoved[b][1],PARTICLEVEL/2,RED2,PARTICLESIZE));
					gameState.entities.push(new ExcitingText(blocksRemoved[b][0],blocksRemoved[b][1],-1,BADRED));
				}
				if (blocksRemoved.length > 0){
					deathSound.stop();
					deathSound.play();
					hit = true;
					cam.shakeAmp = CAMERASHAKE;
				}
				this.drawLaserCounter = this.drawLaserAmount;
				laserShot.stop();
				laserShot.play();
			}
		}
		return hit
	}
	draw(campos){
		for (let b = 0; b < this.bod.length;b++){
			if (!this.dead){	
				if (this.drawLaserCounter > 0){
					ctx.lineWidth = 3;
					ctx.strokeStyle = 'rgba(255,255,0,0.5)'
					ctx.beginPath();
					ctx.moveTo(this.pos[0]+BLOCKSIZE/2,this.pos[1]+BLOCKSIZE/2);
					ctx.lineTo(this.pos[0]+BLOCKSIZE/2,0);
					ctx.moveTo(this.pos[0]+BLOCKSIZE/2,this.pos[1]+BLOCKSIZE/2);
					ctx.lineTo(this.pos[0]+BLOCKSIZE/2,canvas.height)
					ctx.moveTo(this.pos[0]+BLOCKSIZE/2,this.pos[1]+BLOCKSIZE/2);
					ctx.lineTo(0,this.pos[1]+BLOCKSIZE/2)
					ctx.moveTo(this.pos[0]+BLOCKSIZE/2,this.pos[1]+BLOCKSIZE/2);
					ctx.lineTo(canvas.width,this.pos[1]+BLOCKSIZE/2)
					ctx.stroke();
					ctx.closePath();
				}
			}
			ctx.fillStyle = this.color;
			if (b===this.bod.length-1 && !this.dead){
				ctx.fillStyle = BRAINRED;
			}
			
			if (this.dead){
				ctx.fillStyle = WHITE2;
			}
			ctx.fillRect(this.bod[b][0]-campos[0],this.bod[b][1]-campos[1],BLOCKSIZE-EDGESIZE,BLOCKSIZE-EDGESIZE);
			ctx.lineWidth = 3;
			ctx.strokeStyle = 'rgba(255,0,0,0.2)';
			//ctx.strokeRect(this.bod[b][0]-campos[0],this.bod[b][1]-campos[1],BLOCKSIZE-EDGESIZE,BLOCKSIZE-EDGESIZE);
		}
	}
}

class WallEnemy {
	constructor(){
		this.wall = true;
		this.dead = false;
		this.fast = true;
		this.color = LIGHTGRAY
		this.targetLen = 5;
		
		this.pos = getApplePos();
		if (this.pos[0] > canvas.width-2*BLOCKSIZE){
			this.pos[0] -= 2*BLOCKSIZE;
		}
		if (this.pos[0] < 2*BLOCKSIZE){
			this.pos[0] += 2*BLOCKSIZE;
		}
		if (this.pos[1] > canvas.height - 2*BLOCKSIZE){
			this.pos[1] -= 2*BLOCKSIZE;
		}
		if (this.pos[1] < 2*BLOCKSIZE){
			this.pos[1] += 2*BLOCKSIZE;
		}
		this.orient = Math.floor(Math.random()*2);
		if (this.orient === 0) { // horizontal orientation
			this.bod = [
				[this.pos[0]+BLOCKSIZE,this.pos[1]],
				[this.pos[0]+2*BLOCKSIZE,this.pos[1]],
				[this.pos[0]-BLOCKSIZE,this.pos[1]],
				[this.pos[0]-2*BLOCKSIZE,this.pos[1]],
				[this.pos[0],this.pos[1]]
			];
		} else { // vertical orientation
			this.bod = [
				[this.pos[0],this.pos[1]+BLOCKSIZE],
				[this.pos[0],this.pos[1]+2*BLOCKSIZE],
				[this.pos[0],this.pos[1]-BLOCKSIZE],
				[this.pos[0],this.pos[1]-2*BLOCKSIZE],
				[this.pos[0],this.pos[1]]
			];
		}
	}
	update(playerBod,colList,particleList,cam,appleGet,sharkList,dt){
		let hit = false;
		let newappleGet = appleGet;
		
		if (this.targetLen <= 2){
			this.dead = true;
		}
		if (!this.dead && playerBod[playerBod.length-1]){
			let colIndex = -1;
			for (let i = 0; i < this.bod.length; i++){
				if (collides(playerBod[playerBod.length-1],this.bod[i])){
					colIndex=i;
				}
			}
			if (colIndex!==-1){
				let pcol = colList.pop();
				particleList.push(new Particles(playerBod[playerBod.length-1][0],playerBod[playerBod.length-1][1],PARTICLEVEL,pcol,PARTICLESIZE));
				eatSound.stop();
				eatSound.play();
				hit = true;
				gameState.entities.push(new ExcitingText(this.pos[0],this.pos[1],-1,BADRED));
				cam.shakeAmp = CAMERASHAKE;
				playerBod.pop()
				if (gameState.snakeList.length > 1){
					let head = gameState.snakeList[gameState.snakeList.length-1];
					let neck = gameState.snakeList[gameState.snakeList.length-2];
					if (head[1] === neck[1]){
						if (head[0] > neck[0]){
							gameState.lastDirection = RIGHT;
						} else {gameState.lastDirection = LEFT;}
					} else if (head[0]===neck[0]){
						if (head[1] > neck[1]){
							gameState.lastDirection = DOWN;
						} else {gameState.lastDirection = UP;}
					}
				}
			}
		}
		return hit;
	}
	draw(campos){
		for (let b = 0; b < this.bod.length;b++){
			ctx.fillStyle = this.color;
			if (b === this.bod.length-1 && !this.dead){
				ctx.fillStyle = BRAINRED;
				ctx.strokeStyle = 'rgba(255,0,0,0.2)';
			} else {
				ctx.strokeStyle = 'rgba(0,0,0,0)'
			}
			if (this.dead){
				ctx.fillStyle = WHITE2;
				ctx.strokeStyle = 'rgba(255,0,0,0.2)';
			}
			ctx.fillRect(this.bod[b][0]-campos[0],this.bod[b][1]-campos[1],BLOCKSIZE-EDGESIZE,BLOCKSIZE-EDGESIZE);
			//ctx.lineWidth = 3;
			//ctx.strokeRect(this.bod[b][0]-campos[0],this.bod[b][1]-campos[1],BLOCKSIZE-EDGESIZE,BLOCKSIZE-EDGESIZE)
		}
	}
}

class SlipperyWallEnemy extends WallEnemy {
	constructor(){
		super();
		let newApple = new FastApple(this.pos);
		newApple.color = BRAINRED
		gameState.apples.push(newApple)
	}
}

class WallEnemy2 extends WallEnemy {
	constructor(){
		super();
		for (let s = 0; s < gameState.sharks.length; s++){
			let shark = gameState.sharks[s];
			if (shark.wall === true && (Math.abs(shark.pos[0] - this.pos[0]) < BLOCKSIZE*3 || Math.abs(shark.pos[1] - this.pos[1] < BLOCKSIZE*3))){
				this.pos = [Infinity,Infinity];
			}
		}
		let vo = Math.random() > 0.50 ? -1 : 1; // vertical orientation
		let ho = Math.random() > 0.50 ? -1 : 1; // horizontal orientation
		this.vo = vo; this.ho = ho;
		this.bod = [
			[this.pos[0] + BLOCKSIZE*2*ho, this.pos[1]],
			[this.pos[0] + BLOCKSIZE*2*ho, this.pos[1] + BLOCKSIZE*vo],
			[this.pos[0] + BLOCKSIZE*2*ho, this.pos[1] + BLOCKSIZE*2*vo],
			[this.pos[0] + BLOCKSIZE*ho, this.pos[1] + BLOCKSIZE*2*vo],
			[this.pos[0], this.pos[1] + BLOCKSIZE*2*vo],
			[this.pos[0] - BLOCKSIZE*ho, this.pos[1] + BLOCKSIZE*2*vo],
			[this.pos[0] - BLOCKSIZE*2*ho, this.pos[1] + BLOCKSIZE*2*vo],
			[this.pos[0] - BLOCKSIZE*2*ho, this.pos[1] + BLOCKSIZE*vo],
			[this.pos[0] - BLOCKSIZE*2*ho, this.pos[1]],
			[this.pos[0] - BLOCKSIZE*2*ho, this.pos[1] - BLOCKSIZE*vo],
			[this.pos[0] - BLOCKSIZE*2*ho, this.pos[1] - BLOCKSIZE*2*vo],
			[this.pos[0] - BLOCKSIZE*ho, this.pos[1] - BLOCKSIZE*2*vo],
			[this.pos[0], this.pos[1] - BLOCKSIZE*2*vo],
			[this.pos[0] + BLOCKSIZE*ho, this.pos[1] - BLOCKSIZE*2*vo],
			[this.pos[0] + BLOCKSIZE*2*ho, this.pos[1] - BLOCKSIZE*2*vo],
			this.pos
		];
		
	}
}

class SlowingWallEnemy2 extends WallEnemy2 {
	constructor(){
		super();
		let newApple = new SlowApple(this.pos);
		newApple.color = BRAINRED;
		gameState.apples.push(newApple);
	}
}

class ShieldEnemy extends WallEnemy {
	constructor(){
		super();
		this.xvel = 0;
		this.yvel = 0;
		this.bod = [];
		if (this.orient === 0){ // horizontal orientation
			if (Math.floor(Math.random()*2) < 1){ // point it down 50% of the time
				this.yvel = 1;
				this.bod = [
					[this.pos[0]+BLOCKSIZE,this.pos[1]],
					[this.pos[0]+2*BLOCKSIZE,this.pos[1]-BLOCKSIZE],
					[this.pos[0]-BLOCKSIZE,this.pos[1]],
					[this.pos[0]-2*BLOCKSIZE,this.pos[1]-BLOCKSIZE],
					[this.pos[0],this.pos[1]+BLOCKSIZE],
					[this.pos[0],this.pos[1]]
				];
					
			} else { // point it up
				this.yvel = -1;
				this.bod = [
					[this.pos[0]+BLOCKSIZE,this.pos[1]],
					[this.pos[0]+2*BLOCKSIZE,this.pos[1]+BLOCKSIZE],
					[this.pos[0]-BLOCKSIZE,this.pos[1]],
					[this.pos[0]-2*BLOCKSIZE,this.pos[1]+BLOCKSIZE],
					[this.pos[0],this.pos[1]-BLOCKSIZE],
					[this.pos[0],this.pos[1]]
				];
			}
		} else { // vertical orientation
			if (Math.floor(Math.random()*2) < 1){ // point it left 50% of the time
				this.xvel = -1;
				this.bod = [
					[this.pos[0],this.pos[1]+BLOCKSIZE],
					[this.pos[0]+BLOCKSIZE,this.pos[1]+2*BLOCKSIZE],
					[this.pos[0],this.pos[1]-BLOCKSIZE],
					[this.pos[0]+BLOCKSIZE,this.pos[1]-2*BLOCKSIZE],
					[this.pos[0]-BLOCKSIZE,this.pos[1]],
					[this.pos[0],this.pos[1]]
				];
			} else { // point it right
				this.xvel = 1;
				this.bod = [
					[this.pos[0],this.pos[1]+BLOCKSIZE],
					[this.pos[0]-BLOCKSIZE,this.pos[1]+2*BLOCKSIZE],
					[this.pos[0],this.pos[1]-BLOCKSIZE],
					[this.pos[0]-BLOCKSIZE,this.pos[1]-2*BLOCKSIZE],
					[this.pos[0]+BLOCKSIZE,this.pos[1]],
					[this.pos[0],this.pos[1]]
				];
			}
		}
		this.moveFreq = 10;
		this.moveCounter = 0;

	}
	update(playerBod,colList,particleList,cam,appleGet,sharkList,dt){
		let hit = false;
		let newappleGet = appleGet;
		
		if (this.targetLen <= 2){
			this.dead = true;
		}
		if (!this.dead && playerBod[playerBod.length-1]){
			let colIndex = -1;
			for (let i = 0; i < this.bod.length; i++){
				if (collides(playerBod[playerBod.length-1],this.bod[i])){
					colIndex=i;
				}
			}
			if (colIndex!==-1){
				let pcol = colList.pop();
				particleList.push(new Particles(playerBod[playerBod.length-1][0],playerBod[playerBod.length-1][1],PARTICLEVEL,pcol,PARTICLESIZE));
				eatSound.stop();
				eatSound.play();
				hit = true;
				gameState.entities.push(new ExcitingText(this.pos[0],this.pos[1],-1,BADRED));
				cam.shakeAmp = CAMERASHAKE;
				playerBod.pop()
				if (gameState.snakeList.length > 1){
					let head = gameState.snakeList[gameState.snakeList.length-1];
					let neck = gameState.snakeList[gameState.snakeList.length-2];
					if (head[1] === neck[1]){
						if (head[0] > neck[0]){
							gameState.lastDirection = RIGHT;
						} else {gameState.lastDirection = LEFT;}
					} else if (head[0]===neck[0]){
						if (head[1] > neck[1]){
							gameState.lastDirection = DOWN;
						} else {gameState.lastDirection = UP;}
					}
				}
			}
		}
		this.moveCounter++;
		if (!this.dead && playerBod[0] && this.moveCounter % this.moveFreq === 0){
			for (let b = 0; b < this.bod.length;b++){
				this.bod[b][0]+=this.xvel*BLOCKSIZE;
				this.bod[b][1]+=this.yvel*BLOCKSIZE;
				if (this.bod[b][0] >= canvas.width){
					this.bod[b][0] = 0;
				}
				if (this.bod[b][0] < 0){
					this.bod[b][0] = canvas.width-BLOCKSIZE;
				}
				if (this.bod[b][1] >= canvas.height){
					this.bod[b][1] = 0;
				}
				if (this.bod[b][1] < 0){
					this.bod[b][1] = canvas.height - BLOCKSIZE;
				}
				for (let i = 0; i < playerBod.length; i++){
					if (collides(playerBod[i],this.bod[b])){
						let pcol = colList.pop();
						particleList.push(new Particles(playerBod[playerBod.length-1][0],playerBod[playerBod.length-1][1],PARTICLEVEL,pcol,PARTICLESIZE));
						eatSound.stop();
						eatSound.play();
						hit = true;
						gameState.entities.push(new ExcitingText(this.pos[0],this.pos[1],-1,BADRED));
						cam.shakeAmp = CAMERASHAKE;
						playerBod.splice(i,1);
					}
				}
			}
		}
		return hit;
	}
}

class WallShark extends Shark {
	constructor(){
		super()
		this.wall = true;
		this.color = LIGHTGRAY
		this.moveFreq = 15
		this.targetLen = 5;
	}
	extraUpdate(playerBod,colList,particleList,cam,appleGet,sharkList,dt){
		let hit = false;
		if (!this.dead && playerBod[playerBod.length-1]){
			let colIndex = -1;
			for (let i = 0; i < this.bod.length; i++){
				if (collides(playerBod[playerBod.length-1],this.bod[i])){
					colIndex=i;
				}
			}
			if (colIndex!==-1){
				let pcol = colList.pop();
				particleList.push(new Particles(playerBod[playerBod.length-1][0],playerBod[playerBod.length-1][1],PARTICLEVEL,pcol,PARTICLESIZE));
				eatSound.stop();
				eatSound.play();
				hit = true;
				gameState.entities.push(new ExcitingText(this.pos[0],this.pos[1],-1,BADRED));
				cam.shakeAmp = CAMERASHAKE;
				playerBod.pop()
				if (gameState.snakeList.length > 1){
					let head = gameState.snakeList[gameState.snakeList.length-1];
					let neck = gameState.snakeList[gameState.snakeList.length-2];
					if (head[1] === neck[1]){
						if (head[0] > neck[0]){
							gameState.lastDirection = RIGHT;
						} else {gameState.lastDirection = LEFT;}
					} else if (head[0]===neck[0]){
						if (head[1] > neck[1]){
							gameState.lastDirection = DOWN;
						} else {gameState.lastDirection = UP;}
					}
				}
			}
		}
		return hit;
	}
}

class Apple {
	constructor(pos=false){
		if (!pos) this.pos = getApplePos(); else this.pos=pos;
		this.color = COLORCHOICES[Math.floor(Math.random()*COLORCHOICES.length)];
	}
	draw(snakePos){
		ctx.lineWidth = 3;
		gameState.Cam.draw(this.pos,this.color,'rgba(255,255,255,0.1)');
	}
}

class SlowApple extends Apple {
	constructor(pos=false){
		super(pos);
		this.slow = true;
		this.affectBlocks = []
		for (let row = 0; row <= 8; row++){
			for (let col = 0; col <= 8; col++){
				this.affectBlocks.push([(this.pos[0]-BLOCKSIZE*4 + col * BLOCKSIZE + canvas.width)%canvas.width, (this.pos[1]-BLOCKSIZE*4 + row * BLOCKSIZE + canvas.height)%canvas.height])
			}
		}
	}
	draw(snakePos){
		ctx.lineWidth = 3;
		for (let k in this.affectBlocks) {
			gameState.Cam.draw(this.affectBlocks[k],SLOWGREEN);
			if (collides(this.affectBlocks[k],snakePos)){
				gameState.slowAbility = true;
			}
		}
		gameState.Cam.draw(this.pos,this.color,'rgba(255,255,255,0.1)');
	}
}

class FastApple extends Apple {
	constructor(pos=false){
		super(pos);
		this.fast = true;
		this.affectBlocks = []
		for (let row = 0; row <= 8; row++){
			for (let col = 0; col <= 8; col++){
				this.affectBlocks.push([(this.pos[0]-BLOCKSIZE*4 + col * BLOCKSIZE + canvas.width)%canvas.width, (this.pos[1]-BLOCKSIZE*4 + row * BLOCKSIZE + canvas.height)%canvas.height])
			}
		}
	}
	draw(snakePos){
		ctx.lineWidth = 3;
		for (let k in this.affectBlocks) {
			gameState.Cam.draw(this.affectBlocks[k],FASTYELLOW);
			if (collides(this.affectBlocks[k],snakePos)){
				gameState.fastAbility = true;
			}
		}
		gameState.Cam.draw(this.pos,this.color,'rgba(255,255,255,0.1)');
		
	}
}

class Charger extends ShieldEnemy {
	constructor(){
		super();
		this.moveFreq = 1;
		this.moveCounter = 0;
		this.enraged = false;
		this.originalPos = this.pos;
		this.enragedCounter = 0;
		this.spawnActivationTime = 1.5;
		this.spawnActivationCounter = 0;
		
		
		if (this.orient === 0){ // horizontal orientation
			this.maxEnragedCounter = canvas.height/BLOCKSIZE - 1;
			if (this.pos[1] <= canvas.height/2){ // point it down if its on the upper half
				this.yvel = 1;
				this.bod = [
					[this.pos[0]+BLOCKSIZE,this.pos[1]],
					[this.pos[0]+BLOCKSIZE,this.pos[1]+BLOCKSIZE],
					[this.pos[0]-BLOCKSIZE,this.pos[1]+BLOCKSIZE],
					[this.pos[0]-BLOCKSIZE,this.pos[1]],
					[this.pos[0],this.pos[1]+BLOCKSIZE],
					[this.pos[0],this.pos[1]]
				];
				this.orientation = DOWN;
					
			} else { // point it up
				this.yvel = -1;
				this.bod = [
					[this.pos[0]+BLOCKSIZE,this.pos[1]],
					[this.pos[0]+BLOCKSIZE,this.pos[1]-BLOCKSIZE],
					[this.pos[0]-BLOCKSIZE,this.pos[1]],
					[this.pos[0]-BLOCKSIZE,this.pos[1]-BLOCKSIZE],
					[this.pos[0],this.pos[1]-BLOCKSIZE],
					[this.pos[0],this.pos[1]]
				];
				this.orientation = UP;
			}
		} else { // vertical orientation
			this.maxEnragedCounter = canvas.width/BLOCKSIZE - 1;
			if (this.pos[0] > canvas.width/2){ // point it left if its on the right half
				this.xvel = -1;
				this.bod = [
					[this.pos[0],this.pos[1]+BLOCKSIZE],
					[this.pos[0]-BLOCKSIZE,this.pos[1]+BLOCKSIZE],
					[this.pos[0],this.pos[1]-BLOCKSIZE],
					[this.pos[0]-BLOCKSIZE,this.pos[1]-BLOCKSIZE],
					[this.pos[0]-BLOCKSIZE,this.pos[1]],
					[this.pos[0],this.pos[1]]
				];
				this.orientation = LEFT;
			} else { // point it right
				this.xvel = 1;
				this.bod = [
					[this.pos[0],this.pos[1]+BLOCKSIZE],
					[this.pos[0]+BLOCKSIZE,this.pos[1]+BLOCKSIZE],
					[this.pos[0],this.pos[1]-BLOCKSIZE],
					[this.pos[0]+BLOCKSIZE,this.pos[1]-BLOCKSIZE],
					[this.pos[0]+BLOCKSIZE,this.pos[1]],
					[this.pos[0],this.pos[1]]
				];
				this.orientation = RIGHT;
			}
		}
	}
	update(playerBod,colList,particleList,cam,appleGet,sharkList,dt){
		let hit = false;
		let newappleGet = appleGet;
		this.spawnActivationCounter += dt;
		
		if (this.targetLen <= 2){
			this.dead = true;
		}
		if (!this.dead && playerBod[playerBod.length-1]){
			let colIndex = -1;
			for (let i = 0; i < this.bod.length; i++){
				if (collides(playerBod[playerBod.length-1],this.bod[i])){
					colIndex=i;
				}
			}
			if (colIndex!==-1){
				let pcol = colList.pop();
				particleList.push(new Particles(playerBod[playerBod.length-1][0],playerBod[playerBod.length-1][1],PARTICLEVEL,pcol,PARTICLESIZE));
				eatSound.stop();
				eatSound.play();
				hit = true;
				gameState.entities.push(new ExcitingText(this.pos[0],this.pos[1],-1,BADRED));
				cam.shakeAmp = CAMERASHAKE;
				playerBod.pop()
				if (gameState.snakeList.length > 1){
					let head = gameState.snakeList[gameState.snakeList.length-1];
					let neck = gameState.snakeList[gameState.snakeList.length-2];
					if (head[1] === neck[1]){
						if (head[0] > neck[0]){
							gameState.lastDirection = RIGHT;
						} else {gameState.lastDirection = LEFT;}
					} else if (head[0]===neck[0]){
						if (head[1] > neck[1]){
							gameState.lastDirection = DOWN;
						} else {gameState.lastDirection = UP;}
					}
				}
			}
		}
		if (!this.enraged && this.spawnActivationCounter > this.spawnActivationTime){
			for (let k = 0; k < playerBod.length; k++){
				if (this.orientation === RIGHT){
					if (playerBod[k][0] > this.pos[0]+2*BLOCKSIZE && playerBod[k][1] < this.pos[1]+2*BLOCKSIZE && playerBod[k][1] > this.pos[1]-2*BLOCKSIZE){
						this.enraged = true;
					}
				} else if (this.orientation === LEFT){
					if (playerBod[k][0] < this.pos[0]-BLOCKSIZE && playerBod[k][1] < this.pos[1]+2*BLOCKSIZE && playerBod[k][1] > this.pos[1]-2*BLOCKSIZE){
						this.enraged = true;
					}
				} else if (this.orientation === UP){
					if (playerBod[k][1] < this.pos[1]-BLOCKSIZE && playerBod[k][0] < this.pos[0]+2*BLOCKSIZE && playerBod[k][0] > this.pos[0]-2*BLOCKSIZE){
						this.enraged = true;
					}
				} else if (this.orientation === DOWN){
					if (playerBod[k][1] > this.pos[1]+2*BLOCKSIZE && playerBod[k][0] < this.pos[0]+2*BLOCKSIZE && playerBod[k][0] > this.pos[0]-2*BLOCKSIZE){
						this.enraged = true;
					}
				}
			}
		}
		
		this.moveCounter++;
		if (!this.dead && playerBod[0] && this.moveCounter % this.moveFreq === 0 && this.enraged){
			this.enragedCounter++;
			if (this.enragedCounter > this.maxEnragedCounter){
				this.enragedCounter = 0;
				this.enraged = false;
			}
			for (let b = 0; b < this.bod.length;b++){
				this.bod[b][0]+=this.xvel*BLOCKSIZE;
				this.bod[b][1]+=this.yvel*BLOCKSIZE;
				if (this.bod[b][0] >= canvas.width){
					this.bod[b][0] = 0;
				}
				if (this.bod[b][0] < 0){
					this.bod[b][0] = canvas.width-BLOCKSIZE;
				}
				if (this.bod[b][1] >= canvas.height){
					this.bod[b][1] = 0;
				}
				if (this.bod[b][1] < 0){
					this.bod[b][1] = canvas.height - BLOCKSIZE;
				}
				for (let i = 0; i < playerBod.length; i++){
					if (collides(playerBod[i],this.bod[b])){
						let pcol = colList.pop();
						particleList.push(new Particles(playerBod[playerBod.length-1][0],playerBod[playerBod.length-1][1],PARTICLEVEL,pcol,PARTICLESIZE));
						eatSound.stop();
						eatSound.play();
						hit = true;
						gameState.entities.push(new ExcitingText(this.pos[0],this.pos[1],-1,BADRED));
						cam.shakeAmp = CAMERASHAKE;
						playerBod.splice(i,1);
					}
				}
			}
		}
		return hit;
	}
}
/*
	waves = [wave0, wave1, wave 2]
	wave0 = {
		roomLimit: x,
		enemies: [[enemy1,number1],[enemy2,number2]
	}

*/
let level1 = [
	{ // wave 0
		roomLimit: 0,
		enemies: []
	}, 
	{ // wave 1
		roomLimit: 2,
		enemies: [
			['fast', 5]
		]
	},
	{ // wave 2
		roomLimit: 2,
		enemies: [
			['weaklaser', 5]
		]
	},
	{ // wave 3
		roomLimit: 4,
		enemies: [
			['weaklaser', 4],
			['fast',4]
		]
	}, 
	{ // wave 4
		roomLimit: 10,
		enemies: [
			['fast', 15]
		]
	}, 
	{ // wave 5
		roomLimit: 4,
		enemies: [
			['weaklaser', 5],
			['wall', 5]
		]
	},
	{ // wave 6
		roomLimit: 10,
		enemies: [
			['weaklaser', 14]
		]
	}, 
	{ // wave 7
		roomLimit: 2,
		enemies: [
			['wallshark', 2]
		]
	},
	{ // wave 8
		roomLimit: 5,
		enemies: [
			['stronglaser', 5],
			['wall', 3],
			['weaklaser', 5]
		]
	}, 
	{ // wave 9
		roomLimit: 3,
		enemies: [
			['wallshark', 5]
		]
	},
	{ // wave 10
		roomLimit: 5,
		enemies: [
			['stronglaser', 3],
			['shield', 4],
			['weaklaser',3]
		]
	},
	{ // wave 11
		roomLimit: 10,
		enemies: [
			['shield', 12]
		]
	},
]

function spawnEnemy(spawnedSoFar, enemyCount, curWave, waves){
	if (waves[curWave] && enemyCount < waves[curWave].roomLimit && waves[curWave].enemies.length > 0){
		let i = Math.floor(Math.random()*waves[curWave].enemies.length);
		let toSpawn = waves[curWave].enemies[i]
		waves[curWave].enemies[i][1] -= 1;
		if (waves[curWave].enemies[i][1] <= 0){
			waves[curWave].enemies.splice(i,1);
		}
		if (toSpawn[0] === 'fast'){
			return (new FastShark());
		}
		if (toSpawn[0] === 'weaklaser'){
			return (new WeakLaserShooter());
		}
		if (toSpawn[0] === 'wall'){
			return (new WallEnemy());
		}
		if (toSpawn[0] === 'stronglaser'){
			return (new StrongLaserShooter());
		}
		if (toSpawn[0] === 'wallshark'){
			return (new WallShark());
		}
		if (toSpawn[0] === 'shield'){
			return (new ShieldEnemy());
		}
	}
	return;
}