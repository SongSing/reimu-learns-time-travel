class Boss extends Phaser.Sprite {
    constructor(game, key) {
        super(game, 0, 0, key);

        this.texture.baseTexture.scaleMode = PIXI.scaleModes.NEAREST;
        this.anchor.set(0.5);
        this.checkWorldBounds = false;
        this.outOfBoundsKill = false;
        game.physics.arcade.enable(this);

        this.reset(0 - this.width, 0 - this.height);

        this.state = 0;
        this.power = 0;

        this.animations.add("idle");
        this.animations.play("idle", 2, true);

        this.body.setSize(22, 30, 4, 26);

        this.options = [];
        
        this.options.push(new BulletOptions.FlandreA(game));

        this.counter = 0;
        this.metaCounter = 0;
        this.metaState = 0;

        this.peepee = 0;
        this.ready = false;
        this.maxHealth = 100;
        this.health = this.maxHealth;
        this.invincible = false;
        this.currentSpell = 0;
        this.spells = [
            0,
            1,
            6,
            5,
            7,
            8
        ];

        this.cache = {};
    }

    get cx() {
        return this.body.x + this.body.width / 2;
    }

    set cx(val) {
        this.body.x = val - this.body.width / 2;
    }

    get cy() {
        return this.body.y + this.body.height / 2;
    }

    set cy(val) {
        this.body.y = val - this.body.height / 2;
    }

    spawnPowers() {
        game.state.states.Game.powerGroup.spawn(this);
    }

    damage() {
        if (this.invincible) {
            return;
        }

        this.health -= 1;

        this.tint = 0xFFAAAA;
        //game.state.states.Game.sounds[this.health < this.maxHealth / 5 ? "hit2" : "hit"].play();
        this.power = 0;

        if (this.health <= 0) {
            this.invincible = true;
            this.destroyAllBullets();
            this.currentSpell++;
            this.state = 3;
            this.counter = 0;
            this.metaState = 0;
            this.peepee = 0;
            this.body.velocity.set(0);

            if (this.currentSpell >= this.spells.length) {
                win();
                return;
            }

            this.spawnPowers();
        }
    }

    destroyAllBullets() {
        var bossBullets = game.state.states.Game.boss.options[0].children;
        for (var i = 0; i < bossBullets.length; i++) {
            bossBullets[i].kill();
        }

        var fr = game.state.states.Game.flashRect;

        fr.flash(1, 100, function() {
            game.state.states.Game.sounds.effect1.play();
            setTimeout(function() {
                fr.flash(1, 100);
                game.state.states.Game.sounds.effect1.play();
            }, 100);
        });
    }

    update() {
        var player = game.state.states.Game.player;
        var flashRect = game.state.states.Game.flashRect;
        var delta = game.time.physicsElapsed * 1000;

        if (game.rewinding || !player.alive) {
            return;
        }
        
        if (this.tint !== 0xFFFFFF) {
            this.power += delta;
            if (this.power >= 20) {
                this.tint = 0xFFFFFF;
                this.power = 0;
            }
        }

        if (game.physics.arcade.overlap(this, player)) {
            player.die();
        }

        switch (this.state) {

            case 0: {
                //this.counter += delta;

                if (game.remainingTime === game.maxTime || this.metaState === 1) {
                    if (this.metaState === 0) {
                        this.body.velocity.x = 120;
                        this.body.velocity.y = 240;
                        this.metaState = 1;
                        this.ready = true;
                        this.invincible = true;
                    }

                    this.body.velocity.y -= game.time.physicsElapsed * 150;
                    if (this.cx >= game.width / 2) {
                        this.state = 4;
                        this.body.velocity.y = 0;
                        this.body.velocity.x = 0;
                        this.cx = game.width / 2;
                        this.counter = 0;
                        this.invincible = false;
                        this.metaState = 0;
                        this.counter = 0;
                        this.metaCounter = 0;
                        this.peepee = 0;
                        // debug
                        //this.state = 5;
                        //this.metaState = 0;
                        //this.currentSpell = 2;
                        //player.power = 32;

                        //dthis.health = 1;

                        return;
                    }
                }
                break;
            }

            case 1: {
                if (this.peepee === 0) {
                    this.body.velocity.y = -30;

                    if (this.cy < 128) {
                        this.cy = 128;
                        this.body.velocity.set(0);
                        this.peepee = 1;
                    } else {
                        return;
                    }
                }

                this.counter += delta;
                if (this.counter > 50) {
                    this.options[0].fire.circle(this, (this.metaState + 1) * 20, 1.5, this.metaState * 5, BossBullet.Color.Red);
                    game.state.states.Game.sounds.bossShot.play();
                    this.counter = 0;
                    this.metaState++;

                    if (this.metaState === 10) {
                        this.state = 2;
                        this.metaState = 0;
                        this.counter = -500;
                    }
                }
                break;
            }

            case 2: {
                this.counter += delta;
                if (this.counter > 500) {
                    var cx_boss = this.body.x + this.body.width / 2;
                    var cx_player = player.body.x + player.body.width / 2;
                    var cy_boss = this.body.y + this.body.height / 2;
                    var cy_player = player.body.y + player.body.height / 2;

                    var angle = Math.atan2(cy_player - cy_boss, cx_player - cx_boss);
                    angle = angle / Math.PI * 180;

                    this.options[0].fire.circle(this, 100, 1.5, angle, BossBullet.Color.Yellow);
                    this.counter = 0;
                    this.metaState++;
                    game.state.states.Game.sounds.bossShot.play();

                    if (this.metaState === 10) {
                        this.state = 1;
                        this.metaState = 0;
                        this.counter = 0;
                    }
                }
                break;
            }

            case 3: { // nextcard
                this.health += this.maxHealth / 2000 * delta;
                if (this.health >= this.maxHealth) {
                    this.maxHealth += 200;
                    this.health = this.maxHealth;
                    this.state = this.spells[this.currentSpell];
                    this.invincible = false;
                    this.counter = 0;
                    this.metaState = 0;
                    this.peepee = 0;
                    this.metaCounter = 0;
                }
                break;
            }

            case 4: {
                this.counter += delta;

                switch (this.metaState) {

                    case 0: {

                        if (this.y > 120) {
                            this.body.velocity.y = -20;
                        } else {
                            this.y = 120;
                            this.body.velocity.y = -5;
                            this.metaState = 1;
                            this.counter = 0;
                            this.cache.last = undefined;
                        }

                        break;
                    }

                    case 1: {
                        if (this.counter < 500) {
                            this.body.velocity.y -= 0.1 * delta;
                        } else if (this.counter < 1500) {
                            if (this.peepee === 0) {
                                if (this.body.velocity.y < 0) {
                                    this.body.velocity.y *= -0.5;
                                }
    
                                this.body.velocity.y += 0.1 * delta;
                            }

                            var county = ~~(this.counter / 50);
                            
                            if (!this.cache.last || this.cache.last < county) {
                                this.cache.last = county;
                                this.options[0].fire.couplet(this, 50, 1, (county - 15) * (30 / (this.peepee + 1)), BossBullet.Color.Green);
                                game.state.states.Game.sounds.bossShot.play();
                            }
                        } else {
                            this.body.velocity.y = 0;
                            if (this.peepee > 2) {
                                if (this.peepee > 3) {
                                    this.metaState = 2;
                                    this.peepee = 0;
                                    this.counter = 0;
                                } else {
                                    this.body.velocity.y = -10;
                                    if (this.counter > 3000) {
                                        this.peepee++;
                                    }
                                }
                            } else {
                                this.counter = 500;
                                this.cache.last = undefined;
                                this.peepee++;
                                this.body.velocity.y = -10;
                                this.metaCounter = 0;
                            }
                        }
                        break;
                    }

                    case 2: {
                        this.metaCounter += delta;

                        if (this.peepee === 0) {
                            this.cache.a_delta = (2/5) * Math.PI;
                            this.cache.a_0 = (1/2) * Math.PI;
    
                            this.cache.pts = [];
    
                            for (var i = 0; i < 5; i++) {
                                this.cache.pts.push({
                                    x: Math.cos(this.cache.a_0),
                                    y: Math.sin(this.cache.a_0)
                                });
    
                                this.cache.a_0 += this.cache.a_delta;
                            }

                            this.peepee = 1;
                            this.cache.currentPt = 0;
                            this.cache.updateVelocity = true;
                            this.cache.bullets = [];
                        }

                        switch (this.cache.currentPt) {
                            case 0: this.cache.nextPt = 2; break;
                            case 2: this.cache.nextPt = 4; break;
                            case 4: this.cache.nextPt = 1; break;
                            case 1: this.cache.nextPt = 3; break;
                            case 3: this.cache.nextPt = 0; break;
                        }

                        if (this.cache.updateVelocity) {
                            var angle = Math.atan2(this.cache.pts[this.cache.nextPt].y - this.cache.pts[this.cache.currentPt].y,
                                this.cache.pts[this.cache.nextPt].x - this.cache.pts[this.cache.currentPt].x);
                            angle = angle / Math.PI * 180;
                            game.physics.arcade.velocityFromAngle(angle, 200, this.body.velocity);
                            this.cache.updateVelocity = false;
                        }

                        if (this.metaCounter > 50) {
                            var b = this.options[0].fire.single(this, 0, 1, 1, 0, BossBullet.Color.Red, 0, 0);
                            this.metaCounter = 0;
                            this.cache.bullets.push(b.z);
                        }

                        if (this.counter >= 500) {
                            flashRect.flash(0.2, 50);
                            game.state.states.Game.sounds.effect1.play();
                            this.peepee++;
                            this.cache.updateVelocity = true;
                            this.cache.currentPt = this.cache.nextPt;

                            if (this.peepee > 5) {
                                this.metaState = 3;
                                this.counter = 0;
                                this.metaCounter = 0;
                                this.peepee = 0;
                                this.body.velocity.set(0);

                                for (var i = 0; i < this.cache.bullets.length; i++) {
                                    let b = this.options[0].children[this.cache.bullets[i]];
                                    b.body.gravity.y = b.body.y;
                                }

                                this.cache.bullets.length = 0;
                            }

                            this.counter = 0;
                        }
                        break;
                    }

                    case 3: {
                        this.metaCounter += delta;
                        if (this.counter < 3000) {
                            if (this.metaCounter > 10) {
                                this.metaCounter = 0;
                                var spread = 60;
                                this.options[0].fire.couplet(this, 150, 1, (this.counter / 2) % spread + 15, BossBullet.Color.Green);
                                game.state.states.Game.sounds.bossShot.play();
                            }
                        } else {
                            this.metaState = 0;
                            this.counter = 0;
                            this.metaCounter = 0;
                            this.peepee = 0;
                        }
                        break;
                    }

                }
                break;
            }
            
            case 5: {
                this.counter += delta;
                var offset = 70;

                switch (this.metaState) {
                    case 0: {
                        if (this.cx > -offset) {
                            this.body.velocity.x -= 0.1 * delta;
                            this.body.velocity.y = -50;
                        } else {
                            this.metaState = 1;
                            this.cy = 50;
                            this.body.velocity.y = 0;
                        }
                        break;
                    }
                    case 1: {
                        this.metaCounter += delta;
                        if (this.cx < game.width + offset && this.body.velocity.x >= 0) {
                            this.body.velocity.x = 400;
                        } else {
                            this.body.velocity.x = -400;

                            if (this.cx < -offset) {
                                this.body.velocity.x = 100;
                            }
                        }

                        if (this.metaCounter > 100) {
                            for (var i = 0; i < 5; i++) {
                                this.options[0].fire.single(this, 0, 0.4, 1.5, 0, BossBullet.Color.Red, 0, 25 * (i+1));
                            }
                            this.metaCounter = 0;

                            if (this.x + this.width > 0 && this.x < game.width) {
                                game.state.states.Game.sounds.bossShot.play();
                            }
                        }
                        break;
                    }
                }
                break;
            }

            case 6: {
                this.counter += delta;

                switch (this.metaState) {
                    case 0: {
                        if (this.cx < game.width + 100) {
                            this.body.velocity.x = 200;
                            this.body.velocity.y = -10;
                        }

                        if (this.cx >= game.width + 100 || this.cy <= -64) {
                            this.cx = game.width / 2;
                            this.cy = -64;
                            this.metaState = 1;
                            this.body.velocity.y = 20;
                            this.body.velocity.x = 0;
                        }
                        break;
                    }
                    case 1: {
                        this.metaCounter += delta;
                        if (this.counter >= 100 /*&& this.cy > 70*/) {
                            this.options[0].fire.single(this, 200, 3, 3, this.peepee, BossBullet.Color.Red, 0, 0);
                            this.peepee += 2;
                            this.counter = 0;
                            game.state.states.Game.sounds.bossShot.play();
                        }
                        
                        if (this.cy > game.height + this.height / 2) {
                            this.cy = -64
                            this.peepee = 0;
                        }

                        if (this.metaCounter >= 2000) {
                            this.metaCounter = 0;

                            var hslice = game.height / 9;
                            var vslice = game.width / 5;

                            for (var i = 0; i < 8; i++) {
                                this.options[0].fire.single({x: (i & 1) ? game.width + 7.5 : -7.5, y: hslice * (i + 1) }, 40, 1, 1, (i & 1) * 180, BossBullet.Color.Green, 0, 0);
                            }

                            for (var i = 0; i < 4; i++) {
                                this.options[0].fire.single({x: vslice * (i + 1), y: (i & 1) ? game.height + 7.5 : -7.5 }, 50, 1, 1, (i & 1) ? 270 : 90, BossBullet.Color.Yellow, 0, 0);
                            }
                        }
                        break;
                    }
                }
                break;
            }

            case 8: {
                if (this.metaState === 0) {
                    this.metaState = 1;

                    var angle = Math.atan2(player.cy - this.cy, player.cx - this.cx);
                    angle = angle / Math.PI * 180;
                    this.options[0].fire.single(
                        this,
                        80,
                        3,
                        3,
                        angle,
                        BossBullet.Color.Yellow,
                        0,
                        0
                    );
                } else {
                    if (this.peepee >= 1000 && !this.cache.switch) {

                        var angle = Math.atan2(player.cy - this.cy, player.cx - this.cx);
                        angle = angle / Math.PI * 180;

                        this.options[0].fire.single(
                            this,
                            80,
                            3,
                            3,
                            angle,
                            BossBullet.Color.Yellow,
                            0,
                            0
                        );

                        this.cache.switch = true;
                    }
                }
            }

            case 7: {
                if (this.metaState === 0) {
                    if (this.peepee === 0) {
                        this.cache.right = this.cx > game.width / 2;
                        this.cache.sx = false;
                        this.peepee = 1;
                    }

                    if (!this.cache.sx) {
                        if (this.cache.right) {
                            this.body.velocity.x = -50;
                            if (this.cx < game.width / 2) {
                                this.cx = game.width / 2;
                                this.sx = true;
                                this.body.velocity.x = 0;
                            }
                        } else {
                            this.body.velocity.x = 50;
                            if (this.cx > game.width / 2) {
                                this.cx = game.width / 2;
                                this.sx = true;
                                this.body.velocity.x = 0;
                            }
                        }
                    }

                    if (this.cy < 60) {
                        this.body.velocity.y += 0.01 * delta;
                    } else {
                        this.cy = 60;
                        this.body.velocity.y = 0;
                    }

                    if (this.body.velocity.y === 0 & this.body.velocity.x === 0) {
                        this.metaState = 1;
    
                        this.cache = {
                            spawners: []
                        };
    
                        var n = 3;
                        var slice = game.height / (n + 1);
    
                        for (var i = 0; i < (n+1); i++) {
                            this.cache.spawners.push({
                                x: 0,
                                y: slice * (i),
                                speed: 60
                            });
                            this.cache.spawners.push({
                                x: game.width,
                                y: slice * (i),
                                speed: 60
                            });
                        }
    
                        this.cache.switch = false;
                        this.peepee = 0;
                    }

                } else {
                    this.counter += delta;
                    this.metaCounter += delta;
                    this.peepee += delta;

                    var shoot = this.counter >= 200;
                    if (shoot) {
                        this.counter = 0;
                        var n = 3;
                        for (var i = 0; i < n; i++) {
                            this.options[0].fire.couplet(
                                this,
                                200,
                                2,
                                90 + (180 / (n + 1) * i),
                                BossBullet.Color.Yellow
                            );
                        }
                        game.state.states.Game.sounds.bossShot.play();
                    }

                    var shift = this.metaCounter >= 1500;
                    if (shift) {
                        this.metaCounter = 0;
                    }

                    if (this.peepee >= 2000) {
                        this.peepee = 0;
                        this.cache.switch = false;

                        this.options[0].fire.single(
                            {
                                x: 0,
                                y: game.state.states.Game.player.cy
                            },
                            100,
                            1,
                            1,
                            0,
                            BossBullet.Color.Green,
                            0,
                            0
                        );

                        this.options[0].fire.single(
                            {
                                x: game.width,
                                y: game.state.states.Game.player.cy
                            },
                            100,
                            1,
                            1,
                            180,
                            BossBullet.Color.Green,
                            0,
                            0
                        );
                    }

                    for (var i = 0; i < this.cache.spawners.length; i++) {
                        if (shift) {
                            this.cache.spawners[i].y -= this.cache.spawners[i].speed;
                            if (this.cache.spawners[i].y < 0) {
                                this.cache.spawners[i].y += game.height;
                            }
                        }

                        if (shoot) {
                            this.options[0].fire.single(
                                this.cache.spawners[i],
                                100,
                                1,
                                1,
                                this.cache.spawners[i].x === 0 ? 45 : 135,
                                BossBullet.Color.Red,
                                0,
                                0
                            );
                        }
                    }
                }
                break;
            }

        }
    }
}