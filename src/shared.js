'use strict';
let sh = {
    CREEP_HARVESTER: 'harvester',
    CREEP_UPGRADER: 'upgrader',
    CREEP_BUILDER: 'builder',
    CREEP_REPAIRER: 'repairer',
    CREEP_CAPTURER: 'capturer',
    CREEP_FILLER: 'filler',
    CREEP_TRANSPORTER: 'transporter',
    CREEP_TRANSFER: 'transfer',
    CREEP_SCOUT: 'scout',
    CREEP_WARRIOR: 'warrior',
    CREEP_RANGER: 'ranger',
    CREEP_HEALER: 'healer',
    CREEP_TANK: 'tank',
    CREEP_MINERAL_HARVESTER: 'mineralHarvester',
    CREEPS_WARLIKE: ['warrior','ranger','healer','tank'],
    FLAG_IDLE: 'idle',
    FLAG_RALLY: 'rally',
    ROOM_EXPANSION: 'expansion',
    ROOM_KEEPER_LAIR: 'keeperLair',
    RESERVATION_MIN: 1000,
    RESERVATION_MAX: 2000,
    ATTACKER_PARTS: new Set([RANGED_ATTACK,ATTACK,CLAIM])
};
module.exports = Object.freeze(sh);
