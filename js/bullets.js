class Bullet extends Phaser.Sprite {
    constructor(game, key) {
        super(game, 0, 0, key);

        this.texture.baseTexture.scaleMode = PIXI.scaleModes.NEAREST;
        this.anchor.set(0.5);
        this.checkWorldBounds = true;
        this.outOfBoundsKill = true;
        this.exists = false;

        this.tracking = false;
        this.scaleSpeed = 0;

        this.updateHooks = [];
    }

    hookUpdate(fn) {
        this.updateHooks.push(fn);
    }

    fire(x, y, angle, speed, gx, gy, homing) {
        gx = gx || 0;
        gy = gy || 0;
    
        this.reset(x, y);
    
        this.game.physics.arcade.velocityFromAngle(angle, speed, this.body.velocity);
        //this.angle = angle;
        this.body.gravity.set(gx, gy);
        this.homing = homing ? "boss" : false;
        this.speed = speed;
        this._angle = angle;
    }

    update() {
        if (game.rewinding || !game.state.states.Game.player.alive || !this.exists) {
            return;
        }
        
        var delta = this.game.time.physicsElapsed;
        var boss = game.state.states.Game.boss;
        if (this.homing) {
            var cx_boss = boss.body.x + boss.body.width / 2;
            var cx_bullet = this.body.x + this.body.width / 2;
            var cy_boss = boss.body.y + boss.body.height / 2;
            var cy_bullet = this.body.y + this.body.height / 2;

            var angle = Math.atan2(cy_boss - cy_bullet, cx_boss - cx_bullet);
            angle = angle / Math.PI * 180;

            var distance = Math.sqrt((cx_boss - cx_bullet) ** 2 + (cy_boss - cy_bullet) ** 2);

            var d_a = angle - this._angle;
            if (d_a > 180) {
                d_a -= 360;
            }

            if (d_a < -180) {
                d_a += 360;
            }

            d_a /= delta * 1000 * (distance / game.height);
            this._angle += d_a;

            this.game.physics.arcade.velocityFromAngle(this._angle, this.speed, this.body.velocity);
        }

        if (game.physics.arcade.overlap(this, boss)) {
            boss.damage();
            this.kill();
        }

        if (this.tracking) {
            this.rotation = Math.atan2(this.body.velocity.y, this.body.velocity.x);
        }
    
        if (this.scaleSpeed > 0) {
            this.scale.x += this.scaleSpeed;
            this.scale.y += this.scaleSpeed;
        }

        this.angle -= 140 * delta;
    }
};

class BossBullet extends Bullet {
    constructor(game, key) {
        super(game, key);
    }

    static get Color() {
        return {
            Red: 0,
            Yellow: 1,
            Green: 2,
            Purple: 3
        };
    }

    fire(x, y, angle, speed, gx, gy, homing, scale, color) {
        this.scale.setTo(scale);
        this.frame = color;
        super.fire(x, y, angle, speed, gx, gy, homing);
        this.homing && (this.homing = "player");
    }

    update() {
        var player = game.state.states.Game.player;
        var hitbox = game.state.states.Game.hitbox;

        if (!this.exists || game.rewinding || !player.alive) {
            return;
        }

        if (!player.alive) {
            return;
        }

        if (this.homing === "player") {
            // TODO: this
        }

        if (!game.rewinding) {
            var cx_bullet = this.body.x + this.body.width / 2;
            var cy_bullet = this.body.y + this.body.height / 2;
            var cx_player = player.body.x + player.body.width / 2;
            var cy_player = player.body.y + player.body.height / 2;
            var bulletRadius = Math.max(this.body.width / 2, this.body.height / 2);

            /*if (Math.abs(cx_bullet - cx_player) > bulletRadius + 2) {
                return;
            }

            if (Math.abs(cy_bullet - cy_player) > bulletRadius + 2) {
                return;
            }*/

            var distance = Math.sqrt((cx_player - cx_bullet) ** 2 + (cy_player - cy_bullet) ** 2);
            distance -= 2; // account for hitbox radius
            var hurtRadius = bulletRadius * (7/8);
            var grazeRadius = bulletRadius * (8/7);

            if (distance <= hurtRadius && game.physics.arcade.overlap(this, hitbox)) {
                player.die();
                window.k = this;
            } else if (distance <= grazeRadius) {
                player.graze();
            }

            for (var i = 0; i < this.updateHooks.length; i++) {
                this.updateHooks[i].call(this);
            }
        }
    }
}

var BulletOptions = {};

BulletOptions.ReimuA = class extends Phaser.Group {
    constructor(game) {
        super(game, game.world, "playerBullet", false, true, Phaser.Physics.ARCADE);

        this.nextFire = 0;
        this.bulletSpeed = 600;
        this.fireRate = 100;

        for (var i = 0; i < 170; i++) {
            let b = new Bullet(game, "playerBullet");
            b.alpha = 0.4;
            this.add(b, true);
        }
    }

    fire(source) {
        var player = this.game.state.states.Game.player;
        if (this.game.time.time < this.nextFire) {
            return;
        }


        game.state.states.Game.sounds.shot.play();
    
        var x = source.body.x + 2;
        var y = source.body.y - 16;
    
        var b0 = this.getFirstExists(false);
        b0.tint = 0xFFCCCC;
        b0.fire(x, y, 270, this.bulletSpeed, 0, 0);

        var powerLevel = 0;
        if (player.power < 8) {
            powerLevel = 0;
        } else if (player.power < 16) {
            powerLevel = 1;
        } else {
            powerLevel = ~~(player.power / 16)  + 1;
        }
        
        for (var i = 0; i < powerLevel; i++) {
            if ((i & 1) === 0) {
                let b1 = this.getFirstExists(false);
                b1.tint = 0xFFFFFF;
                b1.fire(x + 5 * (i / 2 + 1), y, 270 + 60 + 5 * (i / 2 + 1), this.bulletSpeed, 0, 0, true);

                let b2 = this.getFirstExists(false);
                b2.tint = 0xFFFFFF;
                b2.fire(x - 5 * (i / 2 + 1), y, 270 - 60 - 5 * (i / 2 + 1), this.bulletSpeed, 0, 0, true);
            } else {
                var spread = game.input.keyboard.isDown(Phaser.Keyboard.SHIFT) ? 1 : 6;
                let b1 = this.getFirstExists(false);
                b1.tint = 0xFFCCCC;
                b1.fire(x + 5 * ((i + 1) / 2), y, 270 + spread * ((i + 1) / 2), this.bulletSpeed, 0, 0);

                
                let b2 = this.getFirstExists(false);
                b2.tint = 0xFFCCCC;
                b2.fire(x - 5 * ((i + 1) / 2), y, 270 - spread * ((i + 1) / 2), this.bulletSpeed, 0, 0);
            }
        }
    
        this.nextFire = this.game.time.time + this.fireRate;
    }
};

BulletOptions.FlandreA = class extends Phaser.Group {
    constructor(game) {
        super(game, game.world, "FlandreA", false, true, Phaser.Physics.ARCADE);

        for (var i = 0; i < 500; i++) {
            let b = new BossBullet(game, "bossBullet");
            b.alpha = 1;
            this.add(b, true);
        }

        var self = this;

        this.fire = {
            
            circle: function(source, bulletSpeed, scale, offset, color) {
                if (bulletSpeed === undefined) bulletSpeed = 200;
                if (scale === undefined) scale = 1;
                if (offset === undefined) offset = 0;
                if (color === undefined) color = 0;
        
                var player = self.game.state.states.Game.player;
            
                var x = source.body.x + source.body.width / 2;
                var y = source.body.y + source.body.height / 2;
        
                for (var i = 0; i < 18; i++) {
                    self.getFirstExists(false).fire(x, y, i * 20 + offset, bulletSpeed, 0, 0, false, scale, color);
                }
            },

            couplet: function(source, bulletSpeed, scale, offset, color) {
                if (bulletSpeed === undefined) bulletSpeed = 200;
                if (scale === undefined) scale = 1;
                if (offset === undefined) offset = 0;
                if (color === undefined) color = 0;
            
                var x = source.body.x + source.body.width / 2;
                var y = source.body.y + source.body.height / 2;

                self.getFirstExists(false).fire(x, y, 90 - offset, bulletSpeed, 0, 0, false, scale, color);
                self.getFirstExists(false).fire(x, y, 90 + offset, bulletSpeed, 0, 0, false, scale, color);
            },

            single: function(source, bulletSpeed, sx, sy, offset, color, gx, gy) {
                if (bulletSpeed === undefined) bulletSpeed = 200;
                if (sx === undefined) sx = 1;
                if (sy === undefined) sy = 1;
                if (offset === undefined) offset = 0;
                if (color === undefined) color = 0;
                if (gx === undefined) gx = 0;
                if (gy === undefined) gy = 0;

                var x,y;

                if (source.body) {
                    x = source.body.x + source.body.width / 2;
                    y = source.body.y + source.body.height / 2;
                } else {
                    x = source.x;
                    y = source.y;
                }

                var b = self.getFirstExists(false);
                b.fire(x, y, offset, bulletSpeed, gx, gy, false, sx, color);
                b.scale.y = sy;
                return b;
            },

            laser: function(source, rotateSpeed, offset, color) {
                if (rotateSpeed === undefined) rotateSpeed = 50;
                if (offset === undefined) offset = 0;
                if (color === undefined) color = 0;

                var x,y;

                if (source.body) {
                    x = source.body.x + source.body.width / 2;
                    y = source.body.y + source.body.height / 2;
                } else {
                    x = source.x;
                    y = source.y;
                }

                var b = self.getFirstExists(false);
                b.fire(x, y, offset, 0, 0, 0, false, 4, color);
                b.angle = offset;
                b.scale.y = 4;
                b.hookUpdate(function() {
                    if (this.scale.y < game.height / 16) {
                        this.scale.y += 32 * game.time.physicsElapsed;
                    } else {
                        this.angle += rotateSpeed * game.time.physicsElapsed;
                    }
                });
                b.anchor.y = 0;

                return b;
            }

        };
    }
};