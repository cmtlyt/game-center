/**
 * 温州麻将规则
 *
 * 投掷次数：2
 * 投掷骰子数量：2
 *
 * 庄家确定规则：
 *   - 通过掷骰子决定，点数最大者为庄家
 *   - 如果点数相同则重新掷骰子
 *
 * 庄家特权：
 *   - 第一个摸牌
 *   - 可以多摸一张牌（14张）
 *   - 连庄时分数翻倍
 *
 * 游戏流程：
 * 第一次由庄家开始投掷，用于确定从哪边（查看下面方向选择规则）
 * 开始摸牌（需要记录位置）
 *
 * 第二次由被摸牌的玩家投掷，用于确定从哪一垛开始摸牌（两次投掷的和，需要记录）
 *
 * 方向选择规则：
 *
 * 庄家默认为：东
 * 骰子点数从自身开始按东南西北的顺序循环，例如点数为 5 则（东，南，西，北，东）被摸牌为东
 * 如果只有三个玩家则跳过空缺玩家位置，例如点数为 5 空缺为西则（东，南，北，东，南）被摸牌为南
 * 如果只有两个玩家参考三个玩家的规则
 *
 */

import { getRandomString } from '@cmtlyt/base';
import { computed } from 'vue';
import { useDiceRoll } from './useDiceRoll';

/** 方位 */
export type PositionType = 'east' | 'south' | 'west' | 'north';

/** 游戏状态 */
export enum GameStatus {
  Init = 'init', // 初始化
  DetermineDealer = 'determineDealer', // 确定庄家
  DealerRollTie = 'dealerRollTie', // 庄家投掷平局
  FirstRoll = 'firstRoll', // 第一次投掷
  SecondRoll = 'secondRoll', // 第二次投掷
  Playing = 'playing', // 游戏进行中
  Finished = 'finished', // 游戏结束
}

/** 玩家数量 */
export type PlayerCountType = 2 | 3 | 4;

/** 当前玩家投掷结果 */
interface PlayerRoll {
  playerId: string; // 玩家 id
  total: number; // 投掷点数
}

export interface Player {
  id: string; // 玩家 id
  position: PositionType; // 玩家位置
  isDealer: boolean; // 是否是庄家
  name: string; // 玩家名称
}

export interface GameState {
  round: number; // 当前局数
  dealerStreak: number; // 庄家连庄次数
  status: GameStatus; // 游戏状态
  lastDealerRolls?: PlayerRoll[]; // 上一次庄家投掷结果
  startingPosition?: PositionType; // 起牌位置
  startingStack?: number; // 起牌垛数
  currentRollPlayer?: string; // 当前应该投掷的玩家ID
  tiePlayers?: string[]; // 需要重新投掷的平局玩家ID
}

export function useMahjong(playerCount: PlayerCountType) {
  const players = useState<Player[]>('mahjong-players', () => []); // 总玩家
  const currentDealer = useState<Player | null>('mahjong-dealer', () => null); // 当前坐庄玩家
  const gameState = useState<GameState>('mahjong-state', () => ({
    round: 1, // 当前局数
    dealerStreak: 0, // 庄家连庄次数
    status: GameStatus.Init, // 游戏状态
    lastDealerRolls: [], // 上一次庄家投掷结果
    startingPosition: 'east', // 起牌位置
    startingStack: 0, // 起牌垛数
    currentRollPlayer: '', // 当前应该投掷的玩家ID
    tiePlayers: [], // 需要重新投掷的平局玩家ID
  }));

  // 初始化骰子
  const diceRoll = useDiceRoll({
    count: 2,
    duration: 0,
  });

  // 计算投掷点数总和
  const diceTotal = computed(() => {
    return diceRoll.results.reduce((sum, val) => sum + val, 0);
  });

  // 修改当前对局状态
  const changeStatus = (status: GameStatus) => {
    gameState.value.status = status;
  };

  // 初始化玩家
  const initializePlayers = () => {
    if (playerCount > 4 || playerCount < 2) {
      throw new Error('当前玩家数量不合法, 请输入2-4个玩家');
    }

    const positions: PositionType[] = (['east', 'south', 'west', 'north'] as const).slice(0, playerCount) as PositionType[];

    players.value = positions.map((position, index) => ({
      id: `player-${getRandomString(6)}`,
      position,
      isDealer: false,
      name: `玩家${index + 1}`,
    }));

    console.debug(players.value);

    changeStatus(GameStatus.DetermineDealer);
  };

  // 游戏开局
  const startGame = () => {
    console.debug('游戏开始');

    console.debug('初始化玩家...');
    initializePlayers();
  };

  // 多个玩家投掷骰子
  const multipleRoll = async (playerIds?: string[]) => {
    const rollResults: PlayerRoll[] = [];
    // 如果指定了玩家ID，则只让这些玩家投掷
    const rollPlayers = playerIds
      ? players.value.filter(p => playerIds.includes(p.id))
      : players.value;

    for (const player of rollPlayers) {
      const result = await diceRoll.roll();
      rollResults.push({
        playerId: player.id,
        total: diceTotal.value,
      });

      console.debug(`${player.name} 投掷结果: ${result}, 总和: ${diceTotal.value}`);
    }

    return rollResults;
  };

  // 确定庄家
  const determineDealer = async () => {
    console.debug('确定庄家');

    const rollResults = await multipleRoll();

    // 找出最大点数
    const maxTotal = Math.max(...rollResults.map(r => r.total));

    // 找出最大点数的玩家
    const maxPlayers = rollResults.filter(r => r.total === maxTotal);

    // 如果有多个最大点数玩家，进入平局重掷
    if (maxPlayers.length > 1) {
      console.debug('出现平局，需要重新投掷');
      gameState.value.tiePlayers = maxPlayers.map(p => p.playerId);
      gameState.value.lastDealerRolls = rollResults;
      changeStatus(GameStatus.DealerRollTie);
      return;
    }

    // 设置庄家
    const dealerId = maxPlayers[0].playerId;
    const dealer = players.value.find(p => p.id === dealerId);
    if (!dealer)
      throw new Error('未找到庄家');

    players.value = players.value.map(p => ({
      ...p,
      isDealer: p.id === dealerId,
    }));
    currentDealer.value = dealer;
    console.debug(`庄家确定: ${dealer.name}`);

    changeStatus(GameStatus.FirstRoll);
  };

  // 庄家投掷平局
  const dealerRollTie = async () => {
    console.debug('庄家投掷平局');
    if (!gameState.value.tiePlayers?.length) {
      throw new Error('没有需要重新投掷的玩家');
    }

    const rollResults = await multipleRoll(gameState.value.tiePlayers);

    // 找出最大点数
    const maxTotal = Math.max(...rollResults.map(r => r.total));

    // 找出最大点数的玩家
    const maxPlayers = rollResults.filter(r => r.total === maxTotal);

    // 如果还是有多个最大点数玩家，继续平局重掷
    if (maxPlayers.length > 1) {
      console.debug('再次出现平局，继续重新投掷');
      gameState.value.tiePlayers = maxPlayers.map(p => p.playerId);
      gameState.value.lastDealerRolls = rollResults;
      return; // 保持在当前状态，继续重掷
    }

    // 设置庄家
    const dealerId = maxPlayers[0].playerId;
    const dealer = players.value.find(p => p.id === dealerId);
    if (!dealer)
      throw new Error('未找到庄家');

    players.value = players.value.map(p => ({
      ...p,
      isDealer: p.id === dealerId,
    }));
    currentDealer.value = dealer;

    console.debug(`庄家确定: ${dealer.name}`);

    changeStatus(GameStatus.FirstRoll);
  };

  // 第一次投掷
  const firstRoll = async () => {
    console.debug('第一次投掷开始');
    await diceRoll.roll();

    console.debug(`第一次投掷结果：${diceTotal.value}`);
    // 投掷完成后，更新游戏状态
    changeStatus(GameStatus.SecondRoll);
  };

  // 第二次投掷
  const secondRoll = async () => {
    console.debug('第二次投掷');
    await diceRoll.roll();

    console.debug(`第二次投掷结果：${diceTotal.value}`);
    // 投掷完成后，更新游戏状态
    changeStatus(GameStatus.Playing);
  };

  // 游戏进行中
  const gameRunning = () => {
    console.debug('游戏进行中');
  };

  // 游戏结束
  const gameFinished = () => {
    console.debug('游戏结束');
  };

  const next = () => {
    switch (gameState.value.status) {
      case GameStatus.Init:
        startGame();
        break;
      case GameStatus.DetermineDealer:
        determineDealer();
        break;
      case GameStatus.DealerRollTie:
        dealerRollTie();
        break;
      case GameStatus.FirstRoll:
        firstRoll();
        break;
      case GameStatus.SecondRoll:
        secondRoll();
        break;
      case GameStatus.Playing:
        gameRunning();
        break;
      case GameStatus.Finished:
        gameFinished();
        break;
    }
  };

  return {
    changeStatus,
    gameState,
    next,
  };
}
