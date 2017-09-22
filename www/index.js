//util
Array.prototype.oncePush = function(e) {
    for (var i = 0; i <= this.length; i++) {
        if (this[i] === e) {
            return i;
        }
    }
    return this.nullPush(e);
}
Array.prototype.nullPush = function(e) {
    for (var i = 0; i <= this.length; i++) {
        if (this[i] === null || this[i] === undefined) {
            this[i] = e;
            return i;
        }
    }
}
Array.prototype.remove = function(e) {
    for (var i = 0; i < this.length; i++) {
        if (this[i] === e) {
            this[i] = null;
            return i;
        }
    }
    return false;
}

function Array2D(cols) {
    this.cols = cols;
    this.value = [];
}
Array2D.prototype.idx = function(i, j, data) {
    if (data !== undefined) {
        this.value[i * this.cols + j] = data;
    }
    return this.value[i * this.cols + j];
}
Array2D.prototype.for2d = function(sx, sy, w, h, cb) {
    for (var i = sx; i < sx + w; i++) {
        for (var j = sy; j < sy + h; j++) {
            cb(this.idx(i, j), i, j);
        }
    }
}

rnd = (a, b) => Math.random() * (b - a) + a;

//engine
var cvs = document.getElementById("cvs");
var ctx = cvs.getContext("2d");
var width = cvs.width;
var height = cvs.height;
var depth = (width + height) / 2;
var tps = 128;

var world = [];
var lstack = [];

function lupdate() {
    for (var i = 0; i < lstack.length; i++) {
        if (lstack[i] && typeof lstack[i] === 'function') {
            lstack[i]();
        }
    }
    for (var i = 0; i < world.length; i++) {
        if (world[i] && typeof world[i].update === 'function') {
            world[i].update();
        }
    }
    setTimeout(lupdate, 1000 / tps);
}

ctx.strokeStyle = "white";

function gupdate() {
    ctx.fillStyle = "purple";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "white";
    for (var i = 0; i < world.length; i++) {
        if (world[i] && typeof world[i].draw === 'function') {
            world[i].draw();
        }
    }
    requestAnimationFrame(gupdate);
}

lupdate();
gupdate();

//game

function starwars() {
    var dev = false;

    function ColSystem(width, height) {
        this.width = width;
        this.height = height;
        this.wscale = Math.ceil(width / 10);
        this.hscale = Math.ceil(height / 10);
        this.table = new Array2D(this.wscale);
        this.objects = [];
        this.register = function(object, options) {
            object._cs = options || {}; //colSys data for this object
            this.objects.nullPush(object);
        }
        this.hitEvents = [];
        this.hitTypes = [];
        this.hitByType = function(a, b, cb) {
            this.hitTypes.oncePush(a);
            this.hitTypes.oncePush(b);
            var eventId = this.hitEvents.push([a, b, cb]);
            return eventId;
        }
        this.hit = function(a, b) {
            return (Math.abs(a.x - b.x) <= (a.w > b.w ? a.w : b.w)) &&
                (Math.abs(a.y - b.y) <= (a.h > b.h ? a.h : b.h));
        }
        this.update = function() {
            var table = this.table = new Array2D(this.wscale);
            var that = this;
            for (var k = 0; k < this.objects.length; k++) {
                if (world.includes(this.objects[k])) {
                    var o = this.objects[k];
                    var x = o.x;
                    var y = o.y;
                    var w = o.w;
                    var h = o.h;
                    o._cs.table = [];
                    this.table.for2d(Math.floor(x / this.wscale), Math.floor(y / this.hscale), Math.ceil(w / this.wscale), Math.ceil(h / this.hscale), function(d, i, j) {
                        var a = table.idx(i, j) || [];
                        table.idx(i, j, a);
                        a.push(o);
                        o._cs.table.push([i, j]);
                    });
                }
            }
            this.table.value.forEach(function(d) {
                if (typeof d === typeof []) {
                    for (var m = 0; m < d.length; m++) {
                        for (var n = 0; n < d.length; n++) {
                            if (d[m] && d[n] && m !== n) {
                                if (that.hit(d[m], d[n])) {
                                    var mtype, ntype;
                                    for (var t = 0; t < that.hitTypes.length; t++) {
                                        if (d[m] instanceof that.hitTypes[t]) {
                                            mtype = that.hitTypes[t];
                                        }
                                        if (d[n] instanceof that.hitTypes[t]) {
                                            ntype = that.hitTypes[t];
                                        }
                                    }
                                    for (var k = 0; k < that.hitEvents.length; k++) {
                                        if (
                                            (that.hitEvents[k][0] === mtype && that.hitEvents[k][1] === ntype) ||
                                            (that.hitEvents[k][1] === mtype && that.hitEvents[k][0] === ntype)
                                        ) {
                                            that.hitEvents[k][2](d[m], d[n]);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            });
        }
        this.draw = function() {
            if (dev) {
                toDraws = [];
                activeCells = [];
                var ttt = this.table
                this.table.for2d(0, 0, 10, 10, function(d, i, j) {
                    if (typeof d === typeof []) {
                        var dt = { x: i, y: j };
                        d.forEach(function(o) {
                            if (typeof o === typeof {} && o._cs) {
                                activeCells.oncePush(dt);
                                toDraws.oncePush(o);
                            }
                        });
                    }
                });
                var tempColor = ctx.strokeStyle;
                ctx.strokeStyle = "green";
                for (var i = 0; i < toDraws.length; i++) {
                    ctx.strokeRect(toDraws[i].x, toDraws[i].y, toDraws[i].w, toDraws[i].h);
                }
                ctx.strokeStyle = "red";
                for (var i = 0; i < activeCells.length; i++) {
                    if (typeof this.table.idx(activeCells[i].x, activeCells[i].y) === typeof [])
                        ctx.strokeRect(activeCells[i].x * 50, activeCells[i].y * 50, 50, 50);
                }
                ctx.strokeStyle = tempColor;
            }
        }
        world.nullPush(this);
    }

    function ColSystemBF() {
        this.register = function(i) {}

        function hit(a, b) {
            return (Math.abs(a.x - b.x) <= (a.w > b.w ? a.w : b.w)) &&
                (Math.abs(a.y - b.y) <= (a.h > b.h ? a.h : b.h));
        }
        this.hitTypes = [];
        this.hitEvents = [];
        this.hitByType = function(a, b, cb) {
            this.hitTypes.oncePush(a);
            this.hitTypes.oncePush(b);
            return this.hitEvents.push([a, b, cb]);
        }
        var that = this;
        this.update = function() {
            for (var m = 0; m < world.length; m++) {
                for (var n = 0; n < world.length; n++) {
                    if (world[m] && world[n] && m !== n) {
                        if (hit(world[m], world[n])) {
                            var mtype, ntype;
                            for (var t = 0; t < that.hitTypes.length; t++) {
                                if (world[m] instanceof that.hitTypes[t]) {
                                    mtype = that.hitTypes[t];
                                }
                                if (world[n] instanceof that.hitTypes[t]) {
                                    ntype = that.hitTypes[t];
                                }
                            }
                            for (var k = 0; k < that.hitEvents.length; k++) {
                                if (
                                    (that.hitEvents[k][0] === mtype && that.hitEvents[k][1] === ntype) ||
                                    (that.hitEvents[k][1] === mtype && that.hitEvents[k][0] === ntype)
                                ) {
                                    that.hitEvents[k][2](world[m], world[n]);
                                }
                            }
                        }
                    }
                }
            }
        }
        this.draw = function() {
            if (dev) {
                world.forEach(function(o) {
                    if (o) {
                        var tempColor = ctx.strokeStyle;
                        ctx.strokeStyle = "green";
                        ctx.strokeRect(o.x, o.y, o.w, o.h);
                        ctx.strokeStyle = tempColor;
                    }
                });
            }
        }
        world.nullPush(this);
    }

    function Level1() {
        this.score = 0;
        this.difficulty = 1;
        this.update = function() {
            if (rnd(0, tps) < this.difficulty) {
                new SpaceRock;
            }
            this.difficulty += (this.difficulty / 60) / tps;
        }
        this.draw = function() {
            ctx.fillText("Score : " + this.score, 10, 10, 500)
            if (dev) {
                ctx.fillText("Difficulty:" + Math.floor(this.difficulty * 1000) / 1000, 10, 25, 500)
            }
        }
        world.nullPush(this);
    }

    function PlayerBullet(x, y) {
        this.x = x;
        this.y = y;
        this.w = 4;
        this.h = 6;
        this.speed = 1200;
        this.update = function() {
            this.y -= this.speed / tps;
            if (this.y < 0) {
                world.remove(this)
            }
        }
        this.draw = function() {
            ctx.fillRect(this.x - 2, this.y - 3, 4, 6);
        }
        world.push(this);
        cs.register(this);
    }

    function Particle(x, y, dir) {
        this.x = x;
        this.y = y;
        this.dx = dir.dx;
        this.dy = dir.dy;
        this.life = 100;
        this.update = function() {
            this.x += this.dx / tps;
            this.y += this.dy / tps;
            this.life -= (Math.random() * 600 + 50) / tps;
            if (this.life <= 0) {
                world.remove(this);
            }
        }
        this.draw = function() {
            ctx.fillRect(this.x, this.y, 1, 1)
        }
    }

    function Explosion(x, y) {
        var num = Math.random() * 250 + 50;
        for (var i = 1; i <= num; i++) {
            world.push(new Particle(x, y, { dx: Math.random() * 100 - 50, dy: Math.random() * 120 + 20 }))
        }
    }

    function SpaceRock() {
        this.x = rnd(0, width);
        this.y = 0;
        this.w = 20;
        this.h = 20;
        this.shape = [
            [rnd(-10, -8), rnd(-6, 6)],
            [rnd(-8, -6), rnd(-10, -8)],
            [rnd(6, 8), rnd(-10, -8)],
            [rnd(8, 10), rnd(-6, 6)],
            [rnd(-7, 7), rnd(7, 10)],
        ]
        this.speed = rnd(20, 300);
        this.update = function() {
            this.y += this.speed / tps;
            if (this.y > height) {
                world.remove(this);
            }
        }
        this.draw = function() {
            ctx.beginPath();
            ctx.moveTo(this.x + this.shape[4][0], this.y + this.shape[4][1]);
            for (var i = 0; i < 5; i++) {
                ctx.lineTo(this.x + this.shape[i][0], this.y + this.shape[i][1]);
            }
            ctx.stroke();
            ctx.closePath();
        }
        world.nullPush(this);
        cs.register(this);
    }

    function Player() {
        this.hp = 100;
        this.x = width / 2;
        this.y = height - 20;
        this.w = 10;
        this.h = 20;
        this.speed = 300;
        this.goingRight = false;
        this.goingLeft = false;
        this.shooting = false;
        this.shootingSpeed = 100;
        this.shootingReload = tps * .15;
        this.shootingCounter = 0;
        this.update = function() {
            if (this.goingRight) {
                this.x += this.speed / tps;
            }
            if (this.goingLeft) {
                this.x -= this.speed / tps;
            }
            if (this.shooting && this.shootingCounter <= 0) {
                new PlayerBullet(this.x, this.y);
                this.shootingCounter = this.shootingReload;
            }
            if (this.shootingCounter > 0) {
                this.shootingCounter -= (this.shootingSpeed / tps);
            }
        }
        this.draw = function() {
            ctx.beginPath();
            ctx.moveTo(this.x, this.y - 10);
            ctx.lineTo(this.x + 5, this.y + 5);
            ctx.lineTo(this.x - 5, this.y + 5);
            ctx.lineTo(this.x, this.y - 10);
            ctx.stroke();
            ctx.closePath();
        }
        world.nullPush(this);
        cs.register(this);
    }
    var cs = new ColSystem(width, height);
    var level = new Level1;
    var player = new Player;

    cs.hitByType(Player, SpaceRock, function(a, b) {
        player.hp -= 1;
        world.remove(a instanceof Player ? b : a);
    })
    cs.hitByType(PlayerBullet, SpaceRock, function(a, b) {
        world.remove(a);
        world.remove(b);
        if (a instanceof SpaceRock) {
            level.score += Math.floor(level.difficulty);
            new Explosion(a.x, a.y)
        }
    })

    document.body.onkeydown = function(e) {
        if (e.keyCode == 39) { //right
            player.goingRight = true;
        }
        if (e.keyCode == 37) { //left
            player.goingLeft = true;
        }
        if (e.keyCode == 32) { //space
            player.shooting = true;
        }
    }
    document.body.onkeyup = function(e) {
        if (e.keyCode == 39) { //right
            player.goingRight = false;
        }
        if (e.keyCode == 37) { //left
            player.goingLeft = false;
        }
        if (e.keyCode == 32) { //space
            player.shooting = false;
        }
    }
    document.body.onkeypress = function(e) {
        if (e.keyCode == 111) {
            dev = dev ? false : true;
        }
    }
}
starwars()