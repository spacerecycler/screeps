'use strict';
let sh = require('shared');
let flatMap = _.compose(_.compact, _.flatten, _.map);
Creep.prototype.run = function() {
    this.setupMem();
    if(this.memory.role == sh.CREEP_TRANSPORTER || this.ensureRoom()) {
        if(this.memory.role == sh.CREEP_HARVESTER) {
            this.runHarvester();
            return;
        }
        if(this.carryCapacity > 0 && !this.isCreepWorking()) {
            if(this.memory.role == sh.CREEP_TRANSPORTER && !this.ensureRoom()) {
                return;
            }
            let full = this.fillEnergy();
            if(!full) {
                return;
            }
        }
        switch (this.memory.role) {
            case sh.CREEP_UPGRADER:
                this.runUpgrader();
                return;
            case sh.CREEP_BUILDER:
                this.runBuilder();
                return;
            case sh.CREEP_REPAIRER:
                this.runRepairer();
                return;
            case sh.CREEP_CAPTURER:
                this.runCapturer();
                return;
            case sh.CREEP_FILLER:
                this.runFiller();
                return;
            case sh.CREEP_TRANSPORTER:
                this.runTransporter();
                return;
            case sh.CREEP_SCOUT:
                this.runScout();
                return;
            case sh.CREEP_WARRIOR:
                this.runWarrior();
                return;
            case sh.CREEP_RANGER:
                this.runRanger();
                return;
            case sh.CREEP_HEALER:
                this.runHealer();
                return;
            case sh.CREEP_TANK:
                this.runTank();
                return;
        }
    }
};
Creep.prototype.setupMem = function() {
    if(this.memory.numWorkParts == null) {
        this.memory.numWorkParts = 0;
        for(let part of this.body) {
            if(part.type == WORK) {
                this.memory.numWorkParts++;
            }
        }
    }
    if(this.memory.role == sh.CREEP_HARVESTER
        && this.memory.targetSource == null
        && Game.rooms[this.memory.room] != null) {
        let sources = Game.rooms[this.memory.room].findSourcesForHarvester();
        if(_.isEmpty(sources)) {
            this.suicide();
        } else {
            this.memory.targetSource = _.head(sources).id;
        }
    }
    if(_.includes([sh.CREEP_TANK,sh.CREEP_WARRIOR,sh.CREEP_RANGER],
        this.memory.role)
        && this.memory.targetSource == null
        && Game.rooms[this.memory.room] != null) {
        let sources = Game.rooms[this.memory.room].findSourcesForTank();
        if(!_.isEmpty(sources)) {
            this.memory.targetSource = _.head(sources).id;
        }
    }
};
Creep.prototype.runBuilder = function() {
    let target = Game.getObjectById(this.memory.targetId);
    if(target == null) {
        target = this.pos.findNearestConstructionSite([STRUCTURE_WALL,
            STRUCTURE_RAMPART]);
    }
    if(target == null && this.room.getContainerCount() == 0) {
        target = this.pos.findNearestConstructionSite([STRUCTURE_CONTAINER]);
    }
    if(target == null) {
        target = this.pos.findNearestConstructionSite([STRUCTURE_ROAD]);
    }
    if(target == null) {
        target = this.pos.findNearestConstructionSite([STRUCTURE_TOWER,
            STRUCTURE_EXTENSION]);
    }
    if(target == null) {
        target = this.pos.findNearestConstructionSite([STRUCTURE_CONTAINER]);
    }
    if(target == null) {
        target = this.pos.findNearestConstructionSite();
    }
    if(target == null && _.size(Game.constructionSites) > 0) {
        target = _.values(Game.constructionSites)[0];
        this.memory.room = target.room.name;
    }
    if(target != null) {
        this.memory.targetId = target.id;
        if(this.build(target) == ERR_NOT_IN_RANGE) {
            this.moveToS(target);
        }
    } else {
        this.idle();
    }
};
Creep.prototype.runFiller = function() {
    let target = null;
    if(!this.room.hasHostileAttacker()) {
        target = this.pos.findNearestFillTarget([STRUCTURE_EXTENSION]);
        if(target == null) {
            target = this.pos.findNearestFillTarget([STRUCTURE_SPAWN]);
        }
    }
    if(target == null) {
        target = this.pos.findNearestFillTarget([STRUCTURE_TOWER]);
    }
    if(target == null && this.room.isStorageNotFull()
        && (!_.isEmpty(this.room.findNotEmptyContainers())
        || !_.isEmpty(this.room.findNotEmptyLinks()))) {
        target = this.room.storage;
    }
    if(target != null) {
        if(this.pos.isNearTo(target)) {
            this.transfer(target, RESOURCE_ENERGY);
        } else {
            this.moveToS(target);
        }
    } else {
        this.idle();
    }
};
Creep.prototype.runTransporter = function() {
    let target = Game.getObjectById(this.memory.targetId);
    if(target != null
        && target.store[RESOURCE_ENERGY] == target.storeCapacity) {
        delete this.memory.targetId;
        target = null;
    }
    if(target == null) {
        let curEnergy = STORAGE_CAPACITY;
        _.forEach(Memory.config.rooms, (name) => {
            let room = Game.rooms[name];
            if(room != null && room.isMine() && room.isStorageNotFull()
                && room.storage.store[RESOURCE_ENERGY] < curEnergy) {
                target = room.storage;
                curEnergy = room.storage.store[RESOURCE_ENERGY];
            }
        });
        if(target != null) {
            this.memory.targetId = target.id;
        }
    }
    if(target == null) {
        let targets = flatMap(Memory.config.rooms, (name) =>{
            let room = Game.rooms[name];
            if(room != null && room.isMine()) {
                return room.findNotFullContainers();
            }
        });
        let curEnergy = CONTAINER_CAPACITY;
        for(let t of targets) {
            if(t.store[RESOURCE_ENERGY] < curEnergy) {
                target = t;
                curEnergy = t.store[RESOURCE_ENERGY];
            }
        }
        if(target != null) {
            this.memory.targetId = target.id;
        }
    }
    if(target != null) {
        if(this.pos.isNearTo(target)) {
            this.transfer(target, RESOURCE_ENERGY);
        } else {
            this.moveToS(target);
        }
    }
};
Creep.prototype.runHarvester = function() {
    if(!this.isCreepWorking()) {
        let targetSource = Game.getObjectById(this.memory.targetSource);
        if(this.pos.isNearTo(targetSource)) {
            let energyTaken = 0;
            if(this.harvest(targetSource) == OK) {
                energyTaken = Math.min(this.memory.numWorkParts*HARVEST_POWER,
                    targetSource.energy);
                targetSource.energy -= energyTaken;
            }
            if(this.carry[RESOURCE_ENERGY] + energyTaken < this.carryCapacity) {
                return;
            }
        } else {
            this.moveToS(targetSource);
            return;
        }
    }
    let target = null;
    target = this.pos.findNearestNotFullLink();
    if(target != null && !this.pos.isNearTo(target)) {
        target = null;
    }
    if(target == null && this.room.isStorageNotFull()
        && this.pos.inRangeTo(this.room.storage, 3)) {
        target = this.room.storage;
    }
    if(target == null) {
        target = this.pos.findNearestNotFullContainer();
    }
    if(target == null) {
        target = this.pos.findNearestFillTarget([STRUCTURE_EXTENSION]);
    }
    if(target == null) {
        target = this.pos.findNearestFillTarget([STRUCTURE_SPAWN]);
    }
    if(target != null) {
        if(this.pos.isNearTo(target)) {
            this.transfer(target, RESOURCE_ENERGY);
        } else {
            this.moveToS(target);
        }
    } else {
        if(target == null && this.room.getContainerCount() == 0) {
            target = this.pos.findNearestConstructionSite([
                STRUCTURE_CONTAINER]);
        }
        if(target != null) {
            this.build(target);
        }
        this.idle();
    }
};
Creep.prototype.runUpgrader = function() {
    let target = this.room.controller;
    if(this.upgradeController(target) == ERR_NOT_IN_RANGE) {
        this.moveToS(target);
    }
};
Creep.prototype.runRepairer = function() {
    let target = this.tryRepair(this.memory);
    if(target == null) {
        let objects = _.map(Memory.config.blacklist[this.room.name],
            (id) => Game.getObjectById(id));
        target = _.head(_.filter(objects, (t) => t != null
            && t instanceof Structure));
        if(target != null && this.dismantle(target) == ERR_NOT_IN_RANGE) {
            this.moveToS(target);
        }
    }
    if(target == null) {
        this.idle();
    }
};
Creep.prototype.runCapturer = function() {
    if(this.pos.isNearTo(this.room.controller)) {
        if(Memory.config.canClaim) {
            this.claimController(this.room.controller);
            delete this.room.memory.type;
            delete this.room.memory.needReserve;
            Memory.config.canClaim = false;
        } else {
            this.reserveController(this.room.controller);
        }
    } else {
        this.moveToS(this.room.controller);
    }
};
Creep.prototype.runScout = function() {
    let targets = this.room.find(FIND_SOURCES);
    let target = _.head(targets);
    if(!this.pos.isNearTo(target)) {
        this.moveToS(target);
    } else {
        this.suicide();
    }
};
Creep.prototype.runWarrior = function() {
    if(!this.memory.ready) {
        this.memory.ready = true;
    }
    let source = Game.getObjectById(this.memory.targetSource);
    if(source != null) {
        let target = _.head(source.findNearbyHostile());
        if(target != null) {
            if(this.pos.isNearTo(target)) {
                this.attack(target);
            } else {
                this.moveToS(target);
            }
        } else {
            this.idle();
        }
    } else {
        let target = this.pos.findNearestAttacker();
        if(target != null) {
            if(this.attack(target) == ERR_NOT_IN_RANGE) {
                this.moveToS(target);
            }
        } else {
            this.idle();
        }
    }
};
Creep.prototype.runRanger = function() {
    if(!this.memory.ready) {
        this.memory.ready = true;
    }
    let source = Game.getObjectById(this.memory.targetSource);
    if(source != null) {
        let target = _.head(source.findNearbyHostile());
        if(target != null) {
            if(this.pos.inRangeTo(target, 3)) {
                this.rangedAttack(target);
            } else {
                this.moveToS(target);
            }
        } else {
            this.idle();
        }
    } else {
        let target = this.pos.findNearestAttacker();
        if(target != null) {
            if(this.pos.inRangeTo(target, 3)) {
                this.rangedAttack(target);
            } else {
                this.moveToS(target);
            }
        } else {
            this.idle();
        }
    }
};
Creep.prototype.runHealer = function() {
    if(this.hits < this.hitsMax * 0.9) {
        this.heal(this);
    }
    let target = this.pos.findNearestHurtCreep([sh.CREEP_TANK]);
    if(target == null) {
        target = this.pos.findNearestHurtCreep([sh.CREEP_RANGER,
            sh.CREEP_WARRIOR]);
    }
    if(target == null) {
        target = this.pos.findNearestHurtCreep();
    }
    if(target != null) {
        if(this.pos.isNearTo(target)) {
            this.heal(target);
        } else {
            this.rangedHeal(target);
            this.moveToS(target);
        }
    } else {
        this.idle();
    }
};
Creep.prototype.runTank = function() {
    if(!this.memory.ready) {
        this.memory.ready = true;
    }
    let source = Game.getObjectById(this.memory.targetSource);
    let target = _.head(source.findNearbyHostile());
    if(target != null) {
        if(this.pos.isNearTo(target)) {
            this.attack(target);
        } else {
            this.moveToS(target);
        }
    } else {
        this.idle();
    }
};
Creep.prototype.ensureRoom = function() {
    if(_.includes(sh.CREEPS_WARLIKE, this.memory.role)
        && Memory.rooms[this.memory.room].type == sh.ROOM_KEEPER_LAIR) {
        if(!this.rally()) {
            return false;
        }
    }
    if(this.room.name != this.memory.room) {
        if(this.memory.exit == null
            || this.memory.exit.roomName != this.room.name) {
            let exitDir = this.room.findExitTo(this.memory.room);
            this.memory.exit = this.pos.findClosestByPath(exitDir);
        }
        if(this.memory.exit != null) {
            this.moveToS(new RoomPosition(this.memory.exit.x,
                this.memory.exit.y, this.memory.exit.roomName));
        }
        return false;
    } else {
        if(this.memory.exit != null) {
            delete this.memory.exit;
        }
        return true;
    }
};
Creep.prototype.idle = function() {
    let flag = this.pos.findNearestIdleFlag();
    if(!this.pos.isNearTo(flag)) {
        this.moveToS(flag);
    }
};
Creep.prototype.rally = function() {
    if(this.memory.ready) {
        return true;
    }
    if(!_.isEmpty(_.filter(Game.creeps, (c) => c.memory.room == this.memory.room
        && c.memory.ready))) {
        return true;
    }
    let flag = _.head(_.filter(Game.flags, (f) => f.isRally(this.memory.room)));
    if(flag != null) {
        if(this.pos.isNearTo(flag)) {
            if(flag.hasRallyGroup()) {
                this.memory.ready = true;
                return true;
            } else {
                return false;
            }
        } else {
            this.moveToS(flag);
            return false;
        }
    }
};
Creep.prototype.isCreepWorking = function() {
    // work until we have no more energy
    if(this.memory.working && this.carry[RESOURCE_ENERGY] == 0) {
        this.memory.working = false;
    }
    if(!this.memory.working
        && this.carry[RESOURCE_ENERGY] == this.carryCapacity) {
        this.memory.working = true;
        delete this.memory.energyTarget;
    }
    return this.memory.working;
};
Creep.prototype.fillEnergy = function() {
    // most creeps must harvest
    let target = Game.getObjectById(this.memory.energyTarget);
    if(target != null) {
        let energyLeft = 0;
        switch(target.constructor) {
            case StructureContainer:
            case StructureStorage:
                energyLeft = target.store[RESOURCE_ENERGY];
                break;
            case Source:
            case StructureLink:
                energyLeft = target.energy;
                break;
            case Resource:
                energyLeft = target.amount;
        }
        if(energyLeft == 0) {
            target = null;
            delete this.memory.energyTarget;
        }
    }
    if(target == null) {
        if(!this.room.hasHostileAttacker()) {
            target = this.pos.findClosestByPath(FIND_DROPPED_ENERGY);
        }
        if(target == null) {
            target = this.pos.findNearestNotEmptyLink();
        }
        if(target == null) {
            target = this.pos.findNearestNotEmptyContainer();
        }
        if(target == null && this.room.isStorageNotEmpty()) {
            target = this.room.storage;
        }
        if(target == null && this.room.storage == null
            && this.room.getContainerCount() == 0
            && this.memory.role != sh.CREEP_FILLER) {
            target = this.pos.findClosestByPath(FIND_SOURCES);
        }
        if(target != null) {
            this.memory.energyTarget = target.id;
        }
    }
    if(target != null) {
        if(this.pos.isNearTo(target)) {
            let energyTaken = 0;
            if(target instanceof Source) {
                if(this.harvest(target) == OK) {
                    energyTaken = Math.min(
                        this.memory.numWorkParts*HARVEST_POWER,
                        target.energy);
                    target.energy -= energyTaken;
                }
            } else if (target instanceof StructureContainer
                || target instanceof StructureStorage) {
                if(this.withdraw(target, RESOURCE_ENERGY) == OK) {
                    energyTaken = Math.min(
                        target.store[RESOURCE_ENERGY],
                        this.carryCapacity - this.carry[RESOURCE_ENERGY]);
                    target.store[RESOURCE_ENERGY] -= energyTaken;
                }
            } else if (target instanceof Resource) {
                if(this.pickup(target) == OK) {
                    energyTaken = Math.min(target.amount,
                        this.carryCapacity - this.carry[RESOURCE_ENERGY]);
                    target.amount -= energyTaken;
                }
            } else if (target instanceof StructureLink) {
                if(this.withdraw(target, RESOURCE_ENERGY) == OK) {
                    energyTaken = Math.min(target.energy,
                        this.carryCapacity - this.carry[RESOURCE_ENERGY]);
                    target.energy -= energyTaken;
                }
            } else {
                console.log('error unable to load energy: ' + target);
            }
            return this.carry[RESOURCE_ENERGY] + energyTaken >= this.carryCapacity;
        } else {
            this.moveToS(target);
        }
    } else {
        this.idle();
    }
    return false;
};
Creep.prototype.moveToS = function(target) {
    this.moveTo(target, {reusePath: 4});
};
Creep.prototype.doRepair = function(target) {
    if(this.repair(target) == ERR_NOT_IN_RANGE) {
        this.moveToS(target);
    }
};
