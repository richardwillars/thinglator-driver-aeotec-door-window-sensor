const driverId = 'thinglator-driver-aeotec-door-window-sensor';
let nodeIdCache = {};

const initDevices = async (devices, commsInterface) => {
  nodeIdCache = {};
  devices.forEach((device) => {
    commsInterface.claimNode(driverId, device.specs.originalId);
    nodeIdCache[device.specs.originalId] = device._id;
  });
};

const discover = async (commsInterface, events) => {
  const unclaimedNodes = await commsInterface.getUnclaimedNodes();
  unclaimedNodes.forEach((node) => {
    if ((node.manufacturer === 'Unknown: id=016a') && (node.product === 'Unknown: type=0002, id=0070')) {
//    if ((node.manufacturer === 'Aeotec') && (node.product === 'Door window sensor')) {
      commsInterface.claimNode(driverId, node.nodeId);
    }
  });

  const claimedNodes = await commsInterface.getNodesClaimedByDriver(driverId);
  const devices = [];
  claimedNodes.forEach((node) => {
    devices.push({
      originalId: node.nodeId,
      name: node.product,
      commands: {},
      events: {
        [events.CONTACT]: true
      },
    });
  });
  return devices;
};

const processIncomingEvent = (info, createEvent, events) => {
  if (info.comClass === 0 && info.index === 0) {
    if(info.value === 0) {
      createEvent(events.CONTACT, nodeIdCache[info.nodeId], {
        contact: true,
      });
    }
    else if(info.value === 255) {
      createEvent(events.CONTACT, nodeIdCache[info.nodeId], {
        contact: false,
      });
    }
  }
};


module.exports = async (getSettings, updateSettings, commsInterface, events, createEvent, eventEmitter) => {
  eventEmitter.on(driverId, e => processIncomingEvent(e, createEvent, events));

  return {
    initDevices: async devices => initDevices(devices, commsInterface),
    authentication_getSteps: [],
    discover: async () => discover(commsInterface, events)
  };
};
