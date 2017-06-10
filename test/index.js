/* eslint-disable new-cap, no-unused-expressions, no-undef, global-require */
const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const driverTests = require('thinglator/utils/testDriver');

const expect = chai.expect; // eslint-disable-line no-unused-vars
chai.use(sinonChai);

const driverName = 'aeotec-door-window-sensor';
const driverType = 'sensor';
const driverInterface = 'zwave';

const Driver = require('../index');

driverTests(driverName, Driver, driverType, driverInterface, expect);

describe('functionality', () => {
    let driver;
    let getUnclaimedNodesStub;
    let getNodesClaimedByDriverStub;
    let claimNodeStub;
    let setValueStub;
    let eventEmitterStub;

    beforeEach(() => {
        getUnclaimedNodesStub = sinon.stub().returns(Promise.resolve([
            {
                manufacturer: 'Aeotec',
                manufacturerid: '0x016a',
                product: 'Contact sensor',
                productid: '0x0070',
                nodeid: 3
            },
            {
                manufacturer: 'Foo',
                product: 'Bar',
                nodeid: 4
            }
        ]));

        getNodesClaimedByDriverStub = sinon.stub().returns(Promise.resolve([]));
        claimNodeStub = sinon.stub();
        setValueStub = sinon.stub().returns(Promise.resolve());
        eventEmitterStub = sinon.stub();

        driver = new Driver();
        driver.init({
            get: () => Promise.resolve({})
        }, {
            getValueChangedEventEmitter: () => ({
                on: sinon.stub()
            }),
            getUnclaimedNodes: getUnclaimedNodesStub,
            getNodesClaimedByDriver: getNodesClaimedByDriverStub,
            claimNode: claimNodeStub,
            setValue: setValueStub
        }, {
            emit: eventEmitterStub
        });
    });

    describe('initDevices method', () => {
        it('should initialise existing devices', () => {
            const devices = [{
                _id: 'a',
                specs: {
                    deviceId: 5
                }
            },
            {
                _id: 'b',
                specs: {
                    deviceId: 6
                }
            }];
            return driver.initDevices(devices).then(() => {
                expect(claimNodeStub.firstCall).to.have.been.calledWith('aeotec-door-window-sensor', 5);
                expect(claimNodeStub.secondCall).to.have.been.calledWith('aeotec-door-window-sensor', 6);
            });
        });
    });

    describe('getAuthenticationProcess method', () => {
        it('should return the authentication process', () => {
            expect(driver.getAuthenticationProcess()).to.deep.equal([]);
        });
    });

    describe('discover method', () => {
        it('should look for unclaimed zwave devices and claim them', () => driver.discover().then(() => {
            expect(getUnclaimedNodesStub).to.have.been.calledOnce;
            expect(claimNodeStub).to.have.been.calledOnce;
            expect(claimNodeStub).to.have.been.calledWith('aeotec-door-window-sensor', 3);
        }));
    });


    describe('processIncomingEvent method', () => {
        it('should trigger the contact false event when the correct zwave event is emitted', () => {
            driver.nodeIdCache = {
                5: 'a',
                6: 'b'
            };
            driver.processIncomingEvent({
                comclass: 0, index: 0, nodeId: 6, value: 255
            });
            driver.processIncomingEvent({
                comclass: 1, index: 0, nodeId: 5, value: 0
            });
            expect(eventEmitterStub).to.have.been.calledOnce;
            expect(eventEmitterStub).to.have.been.calledWith(
              'contact',
              'aeotec-door-window-sensor',
              'b',
              { contact: false }
            );
        });

        it('should trigger the contact true event when the correct zwave event is emitted', () => {
            driver.nodeIdCache = {
                5: 'a',
                6: 'b'
            };
            driver.processIncomingEvent({
                comclass: 0, index: 0, nodeId: 6, value: 0
            });
            driver.processIncomingEvent({
                comclass: 1, index: 0, nodeId: 5, value: 123
            });
            expect(eventEmitterStub).to.have.been.calledOnce;
            expect(eventEmitterStub).to.have.been.calledWith(
              'contact',
              'aeotec-door-window-sensor',
              'b',
              { contact: true }
            );
        });
    });
});
