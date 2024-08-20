// @ts-check
import { Game } from "./game.js";
import { toHex } from "./util.js";

export class Rendering {
    boardAlpha;
    boardAlphaChange;
    boardHeight;
    boardWidth;
    holdHeight;
    holdWidth;
    nextHeight;
    nextWidth;
    holdQueueGrid = [];
    nextQueueGrid = [];
    inDanger;
    minoSize;

    canvasField = document.getElementById("playingfield");
    canvasNext = document.getElementById("next");
    canvasHold = document.getElementById("hold");
    divBoard = document.getElementById("board");
    divDanger = document.getElementById("dangerOverlay");
    divLinesSent = document.getElementById("linessent");
    elementStats1 = document.getElementById("stats1");
    elementStats2 = document.getElementById("stats2");
    elementStats3 = document.getElementById("stats3");

    elementSmallStat1 = document.getElementById("smallStat1");
    elementSmallStat2 = document.getElementById("smallStat2");
    ctx;
    ctxN;
    ctxH;

    /**
     * @param {Game} game
     */
    constructor(game) {
        this.game = game;
        this.board = game.board;

        this.ctx = this.canvasField.getContext("2d");
        this.ctxN = this.canvasNext.getContext("2d");
        this.ctxH = this.canvasHold.getContext("2d");
    }

    sizeCanvas() {
        this.divBoard.setAttribute("style", "");
        this.game.rendering.renderStyles();
        // this.canvasField.offsetWidth = this.divBoard.width;
        [this.canvasField, this.canvasNext, this.canvasHold].forEach(c => {
            c.width = Math.round(c.offsetWidth / 10) * 10;
            c.height = Math.round(c.offsetHeight / 40) * 40;
        });
        this.divBoard.style.width = `${this.canvasField.width}px`;
        this.divBoard.style.height = `${this.canvasField.height / 2}px`;
        this.minoSize = this.canvasField.width / 10;
        this.boardWidth = this.canvasField.offsetWidth;
        this.boardHeight = this.canvasField.offsetHeight;
        this.nextWidth = this.canvasNext.offsetWidth;
        this.nextHeight = this.canvasNext.offsetHeight;
        this.holdWidth = this.canvasHold.offsetWidth;
        this.holdHeight = this.canvasHold.offsetHeight;
    }

    updateNext() {
        this.nextQueueGrid = [...Array(15)].map(() => [...Array(4)].map(() => ""));
        const first5 = this.game.nextPieces[0]
            .concat(this.game.nextPieces[1])
            .slice(0, this.game.gameSettings.nextPieces);
        first5.forEach((name, idx) => {
            const piece = this.game.utils.getPiece(name),
                pn = piece.name;
            let dx = 0,
                dy = 3 * (4 - idx);
            if (pn == "o") [dx, dy] = [dx + 1, dy + 1];
            this.board
                .pieceToCoords(piece.shape1)
                .forEach(([x, y]) => (this.nextQueueGrid[y + dy][x + dx] = "A " + pn));
        });
        this.renderToCanvas(this.ctxN, this.nextQueueGrid, 15, [0, 0], this.nextWidth, this.nextHeight);
        if (this.game.gameSettings.gamemode == 8 || !this.game.displaySettings.colouredQueues)
            return;
        this.canvasNext.style.outlineColor = this.game.pieces.filter(e => e.name == first5[0])[0].colour;
    }

    updateHold() {
        this.holdQueueGrid = [...Array(3)].map(() => [...Array(4)].map(() => ""));
        this.ctxH.clearRect(
            0,
            0,
            this.canvasHold.offsetWidth + 10,
            this.canvasHold.offsetHeight
        );
        if (this.game.holdPiece.piece == undefined) return;
        const name = this.game.holdPiece.piece.name;
        const isO = name == "o",
            isI = name == "i";
        const [dx, dy] = [isO ? 1 : 0, isO ? 1 : isI ? -1 : 0];
        const coords = this.board.pieceToCoords(this.game.holdPiece.piece.shape1);
        coords.forEach(([x, y]) => (this.holdQueueGrid[y + dy][x + dx] = "A " + name));
        const len = Math.round(this.minoSize / 2);
        const [shiftX, shiftY] = [isO || isI ? 0 : len, isI ? 0 : len];
        this.renderToCanvas(
            this.ctxH,
            this.holdQueueGrid,
            2,
            [shiftX, shiftY],
            this.holdWidth,
            this.holdHeight
        );
        if (this.game.gameSettings.gamemode == 8 || !this.game.displaySettings.colouredQueues)
            return;
        this.canvasHold.style.outline = `0.2vh solid ${this.game.holdPiece.piece.colour}`;
    }

    clearHold() {
        this.ctxH.clearRect(0, 0, this.canvasHold.offsetWidth + 10, this.canvasHold.offsetHeight);
    }

    renderDanger() {
        const condition = this.game.board.getMinos("S").some(c => c[1] > 16) && this.game.gameSettings.gamemode != 7;
        if (condition && !this.inDanger) this.game.sounds.playSound("damage_alert");
        this.inDanger = condition;
        this.divDanger.style.opacity = condition ? 0.1 : 0;
    }

    renderActionText(damagetype, isBTB, isPC, damage, linecount) {
        if (damagetype != "") this.setText("cleartext", damagetype, 2000);
        if (this.game.mechanics.combonumber > 0) this.setText("combotext", `Combo ${this.game.mechanics.combonumber}`, 2000);
        if (isBTB && this.game.mechanics.btbCount > 0) this.setText("btbtext", `BTB ${this.game.mechanics.btbCount} `, 2000);
        if (isPC) this.setText("pctext", "Perfect Clear", 2000);
        if (damage > 0) this.setText("linessent", `${this.game.mechanics.spikeCounter}`, 1500);

        if (this.game.mechanics.spikeCounter > 0) this.spikePattern("white", 1);
        if (this.game.mechanics.spikeCounter >= 10) this.spikePattern("red", 1.1);
        if (this.game.mechanics.spikeCounter >= 20) this.spikePattern("lime", 1.2);

        if (isPC) this.game.sounds.playSound("allclear");
        if (this.game.mechanics.btbCount == 2 && isBTB) this.game.sounds.playSound("btb_1");
        if (linecount == 4 && this.game.mechanics.btbCount > 0) {
            this.game.sounds.playSound("clearbtb");
        } else if (linecount == 4) {
            this.game.sounds.playSound("clearquad");
        } else if (linecount > 0 && this.game.mechanics.isTspin) {
            this.game.sounds.playSound("clearspin");
        } else if (linecount > 0) {
            this.game.sounds.playSound("clearline");
        }
        if (this.game.mechanics.spikeCounter >= 15) this.game.sounds.playSound("thunder", false);
        if (this.game.mechanics.combonumber > 0) this.game.sounds.playSound(`combo/combo_${this.game.mechanics.combonumber > 16 ? 16 : this.game.mechanics.combonumber}`);
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
        textbox.style.opacity = 1;
        if (this.game.timeouts[id] != 0) this.game.utils.stopTimeout(id);
        this.game.timeouts[id] = setTimeout(() => {
            textbox.style.opacity = 0;
            textbox.style.transform = "translateX(2%)";
            this.game.mechanics.spikeCounter = 0;
        }, duration);
    }

    renderStyles() {
        document.body.style.background = this.game.displaySettings.background;
        const height = Number(this.game.displaySettings.boardHeight) + 10;
        this.divBoard.style.transform = `scale(${height}%) translate(-50%, -50%)`;
        this.canvasHold.style.outline = `0.2vh solid #dbeaf3`;
        const background = `rgba(0, 0, 0, ${Number(this.game.displaySettings.boardOpacity) / 100})`;
        this.divBoard.style.backgroundColor = background;
        this.canvasHold.style.backgroundColor = background;
        this.canvasNext.style.backgroundColor = background;
    }

    renderStats() {
        this.game.totalTimeSeconds += 0.02;
        const displaytime = (Math.round(this.game.totalTimeSeconds * 10) / 10).toFixed(1);
        let pps = 0.0,
            apm = 0.0;
        if (this.game.totalTimeSeconds != 0)
            pps = Math.round((this.game.mechanics.totalPieceCount * 100) / this.game.totalTimeSeconds) / 100;
        if (this.game.totalTimeSeconds != 0)
            apm = Math.round((this.game.mechanics.totalAttack * 10) / (this.game.totalTimeSeconds / 60)) / 10;
        this.elementStats1.textContent = `${displaytime}`;
        this.elementStats2.textContent = `${apm.toFixed(1)}`;
        this.elementStats3.textContent = `${pps.toFixed(2)}`;
        this.elementSmallStat1.textContent = `${this.game.mechanics.totalAttack}`;
        this.elementSmallStat2.textContent = `${this.game.mechanics.totalPieceCount}`;
        this.game.objectives();
    }

    // board rendering
    renderToCanvas(cntx, grid, yPosChange, [dx, dy] = [0, 0], width, height) {
        if (this.game.gameSettings.gamemode == 8) {
            if (this.game.mechanics.totalPieceCount % this.game.gameSettings.lookAheadPieces == 0 && !this.game.movedPieceFirst) {
                if (this.boardAlpha <= 0) {
                    this.boardAlphaChange = 0;
                    this.boardAlpha = 1;
                }
            } else {
                if (this.boardAlpha >= 1) this.boardAlphaChange = -0.05;
                if (this.boardAlpha <= 0) this.boardAlphaChange = 0;
            }
        }
        if (this.boardAlphaChange != 0) this.boardAlpha += this.boardAlphaChange;
        cntx.globalAlpha = this.boardAlpha.toFixed(2);
        cntx.clearRect(0, 0, width, height);
        grid.forEach((row, y) => {
            row.forEach((col, x) => {
                const [posX, posY] = [x * this.minoSize, (yPosChange - y) * this.minoSize];
                const cell = col.split(" ");
                cntx.lineWidth = 1;
                if (cell.includes("A") || cell.includes("S")) {
                    // active piece or stopped piece
                    cntx.fillStyle = cell.includes("G") // garbage piece
                        ? "gray"
                        : this.game.pieces.filter(p => p.name == cell[1])[0].colour;
                    cntx.fillRect(posX + dx, posY + dy, this.minoSize, this.minoSize);
                    cntx.globalAlpha = this.boardAlpha.toFixed(2);
                } else if (cell.includes("NP") && this.inDanger) {
                    // next piece overlay
                    cntx.fillStyle = "#ff000020";
                    cntx.fillRect(posX, posY, this.minoSize, this.minoSize);
                } else if (cell.includes("Sh")) {
                    // shadow piece
                    const colour = this.game.displaySettings.colouredShadow ? this.game.currentPiece.colour : "#ffffff";
                    cntx.fillStyle = colour + toHex(this.game.displaySettings.shadowOpacity);
                    cntx.fillRect(posX, posY, this.minoSize, this.minoSize);
                } else if (y < 20 && this.game.displaySettings.showGrid && cntx == this.ctx) {
                    // grid
                    cntx.strokeStyle = "#ffffff" + toHex(this.game.displaySettings.gridopacity);
                    cntx.beginPath();
                    cntx.roundRect(posX, posY, this.minoSize - 1, this.minoSize - 1, this.minoSize / 4);
                    cntx.stroke();
                }
            });
        });
    }

    renderingLoop() {
        this.renderToCanvas(this.ctx, this.game.board.boardState, 39, [0, 0], this.boardWidth, this.boardHeight);
        if (this.boardAlphaChange != 0) {
            this.updateNext();
            this.updateHold();
        }
        setTimeout(() => requestAnimationFrame(this.renderingLoop.bind(this)), 0);
    }
}
