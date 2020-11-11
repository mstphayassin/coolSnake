import pygame,random,math,time
from pygame.locals import *

pygame.init()
SWIDTH = 810
SHEIGHT = 600
screen = pygame.display.set_mode((int(SWIDTH),int(SHEIGHT)))
pygame.display.set_caption("neksa")
fpsClock = pygame.time.Clock()
alphaSurf = screen.convert_alpha()

# constants
WHITE = (205,205,205)
BLACK = (50,50,50)
KINDA_BLACK = (100,100,100)
GREEN = (207,255,179)
ORANGE = (246,189,96)
INDIGO = (108,105,141)
RED = (237,106,90)
BLUE = (175,210,233)

RED2 = (191,49,0,100)
WHITE2 = (219,223,172,200)

BLOCKSIZE = 15
EDGESIZE = -5
PARTICLE_TYPE = 'random' # 'uniform' or 'random'
PARTICLESIZE = int(BLOCKSIZE * 0.3) if PARTICLE_TYPE == 'uniform' else int(BLOCKSIZE*0.5)
PARTICLEMIN = ((BLOCKSIZE-EDGESIZE)**2) / (PARTICLESIZE**2)
PARTICLEMAX = PARTICLEMIN
PARTICLEVEL = PARTICLEMAX/2
CAMERASHAKE = 5
SNAKEGROWTH = 10
FPS_INITIAL = 30
FPS_INCREASE = 0.1
MAX_SCREEN_PARTICLES = 2000

glowImg = pygame.transform.scale(pygame.image.load("data/glow.png"),(int(BLOCKSIZE*1.5),int(BLOCKSIZE*1.5)))
glowImg.convert_alpha()
explodeSound = pygame.mixer.Sound('data/Explosion3.wav'); explodeSound.set_volume(0.3)
deathSound = pygame.mixer.Sound('data/Explosion4.wav'); explodeSound.set_volume(0.7)
highestScoreFont = pygame.font.Font('freesansbold.ttf',150)
scoreFont = pygame.font.Font('freesansbold.ttf',36)
highestScoreText = highestScoreFont.render("0",True,KINDA_BLACK)
scoreText = scoreFont.render("0",True,KINDA_BLACK)
highestScoreRect = highestScoreText.get_rect(); highestScoreRect.center = (SWIDTH/2,SHEIGHT/2)
scoreRect = scoreText.get_rect();scoreRect.midtop = (SWIDTH/2,scoreRect.bottom)
class Camera:
    def __init__(self):
        self.pos = [0,0]
        self.shakeAmp = 0
        self.maxShakeCounter = 30
        self.shakeCounter = 0
    def draw(self,pos,color):
        pygame.draw.rect(alphaSurf,color,pygame.Rect(pos[0]-self.pos[0],pos[1]-self.pos[1],BLOCKSIZE-EDGESIZE,BLOCKSIZE-EDGESIZE))
    def update(self,fps):
        self.maxShakeCounter = fps/4.0
        if self.shakeAmp > 0:
            quakeAmtX = random.random() * self.shakeAmp*2 - self.shakeAmp
            quakeAmtY = random.random() * self.shakeAmp*2 - self.shakeAmp
            self.pos[0] += quakeAmtX
            self.pos[1] += quakeAmtY
            self.shakeCounter += 1
            if self.shakeCounter > self.maxShakeCounter:
                self.shakeCounter = 0
                self.shakeAmp = 0
        else:
            self.pos = [0,0]

class Particle:
    def __init__(self,x,y,spd,color,size=PARTICLESIZE):
        self.pos = [x,y]
        self.xvel = random.random()*spd*2 - spd
        self.yvel = random.random()*spd*2 - spd
        self.color = color
        if PARTICLE_TYPE == 'random':
            self.size = random.random()*size
        elif PARTICLE_TYPE == 'uniform':
            self.size = size
    def update(self,partlist):
        if self.yvel > 0:
            self.yvel -= 0.1
        if self.yvel < 0:
            self.yvel += 0.1
        if self.xvel > 0:
            self.xvel -= 0.1
        if self.xvel < 0:
            self.xvel += 0.1
        if abs(self.yvel)<0.1:
            self.yvel = 0
        if abs(self.xvel)<0.1:
            self.xvel = 0
        self.pos[0] += self.xvel
        self.pos[1] += self.yvel
        if self.pos[1] > SHEIGHT:
            partlist.remove(self)
    def draw(self,campos):
        pygame.draw.rect(alphaSurf,self.color,pygame.Rect(self.pos[0]-campos[0],self.pos[1]-campos[1],self.size,self.size))

class Particles:
    def __init__(self,x,y,spd,color,size=PARTICLESIZE):
        self.particles = []
        self.particleNum = random.randint(PARTICLEMIN,PARTICLEMAX)
        for _i in range(self.particleNum):
            self.particles.append(Particle(x,y,spd,color,size))
    def update(self,partlist,campos):
        for part in self.particles:
            part.update(self.particles)
            part.draw(campos)
        if not self.particles:
            partlist.remove(self)

class Shark:
    def __init__(self,pos,targLen):
        self.pos = pos
        self.bod = [self.pos]
        self.dir = random.choice([UP,DOWN,LEFT,RIGHT])
        self.target = (0,0)
        self.targetLen = targLen
        self.color = random.choice([RED,BLUE,INDIGO,ORANGE,GREEN])
        self.dead = 0
    def update(self,playerBod,colList,particleList,cam,appleGet,sharklist):
        hit = False
        newappleGet = appleGet
        if not self.target in playerBod:
            self.get_target(playerBod)
        if self.pos in playerBod:
            pcol = colList.pop(playerBod.index(self.pos))
            #playerBod.remove(self.pos)
            del playerBod[0]
            particleList.append(Particles(self.pos[0],self.pos[1],PARTICLEVEL,pcol,PARTICLESIZE))
            #explodeSound.play()
            #time.sleep(0.0002)
            hit = True
            self.targetLen += 1
            cam.shakeAmp = CAMERASHAKE
        self.decide_move()
        if self.dir == RIGHT:
            self.pos = (self.pos[0]+BLOCKSIZE,self.pos[1])
            if self.pos[0] > SWIDTH-BLOCKSIZE:
                self.pos = (0,self.pos[1])
        if self.dir == LEFT:
            self.pos = (self.pos[0]-BLOCKSIZE,self.pos[1])
            if self.pos[0] < 0:
                self.pos = (SWIDTH-BLOCKSIZE,self.pos[1])
        if self.dir == UP:
            self.pos = (self.pos[0],self.pos[1]-BLOCKSIZE)
            if self.pos[1] < 0:
                self.pos = (self.pos[0],SHEIGHT-BLOCKSIZE)
        if self.dir == DOWN:
            self.pos = (self.pos[0],self.pos[1]+BLOCKSIZE)
            if self.pos[1] > SHEIGHT-BLOCKSIZE:
                self.pos = (self.pos[0],0)
        self.bod.append(self.pos)
        if len(self.bod) > self.targetLen:
            del self.bod[0]
        if self.targetLen <= 2:
            self.dead = 1
        if self.dead:
            sharklist.remove(self)
            particleList.append(Particles(self.pos[0],self.pos[1],PARTICLEVEL*2,WHITE2,1.5*PARTICLESIZE))
            cam.shakeAmp = CAMERASHAKE*2
            #explodeSound.play()
            time.sleep(0.0002)
        return hit
        
    def decide_move(self):
        options = []
        if self.target[0] < self.pos[0] and self.dir != RIGHT:
            options.append(LEFT)
        if self.target[0] > self.pos[0] and self.dir != LEFT:
            options.append(RIGHT)
        if self.target[1] < self.pos[1] and self.dir != DOWN:
            options.append(UP)
        if self.target[1] > self.pos[1] and self.dir != UP:
            options.append(DOWN)
        if not options:
            self.dir = random.choice([UP,DOWN,LEFT,RIGHT])
        else:
            self.dir = random.choice(options)
    def get_target(self,playerBod):
        closest = (float("inf"),None)
        for pos in playerBod:
            mag = (((pos[0]-self.pos[0])**2) + ((pos[1]-self.pos[1])**2))**0.5
            if mag < closest[0]:
                closest = (mag,playerBod.index(pos))
        self.target = playerBod[closest[1]]
    def draw(self,campos):
        top = (-BLOCKSIZE,-BLOCKSIZE)
        for i in self.bod[::-1]:
            if self.bod.index(i) != len(self.bod)-1:
                drawBlock((i[0]-campos[0],i[1]-campos[1]),self.color)
            else:
                drawBlock((i[0]-campos[0],i[1]-campos[1]),WHITE2)
                top = i[0]-campos[0],i[1]-campos[1]
        drawBlock(top,WHITE2)

        
def drawBlock(pos,color):
    try:
        pygame.draw.rect(alphaSurf,color,pygame.Rect(pos[0],pos[1],BLOCKSIZE-EDGESIZE,BLOCKSIZE-EDGESIZE))
    except:
        print color

def isDead(snakepos,snakebod):
    return snakepos in snakebod #or snakepos[0] < 0 or snakepos[0] > SWIDTH-BLOCKSIZE or snakepos[1] < 0 or snakepos[1] > SHEIGHT-BLOCKSIZE

def getApplePos():
    return math.floor(random.random()*SWIDTH/BLOCKSIZE)*BLOCKSIZE, math.floor(random.random()*SHEIGHT/BLOCKSIZE)*BLOCKSIZE

def collides(pos1,pos2):
    if EDGESIZE < 0:
        return abs(pos1[0]-pos2[0]) <= abs(EDGESIZE*2) and abs(pos1[1]-pos2[1]) <= abs(EDGESIZE*2)
    return pos1 == pos2

def score_text(score,highestScore,surf,camera):
    highestScoreText = highestScoreFont.render(str(highestScore),True,KINDA_BLACK)
    scoreText = scoreFont.render(str(score),True,KINDA_BLACK)
    highestScoreRect = highestScoreText.get_rect(); highestScoreRect.center = (SWIDTH/2 - camera.pos[0],SHEIGHT/2 - camera.pos[1])
    scoreRect = scoreText.get_rect();scoreRect.midtop = (SWIDTH/2 - camera.pos[0],highestScoreRect.bottom)
    surf.blit(scoreText,scoreRect)
    surf.blit(highestScoreText,highestScoreRect)


RIGHT = 1
LEFT = 2
UP = 3
DOWN = 4

def play():
    snakePos = (SWIDTH/2,SHEIGHT/2)
    snakeList = [(SWIDTH/2,SHEIGHT/2),(SWIDTH/2 + BLOCKSIZE,SHEIGHT/2)]
    direction = LEFT
    fps = FPS_INITIAL
    appleGet = 0
    applePos = getApplePos()
    aColorChoice = [RED,BLUE,INDIGO,ORANGE,GREEN]
    appleColor = random.choice(aColorChoice)
    score = 0
    highestScore = 0
    colorList = [WHITE,WHITE]
    Cam = Camera()
    particleList = []
    scoreText = scoreFont.render(str(score),True,KINDA_BLACK)
    scoreRect = scoreText.get_rect();scoreRect.center = (SWIDTH/2,SHEIGHT/2)
    counter = 0
    sharks = []
    dead = False
    hurtCounter = 0
    while True:
        hurt = False
        movedThisFrame = False
        counter += 1
        if counter % 2 == 0:
            for i in pygame.event.get():
                if i.type == QUIT:
                    pygame.quit()
                    return
                if i.type == KEYDOWN:
                    if i.key in (ord('a'),K_LEFT) and not movedThisFrame and direction != RIGHT:
                        direction = LEFT
                        movedThisFrame = True
                    if i.key in (ord('d'),K_RIGHT) and not movedThisFrame and direction != LEFT:
                        direction = RIGHT
                        movedThisFrame = True
                    if i.key in (ord('w'),K_UP) and not movedThisFrame and direction != DOWN:
                        direction = UP
                        movedThisFrame = True
                    if i.key in (ord('s'),K_DOWN) and not movedThisFrame and direction != UP:
                        direction = DOWN
                        movedThisFrame = True
        if counter % 2 == 0 and not dead:
            if direction == DOWN:
                snakePos = (snakePos[0],snakePos[1]+BLOCKSIZE)
                if snakePos[1] >= SHEIGHT:
                    snakePos = (snakePos[0],0)
            if direction == UP:
                snakePos = (snakePos[0],snakePos[1]-BLOCKSIZE)
                if snakePos[1] < 0:
                    snakePos = (snakePos[0],SHEIGHT-BLOCKSIZE)
            if direction == RIGHT:
                snakePos = (snakePos[0]+BLOCKSIZE,snakePos[1])
                if snakePos[0] >= SWIDTH:
                    snakePos = (0,snakePos[1])
            if direction == LEFT:
                snakePos = (snakePos[0]-BLOCKSIZE,snakePos[1])
                if snakePos[0] < 0:
                    snakePos = (SWIDTH-BLOCKSIZE,snakePos[1])
            if appleGet <= 0:
                try:
                    del snakeList[0]
                except:
                    if not dead:
                        dead = True
                        counter = 0
                        #deathSound.play()
                        for bod in snakeList:
                            pcol = colorList[snakeList.index(bod)]
                            particleList.append(Particles(bod[0],bod[1],PARTICLEVEL,pcol))
                            Cam.shakeAmp = CAMERASHAKE
                            time.sleep(0.002)
                        snakeList = []
                        colorList = []
            if isDead(snakePos,snakeList) and not dead:
                dead = True
                counter = 0
                #deathSound.play()
                for bod in snakeList:
                    pcol = colorList[snakeList.index(bod)]
                    particleList.append(Particles(bod[0],bod[1],PARTICLEVEL,pcol))
                    Cam.shakeAmp = CAMERASHAKE
                    time.sleep(0.002)
                snakeList = []
                colorList = []
            snakeList.append(snakePos)
            appleGet -= 1
            score = len(snakeList)
            if score>highestScore:
                highestScore = score
            for shark in sharks:
                kol = [collides(i,snakePos) for i in shark.bod]
                if any(kol):
                    if shark.bod[kol.index(True)] == shark.pos:
                        shark.dead = 1
                    appleGet = 1
                    colorList.append(shark.color)
                    del  shark.bod[kol.index(True)]
                    particleList.append(Particles(snakePos[0],snakePos[1],PARTICLEVEL,RED2,PARTICLESIZE/2.0))
                    particleList.append(Particles(snakePos[0],snakePos[1],PARTICLEVEL,shark.color,PARTICLESIZE*1.5))
                    Cam.shakeAmp = CAMERASHAKE
                    #explodeSound.play()
                    appleGet = 1
                    shark.targetLen -= 1
            if collides(snakePos,applePos):
                particleList.append(Particles(applePos[0],applePos[1],PARTICLEVEL,appleColor))
                Cam.shakeAmp = CAMERASHAKE
                #explodeSound.play()
                appleGet = SNAKEGROWTH
                applePos = getApplePos()
                if score > 15:
                    if random.choice([True,False,False,False]):
                        sharks.append(Shark(getApplePos(),4))
                    if score > 30:
                        if random.choice([True,False,False,False]):
                            sharks.append(Shark(getApplePos(),4))
                a = appleColor
                for i in range(appleGet):
                    colorList.append(a)
                aColorChoice.remove(appleColor)
                if not aColorChoice:
                    aColorChoice = [RED,BLUE,INDIGO,ORANGE,GREEN]
                appleColor = random.choice(aColorChoice)
        for shark in sharks:
            if counter % 6 == 0 and not dead:
                hurt = shark.update(snakeList,colorList,particleList,Cam,appleGet,sharks)
                colorList[0] = WHITE
        if len(snakeList) <= 1 and not dead:
            dead = True
            counter = 0
            #deathSound.play()
            for bod in snakeList:
                pcol = colorList[snakeList.index(bod)]
                particleList.append(Particles(bod[0],bod[1],PARTICLEVEL,pcol))
                Cam.shakeAmp = CAMERASHAKE
                #explodeSound.play()
                time.sleep(0.002)
            snakeList = []
            colorList = []
        if dead and counter > fps*2:
            return play()
        fps = FPS_INITIAL + (FPS_INCREASE*score)
        if fps > 70:
            fps = 70
        alphaSurf.fill(BLACK)
        Cam.update(fps)
        
        sumPart = 0
        for i in particleList:
            i.update(particleList,Cam.pos)
            sumPart += len(i.particles)
        if sumPart > MAX_SCREEN_PARTICLES and not dead:
            for _i in range(20):
                del particleList[0].particles[0]
                if not particleList[0].particles:
                    del particleList[0]
        score_text(score,highestScore,alphaSurf,Cam)
        Cam.draw(applePos,appleColor)
        screen.blit(glowImg,(applePos[0]-Cam.pos[0],applePos[1]-Cam.pos[1]))
        if hurt and hurtCounter < -1 * fps/12:
            hurtCounter = fps/6
        hurtCounter -= 1
        if not dead:
            for bod in snakeList:
                Cam.draw(bod,colorList[len(snakeList)-1-snakeList.index(bod)])
                if hurtCounter > 0:
                    Cam.draw(bod,(255,255,255,190))
        for shark in sharks:
            shark.draw(Cam.pos)
        screen.blit(alphaSurf,(0,0))
        pygame.display.update()
        fpsClock.tick(fps)

if __name__ == "__main__":
    play()
