require('source');
require('room');
require('link');
require('room_pos');
require('spawn');
require('tower');
require('creep');
let m = {
    /** Main loop function for screeps **/
    loop: function() {
        m.setupMem();
        m.clearMem();
        _.forEach(Memory.config.rooms, (name) => {
            let room = Game.rooms[name];
            if(room != null) {
                room.run();
            }
        });
        _.forEach(Game.creeps, (creep) => {
            creep.run();
        });
    },
    setupMem: function() {
        if(Memory.towers == null) {
            Memory.towers = {};
        }
        if(Memory.links == null) {
            Memory.links = {};
        }
        if(Memory.config == null) {
            Memory.config = {};
        }
        _.defaults(Memory.config, {
            wallsMax: 5000,
            rooms: [],
            blacklist: []
        });
        if(_.isEmpty(Memory.config.rooms)) {
            _.forEach(Game.spawns, (spawn) => {
                Memory.config.rooms.push(spawn.room.name);
            });
        }
        _.forEach(Memory.config.rooms, (name) => {
            if(Memory.rooms[name] == null) {
                Memory.rooms[name] = {};
            }
        });
    },
    /** Clear unused memory **/
    clearMem: function() {
        _.forEach(Memory.creeps, (value, name) => {
            if(!Game.creeps[name]) {
                delete Memory.creeps[name];
            }
        });
        _.forEach(Memory.towers, (value, id) => {
            if(!Game.getObjectById(id)) {
                delete Memory.towers[id];
            }
        });
        _.remove(Memory.config.blacklist, (id) => {
            return Game.getObjectById(id) == null;
        });
    }
};
module.exports = m;
