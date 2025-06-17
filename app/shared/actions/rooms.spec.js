import {Map, List} from 'immutable';
import {RoomModel} from '../models/RoomModel';
import {
  loginUserFormRequest
  , roomCreateRequest
  , roomJoinRequest
  , roomExitRequest
  , roomEditSettingsRequest
  , roomKickRequest
  , roomSpectateRequest
  , roomBanRequest
  , roomStartVotingRequest
  , roomStartVoteActionRequest
  , USER_LOGOUT_TIMEOUT
} from '../actions/actions';

import {testShiftTime} from '../utils/reduxTimeout'

import {selectRoom} from '../selectors';

describe('Rooms:', function () {
  describe('Lifecycle:', function () {
    it('Simple create', () => {
      const [serverStore, {clientStore0, User0}] = mockStores(1);
      clientStore0.dispatch(roomCreateRequest());
      const Room = serverStore.getState().get('rooms').first();
      expect(serverStore.getState().get('rooms'), 'serverStore.rooms').equal(Map({[Room.id]: Room}));
      expect(clientStore0.getState().get('room'), 'clientStore.room').equal(Room.id);
      expect(clientStore0.getState().get('rooms'), 'clientStore.rooms').equal(Map({[Room.id]: Room}));
    });

    it('Simple join', () => {
      const [serverStore, {clientStore0, User0}, {clientStore1, User1}] = mockStores(2);
      clientStore0.dispatch(roomCreateRequest());
      expect(clientStore1.getState().get('room'), 'clientStore1.room').null;
      expect(clientStore1.getState().get('game'), 'clientStore1.game').null;
      clientStore1.dispatch(roomJoinRequest(serverStore.getState().get('rooms').first().id));
      const Room = serverStore.getState().get('rooms').first();
      expect(serverStore.getState().getIn(['rooms', Room.id, 'users']), 'Room.users').equal(List([User0.id, User1.id]));

      expect(clientStore0.getState().get('room'), 'clientStore0.room').equal(Room.id);
      expect(clientStore0.getState().getIn(['rooms', Room.id]), 'clientStore0.Room').equal(Room);
      expect(clientStore0.getState().getIn(['rooms', Room.id, 'users']), 'clientStore0.Room.users').equal(List([User0.id, User1.id]));

      expect(clientStore1.getState().get('room'), 'clientStore1.room').equal(Room.id);
      expect(clientStore1.getState().getIn(['rooms', Room.id]), 'clientStore1.Room').equal(Room);
      expect(clientStore1.getState().getIn(['rooms', Room.id, 'users']), 'clientStore1.Room.users').equal(List([User0.id, User1.id]));

      expectUnchanged('User0 cannot join'
        , () => clientStore0.dispatch(roomJoinRequest(Room.id))
        , serverStore, clientStore0, clientStore1)
    });

    it('User0 creates Room, User1 logins', () => {
      const serverStore = mockServerStore();
      const clientStore0 = mockClientStore().connect(serverStore);
      const clientStore1 = mockClientStore().connect(serverStore);

      clientStore0.dispatch(loginUserFormRequest('/test', {id: 'test', login: 'User0'}));
      clientStore0.dispatch(roomCreateRequest());

      const Room = serverStore.getState().get('rooms').first();

      clientStore1.dispatch(loginUserFormRequest('/test', {id: 'test', login: 'User1'}));

      expect(clientStore0.getState().get('room'), 'clientStore0.room').equal(Room.id);
      expect(clientStore0.getState().getIn(['rooms', Room.id]), 'clientStore0.rooms').equal(Room);

      expect(clientStore1.getState().get('room'), 'clientStore1.room').equal(null);
      expect(clientStore1.getState().getIn(['rooms', Room.id]), 'clientStore1.rooms').equal(Room);
    });

    it('User0, User1 in Room, User0 exits, User1 exits', () => {
      const Room = RoomModel.new();
      const [serverStore, {clientStore0, User0}, {clientStore1, User1}] = mockStores(2, Map({rooms: Map({[Room.id]: Room})}));
      clientStore0.dispatch(roomJoinRequest(Room.id));
      clientStore1.dispatch(roomJoinRequest(Room.id));
      clientStore0.dispatch(roomExitRequest());

      expect(selectRoom(serverStore.getState, Room.id).users).equal(List.of(User1.id));
      expect(clientStore0.getState().get('room'), 'clientStore0.room').equal(null);
      expect(selectRoom(clientStore0.getState, Room.id).users, 'clientStore0.rooms').equal(List.of(User1.id));
      expect(clientStore1.getState().get('room'), 'clientStore1.room').equal(Room.id);
      expect(selectRoom(clientStore1.getState, Room.id).users, 'clientStore1.rooms').equal(List.of(User1.id));

      clientStore1.dispatch(roomExitRequest());

      expect(serverStore.getState().get('rooms')).equal(Map());
      expect(clientStore0.getState().get('room'), 'clientStore0.room').null;
      expect(clientStore0.getState().get('rooms')).equal(Map());
      expect(clientStore1.getState().get('room'), 'clientStore1.room').null;
      expect(clientStore1.getState().get('rooms')).equal(Map());
    });

    it('User0, User1 in Room, User0 disconnects, User1 disconnects', () => {
      const Room = RoomModel.new();
      const [serverStore, {clientStore0, User0}, {clientStore1, User1}]= mockStores(2, Map({rooms: Map({[Room.id]: Room})}));
      clientStore0.dispatch(roomJoinRequest(Room.id));
      clientStore1.dispatch(roomJoinRequest(Room.id));

      clientStore0.disconnect();

      serverStore.dispatch(testShiftTime(USER_LOGOUT_TIMEOUT));

      expect(selectRoom(serverStore.getState, Room.id).users).equal(List.of(User1.id));
      expect(selectRoom(clientStore1.getState, Room.id).users).equal(List.of(User1.id));

      clientStore1.disconnect();

      serverStore.dispatch(testShiftTime(USER_LOGOUT_TIMEOUT));

      expect(serverStore.getState().get('rooms')).equal(Map());
    });

    it('User0, User1 in Room, User0 disconnects, User0 rejoins', () => {
      const Room = RoomModel.new();
      const [serverStore, {clientStore0, User0}, {clientStore1, User1}]= mockStores(2, Map({rooms: Map({[Room.id]: Room})}));
      clientStore0.dispatch(roomJoinRequest(Room.id));
      clientStore1.dispatch(roomJoinRequest(Room.id));

      clientStore0.disconnect();

      expect(selectRoom(serverStore.getState, Room.id).users).equal(List.of(User0.id, User1.id));
      //expect(clientStore0.getState().get('room'), 'clientStore0.room').equal(null);
      //expect(clientStore0.getState().get('rooms')).equal(Map());
      expect(clientStore1.getState().get('room'), 'clientStore1.room').equal(Room.id);
      expect(selectRoom(clientStore1.getState, Room.id).users).equal(List.of(User0.id, User1.id));

      clientStore0.connect(serverStore);

      expect(clientStore0.getState().get('room'), 'clientStore0.room after rejoin').equal(Room.id);
      expect(clientStore1.getState().get('room'), 'clientStore1.room').equal(Room.id);
      expect(selectRoom(serverStore.getState, Room.id).users).equal(List.of(User0.id, User1.id));
      expect(selectRoom(clientStore0.getState, Room.id).users).equal(List.of(User0.id, User1.id));
      expect(selectRoom(clientStore1.getState, Room.id).users).equal(List.of(User0.id, User1.id));

      serverStore.dispatch(testShiftTime(USER_LOGOUT_TIMEOUT));

      expect(clientStore0.getState().get('room'), 'clientStore0.room').equal(Room.id);
      expect(clientStore1.getState().get('room'), 'clientStore1.room').equal(Room.id);
      expect(selectRoom(serverStore.getState, Room.id).users).equal(List.of(User0.id, User1.id));
      expect(selectRoom(clientStore0.getState, Room.id).users).equal(List.of(User0.id, User1.id));
      expect(selectRoom(clientStore1.getState, Room.id).users).equal(List.of(User0.id, User1.id));
    });
  });

  describe('Actions:', function () {
    it('Can edit settings', () => {
      const [serverStore, {clientStore0, User0}, {clientStore1, User1}] = mockStores(2);
      clientStore0.dispatch(roomCreateRequest());
      const RoomId = serverStore.getState().get('rooms').first().id;
      clientStore1.dispatch(roomJoinRequest(RoomId));
      clientStore0.dispatch(roomEditSettingsRequest({
        name: 'Room Test'
        , maxPlayers: 3
        , timeTurn: 180
        , timeTraitResponse: 60
      }));

      expect(serverStore.getState().getIn(['rooms', RoomId, 'name']), 'Room Test');
      expect(serverStore.getState().getIn(['rooms', RoomId, 'settings', 'maxPlayers']), 3);
      expect(serverStore.getState().getIn(['rooms', RoomId, 'settings', 'timeTurn']), 180e3);
      expect(serverStore.getState().getIn(['rooms', RoomId, 'settings', 'timeTraitResponse']), 60e3);
      expect(clientStore0.getState().getIn(['rooms', RoomId, 'name']), 'Room Test');
      expect(clientStore0.getState().getIn(['rooms', RoomId, 'settings', 'maxPlayers']), 3);
      expect(clientStore0.getState().getIn(['rooms', RoomId, 'settings', 'timeTurn']), 180e3);
      expect(clientStore0.getState().getIn(['rooms', RoomId, 'settings', 'timeTraitResponse']), 60e3);
    });

    it('Can kick', () => {
      const [serverStore, {clientStore0, User0}, {clientStore1, User1}] = mockStores(2);
      clientStore0.dispatch(roomCreateRequest());
      const RoomId = serverStore.getState().get('rooms').first().id;
      clientStore1.dispatch(roomJoinRequest(RoomId));
      clientStore0.dispatch(roomKickRequest(User1.id));
      expect(serverStore.getState().getIn(['rooms', RoomId, 'users'])).size(1);
      expect(clientStore0.getState().getIn(['rooms', RoomId, 'users'])).size(1);
      expect(clientStore1.getState().getIn(['room'])).null;
    });

    it('Can ban', () => {
      const [serverStore, {clientStore0, User0}, {clientStore1, User1}] = mockStores(2);
      clientStore0.dispatch(roomCreateRequest());
      const RoomId = serverStore.getState().get('rooms').first().id;
      clientStore1.dispatch(roomJoinRequest(RoomId));
      clientStore0.dispatch(roomBanRequest(User1.id));
      expect(serverStore.getState().getIn(['rooms', RoomId, 'users'])).size(1);
    });

    it('Room resize', () => {
      const [serverStore, {clientStore0}, {clientStore1}, {clientStore2}, {clientStore3}] = mockStores(4);
      clientStore0.dispatch(roomCreateRequest());
      const roomId = serverStore.getState().get('rooms').first().id;
      clientStore1.dispatch(roomJoinRequest(roomId));
      clientStore2.dispatch(roomJoinRequest(roomId));
      clientStore3.dispatch(roomJoinRequest(roomId));
      clientStore0.dispatch(roomEditSettingsRequest({
        name: 'Room Test'
        , maxPlayers: 3
        , timeTurn: 180
        , timeTraitResponse: 60
      }));
      expect(serverStore.getState().getIn(['rooms', roomId, 'users']), 'Resize should kick').size(3);
      expect(clientStore0.getState().getIn(['rooms', roomId, 'users'])).size(3);
      expect(clientStore1.getState().getIn(['rooms', roomId, 'users'])).size(3);
      expect(clientStore2.getState().getIn(['rooms', roomId, 'users'])).size(3);
      expect(clientStore3.getState().getIn(['rooms', roomId, 'users'])).size(3);
      expect(clientStore3.getState().getIn(['room'])).null;
      expectUnchanged('User3 cannot join'
        , () => clientStore3.dispatch(roomJoinRequest(roomId))
        , serverStore, clientStore0, clientStore1, clientStore2, clientStore3)
    });
  });

  describe('Errors:', () => {
    it('User0 joins into same room', () => {
      const Room = RoomModel.new();
      const [serverStore, {clientStore0, User0}]= mockStores(1, Map({rooms: Map({[Room.id]: Room})}));
      clientStore0.dispatch(roomJoinRequest(Room.id));
      expectUnchanged(`Can't join same room`, () => {
        clientStore0.dispatch(roomJoinRequest(Room.id));
      }, serverStore, clientStore0);
      const newRoom = serverStore.getState().getIn(['rooms', Room.id]);
      expect(newRoom.users).equal(List.of(User0.id));
    });

    it('User0 joins into another room', () => {
      const Room0 = RoomModel.new();
      const Room1 = RoomModel.new();
      const [serverStore, {clientStore0, User0}, {clientStore1, User1}]= mockStores(2, Map({
        rooms: Map({
          [Room0.id]: Room0
          , [Room1.id]: Room1
        })
      }));
      clientStore0.dispatch(roomJoinRequest(Room0.id));
      clientStore1.dispatch(roomJoinRequest(Room0.id));
      clientStore1.dispatch(roomJoinRequest(Room1.id));
      const newRoom1 = serverStore.getState().getIn(['rooms', Room1.id]);
      expect(serverStore.getState().getIn(['rooms', Room0.id, 'users'])).equal(List.of(User0.id));
      expect(serverStore.getState().getIn(['rooms', Room1.id, 'users'])).equal(List.of(User1.id));
    });

    it('User0 creates another room', () => {
      const Room0 = RoomModel.new();
      const [serverStore, {clientStore0, User0}]= mockStores(2, Map({
        rooms: Map({
          [Room0.id]: Room0
        })
      }));
      clientStore0.dispatch(roomJoinRequest(Room0.id));
      clientStore0.dispatch(roomCreateRequest());
      const Room1id = clientStore0.getState().get('room');
      expect(Room0.id).not.equal(Room1id);
      const Room1 = serverStore.getState().getIn(['rooms', Room1id]);
      expect(serverStore.getState().get('rooms')).equal(Map({[Room1id]: Room1}))
    });
  });

  describe('Voting', () => {
    it('Voting', () => {
      const [serverStore
        , {clientStore0, User0}
        , {clientStore1, User1}
        , {clientStore2, User2}
        , {clientStore3, User3}
      ] = mockStores(4);

      clientStore0.dispatch(roomCreateRequest());
      const roomId = serverStore.getState().get('rooms').first().id;
      clientStore1.dispatch(roomJoinRequest(roomId));
      clientStore2.dispatch(roomJoinRequest(roomId));

      const selectVote = (store) => selectRoom(store.getState, roomId).votingForStart;

      expectUnchanged(`Voting isn't going on`, () => {
        clientStore0.dispatch(roomStartVoteActionRequest(true));
        clientStore1.dispatch(roomStartVoteActionRequest(true));
        clientStore2.dispatch(roomStartVoteActionRequest(true));
        clientStore3.dispatch(roomStartVoteActionRequest(true));
      }, serverStore, clientStore0, clientStore1, clientStore2, clientStore3);

      expectUnchanged(`Can't start the vote`, () => {
        clientStore1.dispatch(roomStartVotingRequest());
        clientStore2.dispatch(roomStartVotingRequest());
        clientStore3.dispatch(roomStartVotingRequest());
      }, serverStore, clientStore0, clientStore1, clientStore2, clientStore3);

      clientStore0.dispatch(roomStartVotingRequest());
      expect(selectVote(serverStore), 'Voting started').ok;
      const timestamp = selectVote(serverStore).timestamp;
      expect(selectVote(serverStore).getIn(['votes', User0.id])).true;

      expectUnchanged(`User0 can't start again and User 3 can't do a shit`, () => {
        clientStore0.dispatch(roomStartVotingRequest());
        clientStore3.dispatch(roomStartVoteActionRequest(true));
        clientStore3.dispatch(roomJoinRequest(roomId));
      }, serverStore, clientStore0, clientStore1, clientStore2, clientStore3);

      clientStore1.dispatch(roomStartVoteActionRequest(true));
      expect(selectRoom(serverStore.getState, roomId).gameId).null;
      expect(selectVote(serverStore).getIn(['votes', User1.id])).true;
      clientStore2.dispatch(roomStartVoteActionRequest(true));
      expect(selectVote(serverStore).getIn(['votes', User2.id])).true;
    });

    it.skip('Voting End', () => {
      const [serverStore
        , {clientStore0, User0}
        , {clientStore1, User1}
        , {clientStore2, User2}
      ] = mockStores(4);

      clientStore0.dispatch(roomCreateRequest());
      const roomId = serverStore.getState().get('rooms').first().id;
      clientStore1.dispatch(roomJoinRequest(roomId));
      clientStore2.dispatch(roomJoinRequest(roomId));

      const selectVote = (store) => selectRoom(store.getState, roomId).votingForStart;

      clientStore0.dispatch(roomStartVotingRequest());
      expect(selectVote(serverStore), 'Voting started').ok;
      expect(selectVote(serverStore).getIn(['votes', User0.id])).true;

      clientStore0.dispatch(roomStartVoteActionRequest(false));
      clientStore1.dispatch(roomStartVoteActionRequest(false));
      clientStore2.dispatch(roomStartVoteActionRequest(false));

      expect(selectVote(serverStore)).null;
    });
  });
});