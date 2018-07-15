class PowerItem extends Phaser.Sprite {
    constructor(game, key, x, y, isLarge) {
        super(game, 0, 0, key);

        this.texture.baseTexture.scaleMode = PIXI.scaleModes.NEAREST;
        this.anchor.set(0.5);
        this.checkWorldBounds = true;
        this.outOfBoundsKill = true;
        game.physics.arcade.enable(this);

        this.value = isLarge ? 8 : 1;
        this.scale.set(isLarge ? 1.5 : 1);
        this.exists = false;
    }

    spawn(x, y) {
        this.reset(x, y);

        this.body.velocity.x = Math.random() * 40 - 20;
        this.body.velocity.y = Math.random() * -50;
        this.body.gravity.y = Math.random() * 10 + 45;
    }

    update() {
        var player = game.state.states.Game.player;

        if (!player.alive || game.rewinding || !this.exists) {
            return;
        }

        if (this.body.velocity.y > 0) {
            this.body.velocity.x = 0;
        }

        var cx = this.body.x + this.body.width / 2;
        var cy = this.body.y + this.body.height / 2;

        var cx_player = player.body.x + player.body.width / 2;
        var cy_player = player.body.y + player.body.height / 2;

        var distance = Math.sqrt((cx - cx_player) ** 2 + (cy - cy_player) ** 2);

        var range = 50;

        if (distance < range) {
            var speed = 300;

            var angle = Math.atan2(cy_player - cy, cx_player - cx);
            angle = angle / Math.PI * 180;
            this.game.physics.arcade.velocityFromAngle(angle, speed, this.body.velocity);
        }

        if (game.physics.arcade.overlap(this, player)) {
            player.power += this.value;
            if (player.power > 128) player.power = 128;
            this.kill();
        }
    }
}

class PowerGroup extends Phaser.Group {
    constructor(game) {
        super(game, game.world, "PowerGroup", false, false, Phaser.Physics.ARCADE);

        
        for (var i = 0; i < 5; i++) {
            let p = new PowerItem(game, "power", this.cx, this.cy, i === 0);
            this.add(p, true);
        }
    }

    spawn(source) {
        var x, y;

        if (source.body) {
            x = source.body.x + source.body.width / 2;
            y = source.body.y + source.body.height / 2;
        } else {
            x = source.x;
            y = source.y;
        }

        for (var i = 0; i < this.children.length; i++) {
            this.children[i].spawn(x, y);
        }
    }
}