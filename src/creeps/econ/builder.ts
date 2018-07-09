// Builder: Builds any objects
Creep.prototype.runBuilder = function() {
    let target = Game.getObjectById<ConstructionSite>(this.memory.targetId);
    if (target == null) {
        target = this.pos.findNearestConstructionSite([STRUCTURE_WALL, STRUCTURE_RAMPART]);
    }
    if (target == null && this.room.containerCount() == 0) {
        target = this.pos.findNearestConstructionSite([STRUCTURE_CONTAINER]);
    }
    if (target == null) {
        target = this.pos.findNearestConstructionSite([STRUCTURE_ROAD]);
    }
    if (target == null) {
        target = this.pos.findNearestConstructionSite([STRUCTURE_TOWER, STRUCTURE_EXTENSION]);
    }
    if (target == null) {
        target = this.pos.findNearestConstructionSite([STRUCTURE_CONTAINER]);
    }
    if (target == null) {
        target = this.pos.findNearestConstructionSite();
    }
    if (target == null && !_.isEmpty(Game.constructionSites)) {
        target = _.values<ConstructionSite>(Game.constructionSites)[0];
        this.memory.room = target.pos.roomName;
    }
    if (target != null) {
        this.memory.targetId = target.id;
        this.say("building");
        if (this.pos.inRangeTo(target, 3)) {
            this.build(target);
            if (this.carry[RESOURCE_ENERGY] - this.memory.numWorkParts * BUILD_POWER <= 0) {
                return true;
            }
        } else {
            this.moveToI(target);
        }
    } else {
        this.idle();
    }
    return false;
};