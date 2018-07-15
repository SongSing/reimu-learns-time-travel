class Player extends Phaser.Sprite {
    constructor(game, key) {
        super(game, 0, 0, key);

        this.texture.baseTexture.scaleMode = PIXI.scaleModes.NEAREST;
        this.anchor.set(0.5);
        this.checkWorldBounds = false;
        this.outOfBoundsKill = false;
        this.speed = 4 * 60;
        game.physics.arcade.enable(this);

        this.reset(game.width / 2, game.height - 64);
        this.power = 0;
        this.animations.add("idle");
        this.animations.play("idle", 2, true);
        this.body.setSize(4, 4, this.width / 2 - 2, 42);


        this.body.collideWorldBounds = true;

        this.options = [];
        this.currentOption = 0;

        this.options.push(new BulletOptions.ReimuA(this.game));
        this.alive = true;
        this.deathCounter = 0;
        this.cx = game.width / 2;
        this.won = false;
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

    update() {
        if (game.input.keyboard.isDown(Phaser.Keyboard.X)) {
            if (!game.rewinding) {
                if (game.remainingTime > game.cutoffTime) {
                    startRewind();
                }
            } else {
                if (game.remainingTime <= 0) {
                    stopRewind();
                }
            }
        } else if (game.rewinding) {
            //if (this.alive) {
                stopRewind();
            //}
        }

        if (((!game.rewinding || game.type === GameType.B) && this.alive)
            || (game.rewinding && !this.alive && game.type === GameType.B)) {
            var state = game.state.states.Game;
            this.body.velocity.set(0);

            var shift = state.input.keyboard.isDown(Phaser.Keyboard.SHIFT);

            var speedDiv = shift ? 2 : 1;

            if (game.input.keyboard.isDown(Phaser.Keyboard.LEFT)) {
                this.body.x -= this.speed * game.time.physicsElapsed / speedDiv;
            } else if (game.input.keyboard.isDown(Phaser.Keyboard.RIGHT)) {
                this.body.x += this.speed * game.time.physicsElapsed / speedDiv;
            }

            if (game.input.keyboard.isDown(Phaser.Keyboard.UP)) {
                this.body.y -= this.speed * game.time.physicsElapsed / speedDiv;
            } else if (game.input.keyboard.isDown(Phaser.Keyboard.DOWN)) {
                this.body.y += this.speed * game.time.physicsElapsed / speedDiv;
            }

            this.body.x = Math.min(this.body.x, game.width - 9);
            this.body.x = Math.max(this.body.x, 5);

            this.body.y = Math.min(this.body.y, game.height - 9);
            this.body.y = Math.max(this.body.y, 11);

            if (state.input.keyboard.isDown(Phaser.Keyboard.Z) && !game.rewinding) {
                this.options[this.currentOption].fire(this);
            }

            /*if (state.input.keyboard.isDown(Phaser.Keyboard.C) && !game.rewinding) {
                state.boss.health = 1;
            }*/

            state.hitbox.x = this.body.x - 1;
            state.hitbox.y = this.body.y - 1;

            if (shift) {
                state.hitbox.alpha = 1;
                game.world.bringToTop(state.hitbox);
            } else {
                state.hitbox.alpha = 0;
            }
        }
    }

    die() {
        this.alive = false;
        game.state.states.Game.sounds.die.play()

        if (game.remainingTime > game.cutoffTime) {
            //startRewind();
            //game.rewindSwitch = true;
            game.remainingTime /= 2;
            if (game.remainingTime < game.cutoffTime) {
                game.remainingTime = game.cutoffTime + 1;
            }
        } else {
            var fr = game.state.states.Game.flashRect;

            fr.flash(0, 500, function() {
                fr.flash(0.25, 500, function() {
                    fr.flash(0.5, 500, function() {
                        fr.flash(0.75, 500, function() {
                            fr.flash(1, 500, function() {
                                restart();
                            });
                        });
                    });
                });
            });
        }
    }

    graze() {
        this.grazing = true;
    }
}