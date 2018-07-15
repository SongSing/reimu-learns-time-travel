class Rect extends Phaser.Sprite {
    constructor(game, key) {
        super(game, 0, 0, key);

        this.texture.baseTexture.scaleMode = PIXI.scaleModes.NEAREST;
        this.anchor.set(0);
        this.checkWorldBounds = false;
        this.outOfBoundsKill = false;
        game.physics.arcade.enable(this);

        this.reset(0, 0);
        this.z = 900;
    }
}

class TimeRect extends Rect {
    constructor(game, key) {
        super(game, key);
        this.scale.y = 16;
        this.x = 0;
        this.y = game.height - this.scale.y;
        this.alpha = 0.4;
    }

    update() {
        this.scale.x = game.width * (game.remainingTime / game.maxTime);
        this.x = (game.width - this.scale.x) / 2;
        this.tint = (game.type === GameType.A ? 0xFFFFFF : 0xAAAAFF);
    }
}

class CutoffRect extends Rect {
    constructor(game, key) {
        super(game, key);
        this.scale.y = 16;
        this.scale.x = game.width * (game.cutoffTime / game.maxTime);
        this.x = (game.width - this.scale.x) / 2;
        this.y = game.height - this.scale.y;
        this.alpha = 0.25;
        this.tint = 0xFF0000;
    }
}

class BossHealthRect extends Rect {
    constructor(game, key) {
        super(game, key);
        this.scale.y = 16;
        this.y = 0;
        this.alpha = 0.4;
        this.tint = 0xFFFF55;
    }

    update() {        
        var boss = game.state.states.Game.boss;

        if (boss.ready) {
            this.scale.x = game.width * (boss.health / boss.maxHealth);
            this.x = (game.width - this.scale.x) / 2;
        } else {
            this.scale.x = game.width * (game.remainingTime / game.maxTime);
            this.x = (game.width - this.scale.x) / 2;
        }
    }
}

class FlashRect extends Rect {
    constructor(game, key) {
        super(game, key);
        this.scale.y = game.height;
        this.scale.x = game.width;
        this.x = 0;
        this.y = 0;
        this.alpha = 0;
        this.tint = 0xFFFFFF;
        this.visible = false;
    }

    flash(opacity, time, cb) {
        this.alpha = opacity;
        this.visible = true;
        game.world.bringToTop(this);
        setTimeout(() => {
            this.alpha = 0;
            this.visible = false;
            cb && cb();
        }, time);
    }

    update() {
        if (this.visible) {
            game.world.bringToTop(this);
        }
    }
}