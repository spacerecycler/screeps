let sh = require('shared');
Room.prototype.run = function() {
    if(this.memory.maxHarvesters == null) {
        let count = 0;
        for(let source of this.find(FIND_SOURCES)) {
            let tiles = this.lookForAtArea(LOOK_TERRAIN, source.pos.y-1, source.pos.x-1, source.pos.y+1, source.pos.x+1, true);
            for(let tile of tiles) {
                if(tile.terrain != 'wall') {
                    count++;
                }
            }
        }
        this.memory.maxHarvesters = count;
    }
    if(!this.isMine() && this.memory.type == null) {
        if(this.isKeeperLairRoom()) {
            this.memory.type = sh.ROOM_KEEPER_LAIR;
        } else {
            this.memory.type = sh.ROOM_EXPANSION;
        }
    }
    if(this.mode == MODE_SIMULATION && !this.memory.test) {
        for(let source of this.find(FIND_SOURCES)) {
            let vals = PathFinder.search(Game.spawns.Spawn1.pos, {pos: source.pos, range: 1});
            console.log(vals.path);
            for(let val of vals.path) {
                this.createConstructionSite(val, STRUCTURE_ROAD);
            }
        }
        this.memory.test = true;
    }
    let spawns = this.find(FIND_MY_STRUCTURES, {filter: (target) => target.structureType == STRUCTURE_SPAWN});
    for(let spawn of spawns) {
        spawn.run();
    }
    let towers = this.find(FIND_MY_STRUCTURES, {filter: (target) => target.structureType == STRUCTURE_TOWER});
    for(let tower of towers) {
        tower.run();
    }
};
Room.prototype.isMine = function() {
    return this.controller != null && this.controller.my;
};
Room.prototype.isKeeperLairRoom = function() {
    return !_.isEmpty(this.find(FIND_STRUCTURES, {
        filter: (t) => t.structureType == STRUCTURE_KEEPER_LAIR}));
};
Room.prototype.hasHostileAttacker = function() {
    let targets = this.find(FIND_HOSTILE_CREEPS, {
        filter: (target) => {
            for(let part of target.body) {
                if(sh.ATTACKER_PARTS.has(part.type)) {
                    return true;
                }
            }
            return false;
        }
    });
    return !_.isEmpty(targets);
};
Room.prototype.getContainerCount = function() {
    return _.size(this.find(FIND_STRUCTURES, {
        filter: (target) => target.structureType == STRUCTURE_CONTAINER}));
};
Room.prototype.getTowerCount = function() {
    return _.size(this.find(FIND_MY_STRUCTURES, {
        filter: (target) => target.structureType == STRUCTURE_TOWER}));
};
Room.prototype.findConstructionSites = function(types) {
    if(types == null) {
        return this.find(FIND_MY_CONSTRUCTION_SITES);
    } else {
        return this.find(FIND_MY_CONSTRUCTION_SITES, {
            filter: (target) => {
                return _.includes(types, target.structureType);
            }
        });
    }
};
Room.prototype.findNotFullContainers = function() {
    return this.find(FIND_STRUCTURES, {
        filter: (target) => {
            return target.structureType == STRUCTURE_CONTAINER
                && target.store[RESOURCE_ENERGY] < target.storeCapacity;
        }
    });
};
Room.prototype.isStorageNotFull = function() {
    return this.storage != null && this.storage.store[RESOURCE_ENERGY] < this.storage.storeCapacity;
};
Room.prototype.isStorageNotEmpty = function() {
    return this.storage != null && this.storage.store[RESOURCE_ENERGY] > 0;
};
