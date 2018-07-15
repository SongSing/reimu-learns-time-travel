var game = new Phaser.Game(384, 448, Phaser.AUTO, 'game');
game.packs = [];
game.maxTime = 2500;
game.cutoffTime = 500;
game.remainingTime = 0;
game.timeRegain = 4;
game.rewinding = false;
game.rewindSpeed = 1;
game.rewindCounter = 0;
game.rewindSwitch = false;
game.firstFrame = null;
game.restarting = false;

var GameType = {
    A: 0,
    B: 1
};

game.type = GameType.A;

function startRewind() {
    if (game.state.states.Game.player.won) {
        return;
    }

    game.rewinding = true;
    game.rewindCounter = 0;
    game.rewindSpeed = 1;
    game.rewindSwitch = false;
}

function win() {
    game.state.states.Game.player.alive = false;
    game.state.states.Game.player.won = true;
    var fr = game.state.states.Game.flashRect;

    fr.flash(0, 500, function() {
        fr.flash(0.25, 500, function() {
            game.sound.volume = 0.75;
            fr.flash(0.5, 500, function() {
                game.sound.volume = 0.5;
                fr.flash(0.75, 500, function() {
                    game.sound.volume = 0.25;
                    fr.flash(1, 500, function() {
                        game.sound.volume = 0;
                        game.state.states.Game.winImage.visible = true;
                    });
                });
            });
        });
    });
}

function stopRewind() {
    game.rewinding = false;
    game.state.states.Game.player.alive = true;
}

function lastPacked(offset) {
    if (offset === undefined) offset = 0;
    return game.packs[game.packs.length - 1 - offset];
}

function packSprite(sprite) {
    // position, velocity, angle, visible, exists, frame, scale, tint, alpha, previousPosition?, homing
    var pack = {
        x: sprite.x,
        y: sprite.y,
        vx: sprite.body ? sprite.body.velocity.x : 0,
        vy: sprite.body ? sprite.body.velocity.y : 0,
        gx: sprite.body ? sprite.body.gravity.x : 0,
        gy: sprite.body ? sprite.body.gravity.y : 0,
        angle: sprite.angle,
        visible: sprite.visible,
        exists: sprite.exists,
        power: sprite.power || 0,
        health: sprite.health || 100,
        maxHealth: sprite.maxHealth || 100,
        frame: sprite.frame || 0,
        sx: sprite.scale.x || 1,
        sy: sprite.scale.y || 1,
        tint: sprite.tint,
        alpha: sprite.alpha,
        homing: sprite.homing || false,
        ready: sprite.ready || false,
        invincible: sprite.invincible || false,
        counter: sprite.counter || 0,
        metaCounter: sprite.metaCounter || 0,
        state: sprite.state || 0,
        currentSpell: sprite.currentSpell || 0,
        metaState: sprite.metaState || 0,
        cache: sprite.cache ? JSON.parse(JSON.stringify(sprite.cache)) : {},
        peepee: sprite.peepee || 0
    };

    return pack;
}

function unpackSprite(pack, sprite) {
    sprite.x = pack.x;
    sprite.y = pack.y;
    sprite.body && (sprite.body.velocity.x = pack.vx);
    sprite.body && (sprite.body.velocity.y = pack.vy);
    sprite.body && (sprite.body.gravity.x = pack.gx);
    sprite.body && (sprite.body.gravity.y = pack.gy);
    sprite.angle = pack.angle;
    sprite.exists = pack.exists;
    sprite.power = pack.power;
    sprite.health = pack.health;
    sprite.maxHealth = pack.maxHealth;
    sprite.frame = pack.frame;
    sprite.scale.x = pack.sx;
    sprite.scale.y = pack.sy;
    sprite.tint = pack.tint;
    sprite.alpha = pack.alpha;
    sprite.homing = pack.homing;
    sprite.ready = pack.ready;
    sprite.invincible = pack.invincible;
    sprite.counter = pack.counter;
    sprite.metaCounter = pack.metaCounter;
    sprite.state = pack.state;
    sprite.currentSpell = pack.currentSpell;
    sprite.metaState = pack.metaState;
    sprite.cache = pack.cache;
    sprite.peepee = pack.peepee;
    sprite.visible = pack.visible;
}

function packCurrentFrame() {
    var state = game.state.states.Game;

    var pack = {
        player: packSprite(state.player),
        hitbox: packSprite(state.hitbox),
        boss: packSprite(state.boss),
        playerBullets: [],
        bossBullets: [],
        powerItems: [],
        flashRect: packSprite(state.flashRect)
    };

    var playerBullets = state.player.options[0].children;
    for (var i = 0; i < playerBullets.length; i++) {
        pack.playerBullets.push(packSprite(playerBullets[i]));
    }

    var bossBullets = state.boss.options[0].children;
    for (var i = 0; i < bossBullets.length; i++) {
        pack.bossBullets.push(packSprite(bossBullets[i]));
    }

    var powerItems = state.powerGroup.children;
    for (var i = 0; i < powerItems.length; i++) {
        pack.powerItems.push(packSprite(powerItems[i]));
    }

    pack.timestamp = Date.now();
    game.packs.push(pack);

    for (var i = 0; i < game.packs.length; i++) {
        if (pack.timestamp - game.packs[i].timestamp > game.maxTime) {
            game.packs.shift();
            i--;
        } else {
            break;
        }
    }

    if (game.firstFrame === null) {
        game.firstFrame = pack;
    }
}

function unpackCurrentFrame(dontPop, popFlash) {
    if (game.packs.length === 0) {
        return;
    }

    if (popFlash === undefined) popFlash = true;

    var now = Date.now();

    var pack = lastPacked();
    if (!dontPop) { // default
        game.packs.pop();
    }
    var delta = (game.packs.length > 0) ? pack.timestamp - lastPacked().timestamp : 0;
    var state = game.state.states.Game;

    if (game.type === GameType.A || game.restarting) {
        unpackSprite(pack.player, state.player);
        unpackSprite(pack.hitbox, state.hitbox);
    }

    unpackSprite(pack.boss, state.boss);
    popFlash && unpackSprite(pack.flashRect, state.flashRect);

    var playerBullets = state.player.options[0].children;
    for (var i = 0; i < playerBullets.length; i++) {
        unpackSprite(pack.playerBullets[i], playerBullets[i]);
    }

    var bossBullets = state.boss.options[0].children;
    for (var i = 0; i < bossBullets.length; i++) {
        unpackSprite(pack.bossBullets[i], bossBullets[i]);
    }

    var powerItems = state.powerGroup.children;
    for (var i = 0; i < powerItems.length; i++) {
        unpackSprite(pack.powerItems[i], powerItems[i]);
    }

    if (delta > 100) {
        console.log(delta);
    }
    return delta;
}

function restart() {
    game.restarting = true;
    game.packs = [ game.firstFrame ];
    unpackCurrentFrame();
    game.restarting = false;
}

class PhaserGame {
    constructor() {
        this.background = null;
        this.foreground = null;

        this.player = null;
        this.cursors = null;
    }

    init() {
        this.game.renderer.renderSession.roundPixels = true;
        Phaser.Canvas.setImageRenderingCrisp(this.game.canvas);

        this.physics.startSystem(Phaser.Physics.ARCADE);
    }

    preload() {
        this.load.image("background", "assets/black.png");
        this.load.image("win", "assets/win.png");
        this.load.image("hitbox", "assets/hitbox.png");
        this.load.image("hurt", "assets/hurt.png");
        this.load.spritesheet("player", "assets/ship.png", 32, 64);
        this.load.spritesheet("boss", "assets/boss.png", 32, 64);
        this.load.spritesheet("bossBullet", "assets/bullet2.png", 16, 16);
        this.load.image("playerBullet", "assets/bullet1.png");
        this.load.image("power", "assets/power.png");
        this.load.image("rect", "assets/rect.png");
        this.load.audio("shot", "assets/sound/shot.mp3");
        this.load.audio("bossShot", "assets/sound/bossShot.mp3");
        this.load.audio("die", "assets/sound/die.mp3");
        this.load.audio("hit", "assets/sound/hit.mp3");
        this.load.audio("hit2", "assets/sound/die.mp3");
        this.load.audio("effect1", "assets/sound/effect1.mp3");
        this.load.audio("bg", "assets/sound/bg.mp3");
        this.load.audio("bgr", "assets/sound/bgr.mp3");
    }

    create() {
        this.winImage = this.add.sprite(0, 0, "win");
        this.winImage.visible = false;

        //this.background = this.add.tileSprite(0, 0, this.game.width, this.game.height, "background");
        //this.background.autoScroll(10, 40);
        game.stage.setBackgroundColor("")
        this.flashRect = this.add.existing(new FlashRect(game, "rect"));
        this.timeRect = this.add.existing(new TimeRect(game, "rect"));
        this.cutoffRect = this.add.existing(new CutoffRect(game, "rect"));
        this.bossHealthRect = this.add.existing(new BossHealthRect(game, "rect"));

        this.hitbox = this.add.sprite(0, 0, "hitbox");
        this.hitbox.alpha = 0;
        game.physics.arcade.enable(this.hitbox);
        this.hitbox.body.setSize(4, 4, 1, 1);

        this.hurt = this.add.sprite(0, 0, "hurt");
        this.hurt.visible = false;

        this.player = this.add.existing(new Player(game, "player"));

        this.powerGroup = new PowerGroup(game);

        this.sounds = {
            shot: game.add.audio("shot"),
            bossShot: game.add.audio("bossShot"),
            die: game.add.audio("die"),
            hit: game.add.audio("hit"),
            hit2: game.add.audio("hit2"),
            effect1: game.add.audio("effect1"),
            bg: game.add.audio("bg"),
            bgr: game.add.audio("bgr")
        };

        for (var key in this.sounds) {
            this.sounds[key].allowMultiple = true;
        }

        //this.foreground = this.add.tileSprite(0, 0, this.game.width, this.game.height, 'foreground');
        //this.foreground.autoScroll(-60, 0);

        //this.cursors = this.input.keyboard.createCursorKeys();

        this.input.keyboard.addKeyCapture([ Phaser.Keyboard.LEFT, Phaser.Keyboard.RIGHT, Phaser.Keyboard.UP, Phaser.Keyboard.DOWN, Phaser.Keyboard.SHIFT, Phaser.Keyboard.Z, Phaser.Keyboard.X, Phaser.Keyboard.C ]);

        this.boss = this.add.existing(new Boss(game, "boss"));

        this.grayFilter = game.add.filter("Gray");
        this.grayFilter.gray = 0.7;

        this.sounds.bg.loopFull(0.5);
        
        this.muteButton = game.input.keyboard.addKey(Phaser.Keyboard.S);
        this.muteButton.onDown.add(this.mute, this);
        
        this.typeButton = game.input.keyboard.addKey(Phaser.Keyboard.Q);
        this.typeButton.onDown.add(this.toggleType, this);

        game.sound.muteOnPause = false;
    }

    mute() {
        game.sound.mute = !game.sound.mute;
    }

    toggleType() {
        game.type++;
        if (game.type > GameType.B) {
            game.type = 0;
        }
    }

    update() {
        var delta = game.time.physicsElapsed * 1000;
        var player = game.state.states.Game.player;
        var boss = game.state.states.Game.boss;

        if (player.won) {
            if (this.winImage.visible) {
                game.world.bringToTop(this.winImage);
            }
            return;
        }

        if (this.hurt.visible) {
            game.world.bringToTop(this.hurt);
            this.hurt.counter += delta;
            if (this.hurt.counter > 100) {
                this.hurt.visible = false;
            }
        }


        /*this.background.autoScroll(-this.player.body.velocity.x / 2,
            200 - this.player.body.velocity.y / 7);*/
        
        if (game.rewinding) {
            /*if (game.rewindCounter > (1 / game.rewindSpeed) * delta) {
                game.remainingTime -= unpackCurrentFrame();
                game.rewindCounter *= 0.9;
            } else {
                game.rewindCounter += delta;
            }*/
            /*if (!player.alive) {
                game.rewindCounter += delta;
                if (game.rewindCounter < 1000 / 30 * (1 / ((game.remainingTime / game.maxTime + 0.5) ** 2))) {
                    game.rewindSwitch = true;
                    //packCurrentFrame();
                } else {
                    game.rewindCounter = 0;
                    game.rewindSwitch = false;
                }
            } else {
                game.rewindCounter = 0;
            }*/

            game.remainingTime -= unpackCurrentFrame(game.rewindSwitch);
        } else if (player.alive) {
            var regain = boss.ready ? game.timeRegain : 1;
            game.remainingTime += delta / regain;
            if (this.player.grazing) {
                game.remainingTime += delta / regain;
                this.player.grazing = false;
            }
            if (game.remainingTime > game.maxTime) {
                game.remainingTime = game.maxTime;
            }
        } else {
            unpackCurrentFrame(!player.alive, false);
        }
    }

    render() {
        if (!game.paused && !game.rewinding && this.player.alive) {
            packCurrentFrame();
        }

        var now = Date.now();

        if (game.packs.length === 1) {
            game.packs[0].timestamp = now;
        } else if (game.packs.length > 0) {
            for (var i = game.packs.length - 1; i >= 0; i--) {
                //game.packs[i].timestamp += delta;
                if (i === game.packs.length - 1) {
                    game.packs[i].delta = game.packs[i].timestamp - game.packs[i - 1].timestamp;
                    game.packs[i].timestamp = now;
                } else if (i > 0) {
                    game.packs[i].delta = game.packs[i].timestamp - game.packs[i - 1].timestamp;
                    game.packs[i].timestamp = game.packs[i + 1].timestamp - game.packs[i + 1].delta;
                } else {
                    game.packs[i].timestamp = game.packs[i + 1].timestamp - game.packs[i + 1].delta;
                }
            }
        }

        if (game.remainingTime <= 0 || game.packs.length === 0) {
            stopRewind();

            /*if (!this.player.alive) {
                game.paused = true;
                setTimeout(function() {
                    game.paused = false;
                }, 1000);
            }*/

            this.player.alive = true;
        }

        if ((game.rewinding || !this.player.alive) && !this.player.won) {
            game.world.filters = [this.grayFilter];
        } else {
            game.world.filters = undefined;
        }
    }
};

game.state.add('Game', PhaserGame, true);