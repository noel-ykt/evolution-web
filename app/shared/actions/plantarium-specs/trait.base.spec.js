import logger from '../../../shared/utils/logger';

import * as tt from '../../models/game/evolution/traitTypes';
import * as ptt from '../../models/game/evolution/plantarium/plantTraitTypes';
import {makeGameSelectors} from '../../selectors'
import {server$autoFoodSharing, traitActivateRequest, traitTakeFoodRequest} from "../trait";
import {gameDeployTraitRequest, gameEndTurnRequest} from "../game";
import ERRORS from "../errors";
import {TRAIT_ANIMAL_FLAG} from "../../models/game/evolution/constants";

describe('[PLANTARIUM] Trait changes:', function () {
  it(`TraitCooperation`, () => {
    const [{serverStore, ParseGame}, {clientStore0}] = mockGame(1);
    const gameId = ParseGame(`
settings:
  addon_plantarium: true
phase: feeding
plants: succ $suc tree +++
players:
  - continent: $A mass coop$B coop$C, $B , $C mass, $W wait +
`);
    const {selectGame, findAnimal, findPlant} = makeGameSelectors(serverStore.getState, gameId);

    clientStore0.dispatch(traitTakeFoodRequest('$A', '$suc'));
    clientStore0.dispatch(gameEndTurnRequest());

    expect(selectGame().status.round, 'round 1').equal(1);
    expect(findPlant('$suc').getFood(), '$suc.food').equals(1);
    expect(findAnimal('$A').getFood(), '$A.getFood()').equal(1);
    expect(findAnimal('$B').getFood(), '$B.getFood()').equal(0);
    expect(findAnimal('$C').getFood(), '$C.getFood()').equal(1);
  });

  it('[PLANTARIUM] TraitGrazing:', function () {
    const [{serverStore, ParseGame}, {clientStore0}] = mockGame(1);
    const gameId = ParseGame(`
  settings:
    addon_plantarium: true
  phase: feeding
  plants: succ $suc tree ++++++
  players:
    - continent: $A mass coop$B coop$C plantgraz, $B plantgraz, $C mass plantgraz, $W wait +
  `);
    const {selectGame, findAnimal, findPlant} = makeGameSelectors(serverStore.getState, gameId);

    clientStore0.dispatch(traitTakeFoodRequest('$A', '$suc'));

    expectError(`Too early to graze`, ERRORS.COOLDOWN, () => {
      clientStore0.dispatch(traitTakeFoodRequest('$A', '$suc'));
    });

    expect(selectGame().status.round, 'round 0').equal(0);
    expect(findPlant('$suc').getFood(), '$suc.food').equals(4);
    expect(findAnimal('$A').getFood(), '$A.getFood()').equal(1);
    expect(findAnimal('$B').getFood(), '$B.getFood()').equal(0);
    expect(findAnimal('$C').getFood(), '$C.getFood()').equal(1);

    clientStore0.dispatch(traitActivateRequest('$A', tt.TraitPlantGrazing));

    expectError(`Too early to graze`, ERRORS.TRAIT_ACTION_NO_VALUE, () => {
      clientStore0.dispatch(traitActivateRequest('$B', tt.TraitPlantGrazing))
    });

    clientStore0.dispatch(traitActivateRequest('$C', tt.TraitPlantGrazing));

    expect(findPlant('$suc').getFood(), '$suc.food').equals(2);
  });

  it('[PLANTARIUM] #bug TraitGrazing with communication', function () {
    const [{serverStore, ParseGame}, {clientStore0}] = mockGame(1);
    const gameId = ParseGame(`
  settings:
    addon_plantarium: true
  phase: feeding
  plants: succ $suc ++++
  players:
    - continent: $A graz commu$B plantgraz, $B plantgraz wait
  `);
    const {selectGame, findAnimal, findPlant} = makeGameSelectors(serverStore.getState, gameId);

    clientStore0.dispatch(traitTakeFoodRequest('$A', '$suc'));


    expect(selectGame().status.round, 'round 0').equal(0);
    expect(findPlant('$suc').getFood(), '$suc.food').equals(3);
    expect(findAnimal('$A').getFood(), '$A.getFood()').equal(1);
    expect(findAnimal('$B').getFood(), '$B.getFood()').equal(0);

    expectError(`Too early to graze`, ERRORS.COOLDOWN, () => {
      clientStore0.dispatch(traitTakeFoodRequest('$A', '$suc'));
    });

    expect(selectGame().status.round, 'round 0').equal(0);
    expect(findPlant('$suc').getFood(), '$suc.food').equals(3);
    expect(findAnimal('$A').getFood(), '$A.getFood()').equal(1);
    expect(findAnimal('$B').getFood(), '$B.getFood()').equal(1);

    clientStore0.dispatch(traitActivateRequest('$A', tt.TraitPlantGrazing));

    expect(findPlant('$suc').getFood(), '$suc.food').equals(2);
  });

  it('[PLANTARIUM] TraitPlantHomeothermy:', function () {
    const [{serverStore, ParseGame}, {clientStore0}] = mockGame(1);
    const gameId = ParseGame(`
  settings:
    addon_plantarium: true
  phase: feeding
  plants: succ $suc +++++
  players:
    - continent: $A mass fat fat planthomeo, $B mass, $W wait +
  `);
    const {selectGame, findAnimal, findPlant, findTrait} = makeGameSelectors(serverStore.getState, gameId);

    clientStore0.dispatch(traitTakeFoodRequest('$A', '$suc'));

    expectError(`Too early to eat`, ERRORS.COOLDOWN, () => {
      clientStore0.dispatch(traitTakeFoodRequest('$A', '$suc'));
    });

    expect(selectGame().status.round, 'round 0').equal(0);
    expect(findPlant('$suc').getFood(), '$suc.food').equals(4);
    expect(findAnimal('$A').getFood(), '$A.getFood()').equal(1);
    expect(findAnimal('$B').getFood(), '$B.getFood()').equal(0);
    expect(findAnimal('$W').getFood(), '$W.getFood()').equal(1);

    clientStore0.dispatch(traitActivateRequest('$A', tt.TraitPlantHomeothermy, '$suc'));

    expect(selectGame().status.round, 'round 0').equal(0);
    expect(findPlant('$suc').getFood(), '$suc.food').equals(3);
    expect(findAnimal('$A').getFood(), '$A.getFood()').equal(2);
    expect(findAnimal('$B').getFood(), '$B.getFood()').equal(0);
    expect(findAnimal('$W').getFood(), '$W.getFood()').equal(1);
  });

  it('[PLANTARIUM] TraitSpecialization', function () {
    const [{serverStore, ParseGame}, {clientStore0, User0}] = mockGame(1);
    const gameId = ParseGame(`
settings:
  addon_plantarium: true
phase: deploy
plants: carn $carn + aqua tree, eph $eph +++ 
players:
  - continent: $A fat fat, $W wait +
    hand: special
    `);
    const {selectGame, selectCard, findAnimal} = makeGameSelectors(serverStore.getState, gameId);

    clientStore0.dispatch(gameDeployTraitRequest(selectCard(User0, 0).id, '$A', false, '$carn'));

    expectError(`Cannot eat from $eph`, tt.TraitSpecialization, () => {
      clientStore0.dispatch(traitTakeFoodRequest('$A', '$eph'));
    });

    clientStore0.dispatch(traitTakeFoodRequest('$A', '$carn'));

    expect(findAnimal('$A'), '$A is OK').ok;
    expect(findAnimal('$A').getFood(), '$A got food').equal(1);
  });

  it('[PLANTARIUM] TraitSpecialization', function () {
    const [{serverStore, ParseGame}, {clientStore0, User0}] = mockGame(1);
    const gameId = ParseGame(`
settings:
  addon_plantarium: true
phase: deploy
plants: carn $carn + aqua tree, eph $eph +++ 
players:
  - continent: $A fat fat, $W wait +
    hand: special
    `);
    const {selectGame, selectCard, findAnimal} = makeGameSelectors(serverStore.getState, gameId);

    clientStore0.dispatch(gameDeployTraitRequest(selectCard(User0, 0).id, '$A', false, '$carn'));

    expectError(`Cannot eat from $eph`, tt.TraitSpecialization, () => {
      clientStore0.dispatch(traitTakeFoodRequest('$A', '$eph'));
    });

    clientStore0.dispatch(traitTakeFoodRequest('$A', '$carn'));

    expect(findAnimal('$A'), '$A is OK').ok;
    expect(findAnimal('$A').getFood(), '$A got food').equal(1);
  });

  it('[PLANTARIUM] TraitSpecialization + Officinalis', function () {
    const [{serverStore, ParseGame}, {clientStore0, User0}] = mockGame(1);
    const gameId = ParseGame(`
settings:
  addon_plantarium: true
phase: deploy
plants: carn $carn + aqua tree offic, eph $eph +++ 
players:
  - continent: $A fat fat, $W wait +
    hand: special
    `);
    const {selectGame, selectCard, findAnimal} = makeGameSelectors(serverStore.getState, gameId);

    clientStore0.dispatch(gameDeployTraitRequest(selectCard(User0, 0).id, '$A', false, '$carn'));

    expectError(`Cannot eat from $eph`, tt.TraitSpecialization, () => {
      clientStore0.dispatch(traitTakeFoodRequest('$A', '$eph'));
    });

    clientStore0.dispatch(traitTakeFoodRequest('$A', '$carn'));

    expect(findAnimal('$A'), '$A is OK').ok;
    expect(findAnimal('$A').hasFlag(TRAIT_ANIMAL_FLAG.PARALYSED), '$A is not paralyzed').equals(false);
    expect(findAnimal('$A').getFood(), '$A got food').equal(1);
  });

  it('[PLANTARIUM] #BUG TraitSpecialization + Meta', function () {
    const [{serverStore, ParseGame}, {clientStore0, User0}] = mockGame(1);
    const gameId = ParseGame(`
settings:
  addon_plantarium: true
phase: deploy
plants: pere $per ++ aqua tree, eph $eph +++ 
players:
  - continent: $A fat fat meta, $W wait +
    hand: special
    `);
    const {selectGame, selectCard, findAnimal, findPlant} = makeGameSelectors(serverStore.getState, gameId);

    clientStore0.dispatch(gameDeployTraitRequest(selectCard(User0, 0).id, '$A', false, '$per'));

    clientStore0.dispatch(traitActivateRequest('$A', tt.TraitMetamorphose, tt.TraitSpecialization));

    expect(findAnimal('$A'), '$A is OK').ok;
    expect(findAnimal('$A').getFood(), '$A got food').equal(1);
    expect(findAnimal('$A').hasTrait(tt.TraitSpecialization), `$A doesn't have spec`).equal(void 0);
    expect(findPlant('$per').hasTrait(tt.TraitSpecialization), `$per doesn't have spec`).equal(void 0);
  });
});
















