import { Game } from "../game.js";
import pieces from "../data/pieces.json" with { type: "json" };
import { statDecimals, statsSecondary as statsSecondaries } from "../data/data.js";

export class Renderer {
    holdQueueGrid = [];
    nextQueueGrid = [];
    inDanger;
    texttimeouts = {};
    
    sidebarStats;
    sidebarFixed;
    sidebarSecondary;

    divBoard = document.getElementById("board");
    divBackboard = document.getElementById("backboard");
    divLinesSent = document.getElementById("linessent");
    elementEditPieces = document.getElementById("editMenuPieces");

    elementStats1 = document.getElementById("stats1");
    elementStats2 = document.getElementById("stats2");
    elementStats3 = document.getElementById("stats3");
    elementStatname1 = document.getElementById("statName1");
    elementStatname2 = document.getElementById("statName2");
    elementStatname3 = document.getElementById("statName3");
    elementSmallStat1 = document.getElementById("smallStat1");
    elementSmallStat2 = document.getElementById("smallStat2");
    elementSmallStat3 = document.getElementById("smallStat3");

    /**
     * @param {Game} game
     */
    constructor(game) {
        this.game = game;
        this.board = game.board;
    }

    updateNext() {
        this.nextQueueGrid = [...Array(15)].map(() => [...Array(4)].map(() => ""));

        const next5 = this.game.bag.getFirstFive();
        next5.forEach((name, idx) => {
            const piece = this.getPiece(name);
            let [dx, dy] = [0, 3 * (4 - idx)];
            if (piece.name == "o") [dx, dy] = [dx + 1, dy + 1]; // shift o piece
            const coords = this.board.pieceToCoords(piece.shape1);
            coords.forEach(([x, y]) => (this.nextQueueGrid[y + dy][x + dx] = "A " + piece.name));
        });

        this.game.pixi.render("next", this.nextQueueGrid);
        // if (this.game.settings.game.gamemode == 'lookahead' || !this.game.settings.display.colouredQueues) return;
        // this.canvasNext.style.outlineColor = this.game.bag.nextPiece().colour;
    }

    getPiece(name) {
        if (name == "G") return { colour: "gray" }
        return pieces.filter(p => p.name == name)[0];
    }

    updateHold() {
        this.holdQueueGrid = [...Array(3)].map(() => [...Array(4)].map(() => ""));
        this.clearHold();
        if (this.game.hold.piece == undefined) return;

        const name = this.game.hold.piece.name;
        const isO = name == "o",
            isI = name == "i";
        const [dx, dy] = [isO ? 1 : 0, isO ? 1 : isI ? -1 : 0];
        const coords = this.board.pieceToCoords(this.game.hold.piece.shape1);

        coords.forEach(([x, y]) => (this.holdQueueGrid[y + dy][x + dx] = "A " + name));
        const len = Math.round(this.game.pixi.minoSize / 2);
        const [shiftX, shiftY] = [isO || isI ? 0 : len, isI ? 0 : len];

        this.game.pixi.render("hold", this.holdQueueGrid);
        // if (this.game.settings.game.gamemode == 'lookahead' || !this.game.settings.display.colouredQueues) return;
        // const colour = this.game.hold.occured ? "gray" : this.game.hold.piece.colour
        // this.canvasHold.style.outline = `0.2vh solid ${colour}`;
    }

    clearHold() {
        this.game.pixi.render("hold", this.holdQueueGrid);
    }

    renderDanger() {
        const condition =
            this.game.board.getMinos("S").some(c => c[1] > 16) && // any mino if above row 16
            this.game.settings.game.gamemode != 'combo'; // not combo mode
        if (condition && !this.inDanger) {
            this.game.sounds.playSound("damage_alert");
        }
        this.game.boardeffects.toggleDangerBoard(condition)
        this.inDanger = condition;
    }

    renderActionText(damagetype, isBTB, isPC, damage, linecount) {
        if (damagetype != "") this.setText("cleartext", damagetype, 2000);
        if (this.game.stats.combo > 0)
            this.setText("combotext", `Combo ${this.game.stats.combo}`, 2000);
        if (isBTB && this.game.stats.btbCount > 0)
            this.setText("btbtext", `BTB ${this.game.stats.btbCount} `, 2000);
        if (isPC) this.setText("pctext", "Perfect Clear", 2000);
        if (damage > 0) this.setText("linessent", `${this.game.mechanics.spikeCounter}`, 1500);

        if (this.game.mechanics.spikeCounter > 0) this.spikePattern("white", 1);
        if (this.game.mechanics.spikeCounter >= 10) this.spikePattern("red", 1.1);
        if (this.game.mechanics.spikeCounter >= 20) this.spikePattern("lime", 1.2);

        // audio
        if (isPC) this.game.sounds.playSound("allclear");
        if (this.game.stats.btbCount == 2 && isBTB) this.game.sounds.playSound("btb_1");
        if (linecount >= 4 && this.game.stats.btbCount > 0) {
            this.game.sounds.playSound("clearbtb");
        } else if (linecount >= 4) {
            this.game.sounds.playSound("clearquad");
        } else if (linecount > 0 && this.game.mechanics.isTspin) {
            this.game.sounds.playSound("clearspin");
        } else if (linecount > 0 && this.game.mechanics.isAllspin && this.game.settings.game.allspin) {
            this.game.sounds.playSound("clearspin");
        } else if (linecount > 0) {
            this.game.sounds.playSound("clearline");
        }
        if (this.game.mechanics.spikeCounter >= 15) this.game.sounds.playSound("thunder", false);
        if (this.game.stats.combo > 0)
            this.game.sounds.playSound(`combo_${this.game.stats.combo > 16 ? 16 : this.game.stats.combo}`);
    }

    resetActionText() {
        ['btbtext', 'cleartext', 'combotext', 'pctext', 'linessent'].forEach(id => {
            document.getElementById(id).style.opacity = "0";
        })
    }

    spikePattern(colour, size) {
        this.divLinesSent.style.color = colour;
        this.divLinesSent.style.textShadow = `0 0 1vh ${colour}`;
        this.divLinesSent.style.fontSize = `${3.5 * size}vh`;
    }

    setText(id, text, duration) {
        const textbox = document.getElementById(id);
        textbox.textContent = text;
        textbox.style.transform = "translateX(-2%)";
        textbox.style.opacity = "1";
        if (this.texttimeouts[id] != 0) this.stopTimeout(id);
        this.texttimeouts[id] = setTimeout(() => {
            textbox.style.opacity = "0";
            textbox.style.transform = "translateX(2%)";
            this.game.mechanics.spikeCounter = 0;
        }, duration);
    }

    stopTimeout(name) {
        clearTimeout(this.texttimeouts[name]);
        this.texttimeouts[name] = 0;
    }

    renderStyles(settings = false) {
        // custom background
        const bg = this.game.settings.display.background;
        if (bg == "") bg = "#080B0C";
        document.body.style.background = (bg[0] == "#") ? bg : `url("${bg}") no-repeat center center`
        document.body.style.backgroundSize = "cover";

        const height = Number(this.game.settings.display.boardHeight);
        this.divBoard.style.transform = `scale(${height}%) translate(-50%, -50%)`;
        // this.canvasHold.style.outline = `0.2vh solid #dbeaf3`;

        // board opacity
        const background = `rgba(0, 0, 0, ${Number(this.game.settings.display.boardOpacity) / 100})`;
        this.divBackboard.style.backgroundColor = background;
        document.body.style.setProperty('--background', background);

        // sidebar constants
        this.sidebarStats = this.game.settings.game.sidebar;
        this.sidebarFixed = this.sidebarStats.map(stat => this.createReverseLookup(statDecimals)[stat]);
        this.sidebarSecondary = this.sidebarStats.map(stat => statsSecondaries[stat] ?? "None");

        this.sidebarStats.forEach((stat, index) => {
            if (stat == "None") stat = ""
            this[`elementStatname${index + 1}`].textContent = stat;
        })

        if (settings) this.game.pixi.resize();
    }

    renderSidebar() {
        this.sidebarStats.forEach((stat, index) => {
            if (stat == "None") { // no stat
                this[`elementStats${index + 1}`].textContent = "";
                return;
            };

            const displayStat = this.game.stats[stat].toFixed(this.sidebarFixed[index]);
            this[`elementStats${index + 1}`].textContent = displayStat;

            if (this.sidebarSecondary[index]) {
                const displaySecond = this.game.stats[this.sidebarSecondary[index]]
                this[`elementSmallStat${index + 1}`].textContent = displaySecond;
            }
        })
    }

    renderTimeLeft(text){
        const e = document.getElementById("timeLeftText")
        if (this.texttimeouts["timeLeft"] != 0){
            this.stopTimeout("timeLeft");
            //e.classList.remove("warn");
        } 
        e.textContent = text
        e.classList.add("warn")
        this.texttimeouts["timeLeft"] = setTimeout(() => {
            e.classList.remove("warn");
        }, 3000);
    }

    createReverseLookup(obj) {
        const reverseLookup = {}
        for (const [key, array] of Object.entries(obj)) {
            array.forEach(item => {
                reverseLookup[item] = key;
            });
        }
        return reverseLookup
    }

    setEditPieceColours() {
        const elPieces = [...this.elementEditPieces.children];
        elPieces.forEach(elpiece => {
            const pieceid = elpiece.id.split("_")[0];
            elpiece.style.backgroundColor = this.getPiece(pieceid).colour
        })
    }

    bounceBoard(direction) {
        const force = Number(this.game.settings.display.boardBounce);
        const forces = { "LEFT": [-force, 0], "RIGHT": [force, 0], "DOWN": [0, force], };
        this.game.boardeffects.move(...forces[direction]);
    }

    rotateBoard(type) {
        const force = Number(this.game.settings.display.boardBounce) * 0.5;
        const forces = { "CW": force, "CCW": -force }
        this.game.boardeffects.rotate(forces[type]);
    }

    dangerParticles() {
        if (!this.inDanger) return;
        this.game.particles.spawnParticles(0, 0, "dangerboard");
        this.game.particles.spawnParticles(0, 20, "dangersides");
    }

}
