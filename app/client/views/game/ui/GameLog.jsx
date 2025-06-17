import React from 'react'
import T from 'i18n-react/dist/i18n-react'

import Dialog from '@material-ui/core/Dialog/index';
import DialogTitle from '@material-ui/core/DialogTitle/index';
import DialogContent from '@material-ui/core/DialogContent/index';
import Button from "@material-ui/core/Button/index";
import Tooltip from '@material-ui/core/Tooltip/index';

import IconLog from '@material-ui/icons/List';

import User from '../../utils/User.jsx';
import AnimalText from '../animals/AnimalText.jsx';

import TimeService from '../../../services/TimeService';
import Promise from '../../utils/Promise.jsx';

const DATA_REGEX = /!(\w+)/g;
const VIEW_REGEX = /(\$[\w\-@]+)/g;

const format = (str, arr) => str.replace(DATA_REGEX, (match, number) => typeof arr[number] != 'undefined' ? arr[number] : match);
import replace from 'react-string-replace';

import './GameLog.scss';
import Food from "../food/Food";

const customLog = {
  gameGiveCards: (message, values) => {
    const n = values[1];
    const plural = (n <= 0) ? 3
      : (n % 10 == 1 && n % 100 != 11 ? 0 : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2);
    // http://docs.translatehouse.org/projects/localization-guide/en/latest/l10n/pluralforms.html?id=l10n/pluralforms
    return T.translate('Game.Log.' + message, {context: plural, ...values})
  }
  , gameDeployTrait: (message, [userId, traitType, animal, another]) => {
    return T.translate('Game.Log.' + message, {context: another ? 2 : 1, ...[userId, traitType, animal, another]})
  }
  , traitNotify_Start: (message, [source, traitType, ...targets]) => {
    return T.translate('Game.Log.' + message, {context: targets.length, ...[source, traitType, ...targets]})
  }
  , traitMoveFood: (message, [amount, sourceType, animal, another]) => {
    return T.translate('Game.Log.' + message + '.' + sourceType, {context: amount, ...[amount, sourceType, animal, another]})
  }
  , traitMoveCard: (message, [fromPid, toPid]) => {
    return T.translate('Game.Log.' + message, {...[fromPid, toPid]})
  }
  , animalDeath: (message, [type, animal, data]) => {
    return T.translate('Game.Log.' + message, {context: type, ...[type, animal, data]})
  }
  , gameStartPhase: (message, [phase, data]) => {
    return T.translate('Game.Phase.' + phase, {data})
  }
  , default: (message, values) => T.translate('Game.Log.' + message, {...values})
};

export default class GameLog extends React.Component {
  constructor(props) {
    super(props);
    this.state = {showLog: false};
    this.showLog = () => this.setState({showLog: true});
    this.hideLog = () => this.setState({showLog: false});
  }

  static LogItemToText([message, ...values]) {
    // values come as userId or as ['$Animal', ...traits] or ['$Trait', index, ...traits of animal]
    const valuesToInsertAsText = values.map((value, index) =>
      Array.isArray(value) ? value[0] + '@' + index
        : value);
    // So we convert arrays to $Animal@index

    // Then we process
    const logItemWithData = (customLog[message] ? customLog[message](message, valuesToInsertAsText)
      : customLog.default(message, valuesToInsertAsText));


    return replace(logItemWithData, VIEW_REGEX, (match, index) => {
      if (/\$Player@([\w\-]+)/.test(match)) {
        return <strong key={match.slice(8)}><User id={match.slice(8)} variant='simple'/></strong>;
      } else if (/\$Animal@(\d)/.test(match)) {
        const valueIndex = match.slice(8, 9);
        return <AnimalText key={index} animal={values[valueIndex]}/>;
      } else if (/\$(Trait\w+)/.test(match)) {
        return T.translate('Game.Trait.' + match.slice(1))
      } else if (/(Trait\w+)/.test(match)) {
        return T.translate('Game.Trait.' + match)
      } else if (/\$A/.test(match)) {
        return <AnimalText key={index}/>
      } else if (/\$F/.test(match)) {
        return <Food className='Food' key={index}/>
      } else {
        return match;
      }
    })
  }

  render() {
    const {game} = this.props;
    return (
      <span>
        <Tooltip title={T.translate('Game.Log.Label')}>
          <Button size='small' className='GameLogButton' onClick={this.showLog}> <IconLog /> </Button>
        </Tooltip>
        <Dialog onBackdropClick={this.hideLog} open={!!this.state.showLog}>
          <DialogTitle>{T.translate('Game.Log.Label')}</DialogTitle>
          <DialogContent className='GameLog'>
            {game.log.slice().reverse().map((logItem, index) => (
              <div className='LogItem' key={index}>
                <span className='LogTime'>[{TimeService.formatTimeOfDay(logItem.timestamp)}]</span>&nbsp;
                <span className='LogMessage'>{GameLog.LogItemToText(logItem.message)}</span>
              </div>))}
          </DialogContent>
        </Dialog>
      </span>
    );
  }
}
