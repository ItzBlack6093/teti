import { Game } from "../main.js";

export class Zenith {
        climbPoints = 0;
        isLastRankChangePromote = !0;
        isHyperspeed = false;
        rankLock = 0;
        promotionFatigue = 0;
        rankLock = 0;
        tickPass = 0;
        altitude = 0;
        bonusAltitude = 0;

        FloorDistance = [0, 50, 150, 300, 450, 650, 850, 1100, 1350, 1650, 1 / 0];
        SpeedrunReq = [7, 8, 8, 9, 9, 10, 0, 0, 0, 0, 0];
        
        
        GetSpeedCap(e) {
            const t = this.FloorDistance.find((t => e < t)) - e;
            return Math.max(0, Math.min(1, t / 5 - .2))
        }
        
        GetFloorLevel(e) {
            return this.FloorDistance.filter((t => e >= t)).length || 1
        }

        AwardLines(e, t=!0, n=!0) {
            const s = .25 * Math.floor(Game.stats.climbSpeed);
            this.GiveBonus(s * e * (t ? 1 : 0));
            if (e <= 0 ) return 
            this.GiveClimbPts((e + .05) * (n ? 1 : 0))
        }

        GiveBonus(e) {
            this.bonusAltitude += e
        }

        GiveClimbPts(e) {
            this.climbPoints += e
        }

        tickZenithMode() {
            clearInterval(Game.zenithTimer);
            Game.pixi.CreateSpeedrunContainer()
            Game.pixi.StopSpeedrun()
            if(Game.settings.game.gamemode != "zenith") return
            Game.zenithTimer = setInterval(
                () => {
                        let t = Math.floor(Game.stats.climbSpeed),
                            o = .25 * t,
                            a = this.GetSpeedCap(this.altitude);
                    //calculate climb speed

                    if (this.tickPass >= this.rankLock) {
                        let e = 3;
                        this.climbPoints -= e * (t ** 2 + t) / 3600
                    }
                    const s = 4 * t,
                    i = 4 * (t - 1)                 

                    if (this.climbPoints < 0){
                        if (t <= 1){
                            this.climbPoints = 0;
                        }
                        else {
                            this.climbPoints += i,
                            Game.sounds.playSound("speed_down")
                            this.isLastRankChangePromote = !1
                            t--
                            if(t <= 6 && this.isHyperspeed)
                                {
                                    Game.pixi.StopSpeedrun()
                                    Game.sounds.playSound("zenith_speedrun_end")
                                } 
                        }
                    }
                    else if (this.climbPoints >= s) {
                        this.climbPoints -= s,
                        Game.sounds.playSound("speed_up")
                        this.isLastRankChangePromote = !0,
                        t++;
                        this.rankLock = this.tickPass + Math.max(60, 60 * (5 - this.promotionFatigue));
                        this.promotionFatigue++;
                        if(t >= this.SpeedrunReq[this.GetFloorLevel(this.altitude)] && this.SpeedrunReq[this.GetFloorLevel(this.altitude)] != 0 && !this.isHyperspeed)
                        {
                            Game.pixi.StartSpeedrun()
                            Game.sounds.playSound("zenith_speedrun_start")
                        }
                    }

                if(this.isLastRankChangePromote && this.climbPoints >= 2*(t-1))
                {
                    this.promotionFatigue = 0
                }

                //calculate stats
                    Game.stats.climbSpeed = t + this.climbPoints / (4 * t);
                    
                    const m = this.altitude
                        , x = this.GetFloorLevel(m);
                        if (true) { //expert reversed
                            this.altitude = Math.max(this.FloorDistance[x - 1], m - .05 * (x ** 2 + x + 10) / 60)
                        } else { // normal
                            const e = .25 * t
                            , n = this.GetSpeedCap(m);
                            this.altitude += e / 60 * n
                        }
                    
                    if (this.bonusAltitude > 0)
                        if (this.bonusAltitude <= .05)
                            this.altitude += this.bonusAltitude,
                            this.bonusAltitude = 0;
                        else {
                            const e = Math.min(10, .1 * this.bonusAltitude);
                            this.altitude += e,
                            this.bonusAltitude -= e
                        }

                    if(Game.stats.floor != this.GetFloorLevel(this.altitude)){
                        Game.stats.floorTime[Game.stats.floor - 1] = Game.stats.time
                        Game.stats.floor = this.GetFloorLevel(this.altitude)
                        Game.sounds.playSound("zenith_levelup")
                        Game.renderer.renderTimeLeft("FLOOR " + Game.stats.floor)
                        if(Game.stats.floor == 10 && this.isHyperspeed)
                        {
                            Game.pixi.WinSpeedrun()
                        } 
                    }
                    Game.stats.altitude = this.altitude
                    this.tickPass++

                    /*
                        FATIGUES
                    */

                    if(this.tickPass >= 28800){ //8m
                        
                    }

                    if(this.tickPass >= 36000){ //10m
                        
                    }

                    if(this.tickPass >= 43200){ //12m
                        
                    }
            }
                , 1000 / Game.tickrate);
        }
}

export class Grandmaster {

    gradeBoost = 0; // the one used to determine which grade to shown in the array
    gradePoint = 0; 
    internalGrade = 0; // the one to determine how many grade to boost
    previousSectionTime = 52
    isCoolCheck = false;
    coolsCount = 0;
    regretsCount = 0;
    sectionTarget = 100;
    sectionTime = 0;

    grades = [
        "9","8","7","6","5","4","3","2","1",
        "S1","S2","S3","S4","S5","S6","S7","S8","S9",
        "m1","m2","m3","m4","m5","m6","m7","m8","m9",
        "M","MK","MV","MO","MM-","MM","MM+","GM-","GM","GM+","TM-","TM","TM+"
    ];
    gradePointDecay = [
        125, 80, 80, 50, 45, 45, 45,
        40, 40, 40, 40, 40, 30, 30, 30,
        20, 20, 20, 20, 20,
        15, 15, 15, 15, 15, 15, 15, 15, 15, 15,
        10, 10
    ];
    mult = [
        [1.0, 1.0, 1.0, 1.0],
        [1.0, 1.2, 1.4, 1.5],
        [1.0, 1.2, 1.5, 1.8],
        [1.0, 1.4, 1.6, 2.0],
        [1.0, 1.4, 1.7, 2.2],
        [1.0, 1.4, 1.8, 2.3],
        [1.0, 1.4, 1.9, 2.4],
        [1.0, 1.5, 2.0, 2.5],
        [1.0, 1.5, 2.1, 2.6],
        [1.0, 2.0, 2.5, 3.0],
    ];
    gradePointBonus = [
        [10, 20, 40, 50],
        [10, 20, 30, 40],
        [10, 20, 30, 40],
        [10, 15, 30, 40],
        [10, 15, 20, 40],
        [5, 15, 20, 30],
        [5, 10, 20, 30],
        [5, 10, 15, 30],
        [5, 10, 15, 30],
        [5, 10, 15, 30],
        [2, 12, 13, 30],
    ];
    gradeBoostTable = [
        0,1,2,3,4,5,5,6,6,7,7,7,8,8,8,9,9,9,10,11,12,12,12,13,13,14,14,15,15,16,16,17,17,18,18,19,19,20,20,21,21,22,22,23,23,24,24,25,25,26,26,26,27,27,27,27,28,28,28,28,28,29,29,29,29,29,30,30,30,30,30
    ];

    speedTable = // 1 / 65536 G
    {
        0:1024,
        30:1536,
        35:2048,
        40:2560,
        50:3072,
        60:4096,
        70:8192,
        80:12288,
        90:16384,
        100:20480,
        120:24576,
        140:28672,
        160:32768,
        180:36864,
        200:1024,
        220:8192,
        230:16384,
        233:24576,
        236:32768,
        239:40960,
        243:49152,
        247:57344,
        251:65536,
        300:131072,
        330:196608,
        360:262144,
        400:327680,
        420:262144,
        450:196608,
        500:1310720
    }

    getSpeed(e) {
        return Game.settings.game.gravitySpeed
        const t = Object.keys(this.speedTable);
        for (e = Math.max(0, Math.floor(e)); e >= 1; )
            for (let o = t.length - 1; o >= 0; o--)
                if (e / t[o] >= 1) {
                    if(this.speedTable[t[o]] >= 1310720) return 0
                    e -= t[o]
                    return 1000 / (60 * this.speedTable[t[o]] / 65536);
                }
    }

    coolsTable = [52, 52, 49, 45, 45, 42, 42, 38, 38, 0];
    regretsTable = [90, 75, 75, 68, 60, 60, 50, 50, 50, 50];

    addGrade(row, cmb, lvl){
        if(Game.settings.game.gamemode != "race") return
        this.checkSectionCleared();
        this.checkCool();
        Game.stats.grade = this.grades[this.gradeBoost + this.coolsCount - this.regretsCount];
        if (row<1) return;

        const pts = this.gradePointBonus[Math.min(10, this.internalGrade)][row - 1];
        const cmb_mult = this.mult[Math.min(9, cmb)][row - 1];
        const lvl_mult = Math.floor(lvl / 250) + 1;

        this.gradePoint += pts*cmb_mult*lvl_mult;

        if (this.gradePoint >= 100) {
            this.gradePoint = 0;
            this.internalGrade++;
            this.gradeBoost = this.gradeBoostTable[this.internalGrade];
            this.startGrandmasterTimer();
        };
    }
    
    startGrandmasterTimer(){
        clearInterval(Game.grandmasterTimer);
        if(Game.settings.game.gamemode != "race") return
        Game.grandmasterTimer = setInterval(() => {
            this.gradePoint = Math.max(0, this.gradePoint - 1);
        }, (1000 / 60 * this.gradePointDecay[Math.min(31, this.internalGrade)]) )
    }

    checkSectionCleared(){
        if(Game.stats.tgm_level >= this.sectionTarget){
            Game.animations.showLevelUpText(Math.ceil(this.sectionTarget / 100) + 1);
            Game.sounds.playSound("levelup");
            this.coolsCount = this.isCoolCheck ? this.coolsCount + 1 : this.coolsCount
            if(this.sectionTime >= this.regretsTable[(this.sectionTarget / 100) - 1]){
                Game.renderer.renderTimeLeft("REGRET");
                this.regretsCount++;
            }
            this.sectionTime = 0;
            this.isCoolCheck = false;
            this.sectionTarget = Math.min(this.sectionTarget + 100, Game.settings.game[Game.modes.modeJSON.target])
        }
    }

    checkCool(){
        if(Game.stats.tgm_level % 100 >= 70 && !this.isCoolCheck){
            this.isCoolCheck = true;
            if(this.sectionTime <= Math.min(this.coolsTable[(this.sectionTarget / 100) - 1], this.previousSectionTime + 2)){
                this.previousSectionTime = this.sectionTime;
                Game.renderer.renderTimeLeft("COOL!");
            }
            else{
                this.previousSectionTime = 52;
            }
        }
    }
}
