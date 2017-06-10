class AeotecDoorWindowSensor {
    constructor() {
        this.driverSettings = {};
        this.nodeIdCache = {};
        this.commsInterface = null;
        this.processIncomingEvent = this.processIncomingEvent.bind(this);
    }
    init(driverSettingsObj, commsInterface, eventEmitter) {
        this.driverSettingsObj = driverSettingsObj;

        this.eventEmitter = eventEmitter;
        this.commsInterface = commsInterface;
        return this.driverSettingsObj.get().then((settings) => {
            this.driverSettings = settings;

            this.commsInterface.getValueChangedEventEmitter()
              .on('aeotec-door-window-sensor', this.processIncomingEvent);
        });
    }

    getName() {
        return 'aeotec-door-window-sensor';
    }

    getType() {
        return 'sensor';
    }

    getInterface() {
        return 'zwave';
    }

    getEventEmitter() {
        return this.eventEmitter;
    }

    getNodeId(deviceId) {
        let foundNodeId = null;
        Object.keys(this.nodeIdCache).forEach((nodeId) => {
            if (this.nodeIdCache[nodeId] === deviceId) {
                foundNodeId = nodeId;
            }
        });
        return foundNodeId;
    }

    initDevices(devices) {
        return Promise.resolve().then(() => {
            this.nodeIdCache = {};
            devices.forEach((device) => {
                this.commsInterface.claimNode('aeotec-door-window-sensor', device.specs.deviceId);
                this.nodeIdCache[device.specs.deviceId] = device._id;
            });
        });
    }

    getAuthenticationProcess() {
        return [];
    }

    discover() {
        return this.commsInterface.getUnclaimedNodes().then((nodes) => {
            nodes.forEach((node) => {
                if ((node.manufacturerid === '0x016a') && (node.productid === '0x0070')) {
                    this.commsInterface.claimNode('aeotec-door-window-sensor', node.nodeid);
                }
            });

            return this.commsInterface.getNodesClaimedByDriver('aeotec-door-window-sensor');
        }).then((nodes) => {
            const devices = [];
            nodes.forEach((node) => {
                devices.push({
                    deviceId: node.nodeid,
                    name: 'Door / window sensor',
                    commands: {},
                    events: {
                        contact: true
                    }
                });
            });
            return devices;
        });
    }

    processIncomingEvent(event) {
        if (event.comclass === 0 && event.index === 0) {
            if (event.value === 0) {
                this.eventEmitter.emit('contact', 'aeotec-door-window-sensor', this.nodeIdCache[event.nodeId], {
                    contact: true
                });
            } else if (event.value === 255) {
                this.eventEmitter.emit('contact', 'aeotec-door-window-sensor', this.nodeIdCache[event.nodeId], {
                    contact: false
                });
            }
        }
    }

}

module.exports = AeotecDoorWindowSensor;
