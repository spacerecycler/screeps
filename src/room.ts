import { ATTACKER_PARTS, CreepType, FlagType, RESERVATION_MAX, RESERVATION_MIN, RoomType } from "shared";
Room.prototype.run = function() {
    const spawns = this.find<StructureSpawn>(FIND_MY_STRUCTURES, {
        filter: (t) => t.structureType == STRUCTURE_SPAWN
    });
    if (!_.isEmpty(spawns) && _.isEmpty(this.findIdleFlags())) {
        const result = this.createFlag(spawns[0].pos.x, spawns[0].pos.y - 3,
            "Idle" + this.name);
        if (_.isString(result)) {
            Memory.flags[result] = { type: FlagType.FLAG_IDLE };
        } else {
            console.log("error creating flag");
        }
    }
    for (const spawn of spawns) {
        spawn.run();
    }
    const towers = this.find<StructureTower>(FIND_MY_STRUCTURES, {
        filter: (t) => t.structureType == STRUCTURE_TOWER
    });
    for (const tower of towers) {
        tower.run();
    }
    const links = this.find<StructureLink>(FIND_MY_STRUCTURES, {
        filter: (t) => t.structureType == STRUCTURE_LINK
    });
    for (const link of links) {
        link.run();
    }
    // if(this.isMine()) {
    //     let road = _.head(this.find(FIND_STRUCTURES, {filter: (s) => {
    //         return s.structureType == STRUCTURE_ROAD
    //             && s.pos.lookFor(LOOK_TERRAIN) == 'plain';
    //     }}));
    //     if(road != null) {
    //         road.destroy();
    //     }
    // }
};
Room.prototype.setupMem = function() {
    if (!this.isMine() && this.memory.type == null) {
        if (this.isKeeperLairRoom()) {
            this.memory.type = RoomType.ROOM_KEEPER_LAIR;
        } else {
            this.memory.type = RoomType.ROOM_EXPANSION;
        }
    }
    if (this.controller != null) {
        this.memory.controllerReserveSpots =
            this.controller.reserveSpots();
    }
    if (this.memory.type == RoomType.ROOM_EXPANSION && this.controller != null) {
        if (this.controller.reservation == null) {
            this.memory.needReserve = true;
        } else {
            if (this.controller.reservation.ticksToEnd <
                RESERVATION_MIN) {
                this.memory.needReserve = true;
            }
            if (this.controller.reservation.ticksToEnd >
                RESERVATION_MAX) {
                this.memory.needReserve = false;
            }
        }
    }
    if (this.memory.type == RoomType.ROOM_EXPANSION
        && this.memory.shouldClaim == null) {
        this.memory.shouldClaim = true;
    }
};
Room.prototype.needsRecovery = function() {
    const roomCreeps = _.filter(Game.creeps, (creep) => {
        return Array<CreepTypeConstant>(CreepType.CREEP_HARVESTER,
            CreepType.CREEP_FILLER).includes(Memory.creeps[creep.name].role)
            && Memory.creeps[creep.name].room == this.name;
    });
    return _.isEmpty(roomCreeps);
};
Room.prototype.isMine = function() {
    return this.controller != null && this.controller.my;
};
Room.prototype.isKeeperLairRoom = function() {
    return !_.isEmpty(this.find(FIND_STRUCTURES, {
        filter: (t) => t.structureType == STRUCTURE_KEEPER_LAIR
    }));
};
Room.prototype.hasHostileAttacker = function() {
    if (this._hostileAttacker == null) {
        const targets = this.find(FIND_HOSTILE_CREEPS, {
            filter: (t) => {
                for (const part of t.body) {
                    if (ATTACKER_PARTS.has(part.type)) {
                        return true;
                    }
                }
                return false;
            }
        });
        this._hostileAttacker = !_.isEmpty(targets);
    }
    return this._hostileAttacker;
};
Room.prototype.hasHurtCreep = function() {
    if (this._hurtCreep == null) {
        this._hurtCreep = !_.isEmpty(this.find(FIND_MY_CREEPS, {
            filter: (t) => t.hits < t.hitsMax
        }));
    }
    return this._hurtCreep;
};
Room.prototype.containerCount = function() {
    if (this._containerCount == null) {
        this._containerCount = _.size(this.find(FIND_STRUCTURES, {
            filter: (t) => {
                return t.structureType == STRUCTURE_CONTAINER
                    && !_.includes(Memory.config.blacklist[this.name], t.id)
                    && !t.isHostileNearby();
            }
        }));
    }
    return this._containerCount;
};
Room.prototype.hasTower = function() {
    if (this._hasTower == null) {
        this._hasTower = !_.isEmpty(this.find(FIND_MY_STRUCTURES, {
            filter: (t) => t.structureType == STRUCTURE_TOWER
        }));
    }
    return this._hasTower;
};
Room.prototype.hasSpawn = function() {
    if (this._hasSpawn == null) {
        this._hasSpawn = !_.isEmpty(this.find(FIND_MY_STRUCTURES, {
            filter: (t) => t.structureType == STRUCTURE_SPAWN
        }));
    }
    return this._hasSpawn;
};
Room.prototype.findConstructionSites = function(types) {
    if (types == null) {
        return this.find(FIND_MY_CONSTRUCTION_SITES, {
            filter: (t) => !t.isHostileNearby()
        });
    } else {
        return this.find(FIND_MY_CONSTRUCTION_SITES, {
            filter: (t) => {
                return _.includes(types, t.structureType)
                    && !t.isHostileNearby();
            }
        });
    }
};
Room.prototype.findNotFullContainers = function() {
    return this.find<StructureContainer>(FIND_STRUCTURES, {
        filter: (t) => {
            return t.structureType == STRUCTURE_CONTAINER
                && t.store[RESOURCE_ENERGY] < t.storeCapacity;
        }
    });
};
Room.prototype.findNotEmptyContainers = function() {
    return this.find<StructureContainer>(FIND_STRUCTURES, {
        filter: (t) => {
            return t.structureType == STRUCTURE_CONTAINER
                && t.store[RESOURCE_ENERGY] > 0;
        }
    });
};
Room.prototype.findNotEmptyLinks = function() {
    return this.find<StructureLink>(FIND_MY_STRUCTURES, {
        filter: (t) => {
            return t.structureType == STRUCTURE_LINK
                && t.energy > 0
                && !Memory.links[t.id].nearSource;
        }
    });
};
Room.prototype.isStorageNotFull = function() {
    return this.storage != null
        && this.storage.store[RESOURCE_ENERGY] < this.storage.storeCapacity;
};
Room.prototype.isStorageNotEmpty = function() {
    return this.storage != null && this.storage.store[RESOURCE_ENERGY] > 0;
};
Room.prototype.findSourcesForTank = function() {
    return this.find(FIND_SOURCES, {
        filter: (t) =>
            !_.includes(Memory.config.blacklist[this.name], t.id)
    });
};
Room.prototype.findSourcesForHarvester = function() {
    return this.find(FIND_SOURCES, {
        filter: (t) => t.needsHarvester()
            && !_.includes(Memory.config.blacklist[this.name], t.id)
    });
};
Room.prototype.findExtractorForHarvester = function() {
    return _.head(this.find<StructureExtractor>(FIND_MY_STRUCTURES,
        { filter: (t) => t.structureType == STRUCTURE_EXTRACTOR }));
};
Room.prototype.checkNeedHarvester = function() {
    return !_.isEmpty(this.findSourcesForHarvester());
};
Room.prototype.findIdleFlags = function() {
    return this.find(FIND_FLAGS, { filter: (f) => f.isIdle() });
};
Room.prototype.getDistanceToRoom = function(otherRoom) {
    let name = null;
    if (_.isString(otherRoom)) {
        name = otherRoom;
    } else {
        name = otherRoom.name;
    }
    let distance = this.memory.distance[name];
    if (distance == null) {
        const route = Game.map.findRoute(this, name);
        if (route != ERR_NO_PATH) {
            distance = route.length;
        }
        this.memory.distance[name] = distance;
    }
    return distance;
};
Room.prototype.isNearTo = function(otherRoom) {
    return this.getDistanceToRoom(otherRoom) < 3;
};