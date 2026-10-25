import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {audioManager} from '../../audio/audioManager'
import type {GameState, PlayerIndex, QuizAnswerOutcome} from '../../engine/actions'
import type {CardInstance} from '../../engine/cards'
import {canPlay, canThrowSelection} from '../../engine/conditions'
import {
	CHARACTERS,
	type CharacterId,
	DEFAULT_BATTLE_MAP_ID,
	ENGINE_CONFIG,
	type SpriteAnimationState,
	SUBJECT_BORDER_PALETTE,
} from '../../engine/config'
import createNewGame, {type GameInstance} from '../../engine/game'
import {
	appendRoomAction,
	MAX_ACTION_LOG_LENGTH,
	type MultiplayerSeat,
	type RoomDocument,
	sendRoomHeartbeat,
	subscribeToRoom,
	triggerRoomRematch,
} from '../../firebase/multiplayer'
import {BattleArenaStage, PlayerMapCropStage} from '../components/BattleArenaStage'
import {FlatBanner, FlatBar, FlatButton, FlatIcon, FlatManaPips, FlatPanel, FlatWell} from '../components/FlatUi'
import {NineSliceCard} from '../components/NineSliceCard'
import {QuestionPeekModal, QuizCanvasModal} from '../components/QuizCanvasModal'
import {StatusBadges} from '../components/StatusBadges'
import {formatLiveCardText} from '../utils/cardTextFormatter'

export interface MatchSummary {
	winnerSeat: 0 | 1 | 2
	rounds: number
	turns: number
	p1EndHp: number
	p1MaxHp: number
	p2EndHp: number
	p2MaxHp: number
	forfeitedBy: 1 | 2 | null
	actionCount: number
}

export interface BattleScreenProps {
	p1Character: CharacterId
	p2Character: CharacterId
	roomCode: string
	isOnlineMultiplayer?: boolean
	onlineSeat?: MultiplayerSeat
	initialRoom?: RoomDocument | null
	onFinishBattle: (winner: 0 | 1 | 2, summary?: MatchSummary) => void
}

type LocalPlayMode = 'hotseat-open' | 'hotseat-curtain' | 'vs-bot'
type PileModalState = {playerIndex: PlayerIndex; pile: 'draw' | 'discard' | 'exhaust'} | null

function getRestingIdleState(charId: CharacterId, isActiveTurn: boolean): SpriteAnimationState {
	if (charId === 'reaper') {
		return isActiveTurn ? 'idle' : 'idle2'
	}
	return 'idle'
}

export function BattleScreen({
	p1Character,
	p2Character,
	roomCode,
	isOnlineMultiplayer = false,
	onlineSeat = 1,
	initialRoom = null,
	onFinishBattle,
}: BattleScreenProps) {
	const gameRef = useRef<GameInstance | null>(null)
	const [matchSeed, setMatchSeed] = useState<number>(() => initialRoom?.seed ?? Math.floor(Date.now() % 1000000) + 101)
	const [playMode, setPlayMode] = useState<LocalPlayMode>('vs-bot')
	const [onlineRoom, setOnlineRoom] = useState<RoomDocument | null>(initialRoom)
	const [selectedInstanceIds, setSelectedInstanceIds] = useState<string[]>([])
	const [hasThrownThisTurn, setHasThrownThisTurn] = useState<boolean>(false)
	const [curtainDismissedForTurn, setCurtainDismissedForTurn] = useState<number>(1)
	const [peekCard, setPeekCard] = useState<CardInstance | null>(null)
	const [pileModal, setPileModal] = useState<PileModalState>(null)
	const [statusMessage, setStatusMessage] = useState<string | null>(null)
	const [opponentSilenceSeconds, setOpponentSilenceSeconds] = useState<number>(0)
	const [cameraView, setCameraView] = useState<'panoramic' | 'split'>('panoramic')
	const effectiveP1Char: CharacterId = onlineRoom?.hostCharacter ?? p1Character
	const effectiveP2Char: CharacterId = onlineRoom?.guestCharacter ?? p2Character
	const [p1Anim, setP1Anim] = useState<SpriteAnimationState>(() =>
		effectiveP1Char === 'reaper' ? 'turnStart' : 'idle',
	)
	const [p2Anim, setP2Anim] = useState<SpriteAnimationState>(() => (effectiveP2Char === 'reaper' ? 'idle2' : 'idle'))

	// Initialize or reset the local game engine instance
	const initGame = useCallback(
		(seedToUse: number, char0: CharacterId, char1: CharacterId) => {
			const g = createNewGame({
				player0Character: char0,
				player1Character: char1,
				player0Name: onlineRoom?.hostName || CHARACTERS[char0].name,
				player1Name: onlineRoom?.guestName || CHARACTERS[char1].name,
				seed: seedToUse,
			})
			g.run({
				type: 'initMatch',
				player0Character: char0,
				player1Character: char1,
				seed: seedToUse,
			})
			gameRef.current = g
			setSelectedInstanceIds([])
			setHasThrownThisTurn(false)
			setCurtainDismissedForTurn(1)
			setPeekCard(null)
			setPileModal(null)
			setStatusMessage(null)
			setP1Anim(char0 === 'reaper' ? 'turnStart' : 'idle')
			setP2Anim(char1 === 'reaper' ? 'idle2' : 'idle')
			return g.state
		},
		[onlineRoom?.guestName, onlineRoom?.hostName],
	)

	const [gameState, setGameState] = useState<GameState>(() => initGame(matchSeed, effectiveP1Char, effectiveP2Char))

	// Re-init local game when not in online mode and characters/seed change
	useEffect(() => {
		if (isOnlineMultiplayer) return
		setGameState(initGame(matchSeed, effectiveP1Char, effectiveP2Char))
	}, [effectiveP1Char, effectiveP2Char, initGame, isOnlineMultiplayer, matchSeed])

	// Subscribe to Firestore room when in Online Multiplayer mode and deterministically replay actionLog
	useEffect(() => {
		if (!isOnlineMultiplayer || !roomCode) return
		const unsub = subscribeToRoom(roomCode, (remoteRoom) => {
			if (!remoteRoom) return
			setOnlineRoom(remoteRoom)

			const g = createNewGame({
				player0Character: remoteRoom.hostCharacter,
				player1Character: remoteRoom.guestCharacter,
				player0Name: remoteRoom.hostName || CHARACTERS[remoteRoom.hostCharacter].name,
				player1Name: remoteRoom.guestName || CHARACTERS[remoteRoom.guestCharacter].name,
				seed: remoteRoom.seed,
			})

			if (remoteRoom.actionLog && remoteRoom.actionLog.length > 0) {
				g.state = g.replayActionLog(g.state, remoteRoom.actionLog)
			} else {
				g.run({
					type: 'initMatch',
					player0Character: remoteRoom.hostCharacter,
					player1Character: remoteRoom.guestCharacter,
					seed: remoteRoom.seed,
				})
			}

			if (remoteRoom.status === 'finished' && g.state.status !== 'finished') {
				g.state = {
					...g.state,
					status: 'finished',
					winner: remoteRoom.winnerSeat === 1 ? 0 : remoteRoom.winnerSeat === 2 ? 1 : null,
					forfeitedBy: remoteRoom.forfeitedBySeat === 1 ? 0 : remoteRoom.forfeitedBySeat === 2 ? 1 : null,
					pendingThrow: [],
				}
			}

			const prevTurn = gameRef.current?.state.turn ?? 1
			const prevActive = gameRef.current?.state.activePlayer ?? 0
			gameRef.current = g
			setGameState(g.state)

			if (g.state.turn !== prevTurn) {
				setSelectedInstanceIds([])
				setHasThrownThisTurn(false)
			}
			if (g.state.status !== 'finished' && g.state.activePlayer !== prevActive) {
				if (remoteRoom.hostCharacter === 'reaper') {
					setP1Anim(g.state.activePlayer === 0 ? 'turnStart' : 'turnEnd')
				}
				if (remoteRoom.guestCharacter === 'reaper') {
					setP2Anim(g.state.activePlayer === 1 ? 'turnStart' : 'turnEnd')
				}
			}
		})
		return () => unsub()
	}, [isOnlineMultiplayer, roomCode])

	// Online presence heartbeat (every 30s) + 60-second disconnect forfeit monitor (Section 5)
	useEffect(() => {
		if (!isOnlineMultiplayer || !onlineRoom || onlineRoom.status !== 'playing') {
			setOpponentSilenceSeconds(0)
			return
		}

		const heartbeatInterval = window.setInterval(() => {
			sendRoomHeartbeat(onlineRoom, onlineSeat).catch(() => {})
		}, 30000)

		const silenceMonitor = window.setInterval(() => {
			const owingPlayerIndex: PlayerIndex =
				gameState.status === 'quizzing' && gameState.pendingThrow[0]
					? gameState.pendingThrow[0].defenderIndex
					: gameState.activePlayer
			const owingSeat: MultiplayerSeat = owingPlayerIndex === 0 ? 1 : 2

			if (owingSeat === onlineSeat) {
				setOpponentSilenceSeconds(0)
				return
			}

			const lastSeenMs = owingSeat === 1 ? onlineRoom.hostLastSeenMs : onlineRoom.guestLastSeenMs
			const elapsedSec = Math.max(0, Math.floor((Date.now() - lastSeenMs) / 1000))
			setOpponentSilenceSeconds(elapsedSec)

			if (elapsedSec >= ENGINE_CONFIG.disconnectForfeitSeconds && gameState.status !== 'finished') {
				const g = gameRef.current
				if (!g) return
				const forfeitAction = {type: 'forfeit' as const, playerIndex: owingPlayerIndex}
				const next = g.run(forfeitAction)
				setGameState(next)
				appendRoomAction(onlineRoom, onlineSeat, forfeitAction, next).catch(() => {})
			}
		}, 1000)

		return () => {
			window.clearInterval(heartbeatInterval)
			window.clearInterval(silenceMonitor)
		}
	}, [gameState.activePlayer, gameState.pendingThrow, gameState.status, isOnlineMultiplayer, onlineRoom, onlineSeat])

	const dispatchAction = useCallback(
		(
			action: Parameters<GameInstance['run']>[0],
			options?: {resetSelection?: boolean; markThrown?: boolean; resetThrown?: boolean},
		) => {
			const g = gameRef.current
			if (!g) return
			const prevP1Hp = g.state.players[0].currentHealth
			const prevP2Hp = g.state.players[1].currentHealth
			const prevP1Block = g.state.players[0].block
			const prevP2Block = g.state.players[1].block
			const prevP1Poison = g.state.players[0].powers.poison ?? 0
			const prevP2Poison = g.state.players[1].powers.poison ?? 0
			const prevCasterIdx = g.state.pendingThrow[0]?.casterIndex
			const prevDefenderIdx = g.state.pendingThrow[0]?.defenderIndex
			const prevActiveIdx = g.state.activePlayer

			let next = g.run(action)
			if (g.getActionLog().length >= MAX_ACTION_LOG_LENGTH && next.status !== 'finished') {
				next = {
					...next,
					status: 'finished',
					winner: null,
					forfeitedBy: null,
					pendingThrow: [],
				}
				g.state = next
			}
			setGameState(next)

			if (action.type === 'throwCards') {
				audioManager.playSfx('card-fan')
				if (action.playerIndex === 0) {
					setP1Anim('attack')
				} else {
					setP2Anim('attack')
				}
			} else if (action.type === 'resolveQuizAnswer') {
				const p1TookHit =
					next.players[0].currentHealth < prevP1Hp ||
					(prevDefenderIdx === 0 && next.lastQuizResult?.resolution !== 'nullified')
				const p2TookHit =
					next.players[1].currentHealth < prevP2Hp ||
					(prevDefenderIdx === 1 && next.lastQuizResult?.resolution !== 'nullified')

				const gainedBlock = next.players[0].block > prevP1Block || next.players[1].block > prevP2Block
				const gainedHp = next.players[0].currentHealth > prevP1Hp || next.players[1].currentHealth > prevP2Hp
				const gainedPoison =
					(next.players[0].powers.poison ?? 0) > prevP1Poison || (next.players[1].powers.poison ?? 0) > prevP2Poison

				if (gainedBlock) audioManager.playSfx('shield')
				if (gainedHp) audioManager.playSfx('heal')
				if (gainedPoison) audioManager.playSfx('poison')

				if (prevCasterIdx === 0 && next.lastQuizResult?.resolution !== 'nullified') {
					setP1Anim('attack')
				} else if (prevCasterIdx === 1 && next.lastQuizResult?.resolution !== 'nullified') {
					setP2Anim('attack')
				}

				if (p1TookHit) {
					setP1Anim('hurt')
					if (next.players[0].currentHealth > 0 && next.status !== 'finished') {
						audioManager.playCharacterVoice(effectiveP1Char, 'hurt')
					} else {
						audioManager.playSfx('hurt')
					}
				}
				if (p2TookHit) {
					setP2Anim('hurt')
					if (next.players[1].currentHealth > 0 && next.status !== 'finished') {
						audioManager.playCharacterVoice(effectiveP2Char, 'hurt')
					} else {
						audioManager.playSfx('hurt')
					}
				}
			}

			if (next.status !== 'finished' && next.activePlayer !== prevActiveIdx) {
				if (effectiveP1Char === 'reaper') {
					setP1Anim(next.activePlayer === 0 ? 'turnStart' : 'turnEnd')
				}
				if (effectiveP2Char === 'reaper') {
					setP2Anim(next.activePlayer === 1 ? 'turnStart' : 'turnEnd')
				}
			}

			if (next.status === 'finished' && next.winner !== null) {
				if (next.winner === 0) {
					setP2Anim('death')
				} else {
					setP1Anim('death')
				}
			}

			if (options?.resetSelection) {
				setSelectedInstanceIds([])
			}
			if (options?.markThrown) {
				setHasThrownThisTurn(true)
			}
			if (options?.resetThrown) {
				setHasThrownThisTurn(false)
			}
			setStatusMessage(null)

			if (isOnlineMultiplayer && onlineRoom) {
				appendRoomAction(onlineRoom, onlineSeat, action, next).catch((err) => {
					setStatusMessage(err instanceof Error ? err.message : 'Failed to sync action to Firestore.')
				})
			}
		},
		[effectiveP1Char, effectiveP2Char, isOnlineMultiplayer, onlineRoom, onlineSeat],
	)

	// Play defeated character's death voice and victory fanfare when match finishes
	useEffect(() => {
		if (gameState.status === 'finished' && gameState.winner !== null) {
			const defeatedChar = gameState.winner === 0 ? effectiveP2Char : effectiveP1Char
			audioManager.playCharacterVoice(defeatedChar, 'death')
			window.setTimeout(() => {
				audioManager.playSfx('victory')
			}, 350)
		}
	}, [effectiveP1Char, effectiveP2Char, gameState.status, gameState.winner])

	const activeIdx = gameState.activePlayer
	const activePlayer = gameState.players[activeIdx]
	const p1State = gameState.players[0]
	const p2State = gameState.players[1]
	const p1Meta = CHARACTERS[effectiveP1Char]
	const p2Meta = CHARACTERS[effectiveP2Char]

	const myPlayerIndex: PlayerIndex = isOnlineMultiplayer ? (onlineSeat === 1 ? 0 : 1) : activeIdx
	const displayedHandPlayer = gameState.players[myPlayerIndex]
	const isMyTurnToAct = isOnlineMultiplayer
		? onlineRoom?.status === 'playing' && activeIdx === myPlayerIndex && gameState.status === 'playing'
		: gameState.status === 'playing' && !(playMode === 'vs-bot' && activeIdx === 1)

	const selectedCards = useMemo(() => {
		return selectedInstanceIds
			.map((id) => displayedHandPlayer.hand.find((c) => c.instanceId === id))
			.filter((c): c is CardInstance => Boolean(c))
	}, [displayedHandPlayer.hand, selectedInstanceIds])

	const selectedManaCost = useMemo(() => {
		return selectedCards.reduce((sum, c) => sum + c.cost, 0)
	}, [selectedCards])

	const hasAnyPlayableCard = useMemo(() => {
		return displayedHandPlayer.hand.some((c) => canPlay(gameState, c, myPlayerIndex))
	}, [displayedHandPlayer.hand, gameState, myPlayerIndex])

	// Smart Bot Turn Automation when in local 'vs-bot' mode and activePlayer === 1
	useEffect(() => {
		if (isOnlineMultiplayer) return
		if (playMode !== 'vs-bot') return
		if (gameState.status !== 'playing') return
		if (gameState.activePlayer !== 1) return

		const timer = window.setTimeout(
			() => {
				const bot = gameState.players[1]
				const sortedHand = [...bot.hand].sort((a, b) => b.cost - a.cost)
				const chosenIds: string[] = []

				for (const candidate of sortedHand) {
					const testIds = [...chosenIds, candidate.instanceId]
					if (canThrowSelection(gameState, testIds, 1)) {
						chosenIds.push(candidate.instanceId)
					}
				}

				if (chosenIds.length > 0 && !hasThrownThisTurn) {
					audioManager.playCharacterVoice(effectiveP2Char, 'attack')
					dispatchAction(
						{
							type: 'throwCards',
							playerIndex: 1,
							cardInstanceIds: chosenIds,
						},
						{resetSelection: true, markThrown: true},
					)
				} else if (!hasThrownThisTurn && chosenIds.length === 0) {
					dispatchAction({type: 'skipTurn'}, {resetSelection: true, resetThrown: true})
				} else {
					dispatchAction({type: 'endTurn'}, {resetSelection: true, resetThrown: true})
				}
			},
			effectiveP2Char === 'reaper' && !hasThrownThisTurn ? 1100 : 900,
		)

		return () => window.clearTimeout(timer)
	}, [dispatchAction, effectiveP2Char, gameState, hasThrownThisTurn, isOnlineMultiplayer, playMode])

	const handleToggleCard = (card: CardInstance) => {
		if (!isMyTurnToAct) {
			audioManager.playSfx('error')
			if (isOnlineMultiplayer && activeIdx !== myPlayerIndex) {
				setStatusMessage("Wait for your opponent's turn to finish before selecting cards to throw.")
			}
			return
		}

		if (selectedInstanceIds.includes(card.instanceId)) {
			audioManager.playSfx('cancel')
			setSelectedInstanceIds((prev) => prev.filter((id) => id !== card.instanceId))
			setStatusMessage(null)
			return
		}

		const nextIds = [...selectedInstanceIds, card.instanceId]

		if (!canThrowSelection(gameState, nextIds, myPlayerIndex)) {
			audioManager.playSfx('error')
			const hasClashCondition = card.conditions?.some((c) => c.type === 'onlySubjectInHand')
			if (hasClashCondition && !canPlay(gameState, card, myPlayerIndex)) {
				setStatusMessage(`${card.name} requires every card in your hand to be a Maths card!`)
			} else {
				setStatusMessage(
					`Not enough Mana! Selected cards cost ${selectedManaCost + card.cost}, you have ${displayedHandPlayer.mana}.`,
				)
			}
			return
		}

		audioManager.playSfx('card-draw')
		setSelectedInstanceIds(nextIds)
		setStatusMessage(null)
	}

	const handleThrowSelected = () => {
		if (selectedInstanceIds.length === 0 || !isMyTurnToAct) return
		const activeChar = myPlayerIndex === 0 ? effectiveP1Char : effectiveP2Char
		audioManager.playCharacterVoice(activeChar, 'attack')
		dispatchAction(
			{
				type: 'throwCards',
				playerIndex: myPlayerIndex,
				cardInstanceIds: selectedInstanceIds,
			},
			{resetSelection: true, markThrown: true},
		)
	}

	const handleResolveQuiz = (outcome: QuizAnswerOutcome) => {
		dispatchAction({
			type: 'resolveQuizAnswer',
			answer: outcome,
		})
	}

	const handleEndTurn = () => {
		if (!isMyTurnToAct) return
		audioManager.playSfx('swipe')
		dispatchAction({type: 'endTurn'}, {resetSelection: true, resetThrown: true})
	}

	const handleSkipTurn = () => {
		if (!isMyTurnToAct || hasThrownThisTurn) return
		audioManager.playSfx('swipe')
		dispatchAction({type: 'skipTurn'}, {resetSelection: true, resetThrown: true})
	}

	const handleForfeit = (playerIndex: PlayerIndex) => {
		audioManager.playSfx('cancel')
		dispatchAction({type: 'forfeit', playerIndex}, {resetSelection: true})
	}

	const handleRematchClick = () => {
		audioManager.playSfx('match-start')
		if (isOnlineMultiplayer && onlineRoom) {
			triggerRoomRematch(onlineRoom).catch((err) => {
				setStatusMessage(err instanceof Error ? err.message : 'Failed to start online rematch.')
			})
		} else {
			setMatchSeed((s) => s + 1)
		}
	}

	const handleProceedToResult = () => {
		const winSeat: 0 | 1 | 2 = gameState.winner === null ? 0 : gameState.winner === 1 ? 2 : 1
		const g = gameRef.current
		onFinishBattle(winSeat, {
			winnerSeat: winSeat,
			rounds: gameState.round,
			turns: gameState.turn,
			p1EndHp: p1State.currentHealth,
			p1MaxHp: p1State.maxHealth,
			p2EndHp: p2State.currentHealth,
			p2MaxHp: p2State.maxHealth,
			forfeitedBy: gameState.forfeitedBy === null ? null : gameState.forfeitedBy === 0 ? 1 : 2,
			actionCount: g ? g.getActionLog().length : 0,
		})
	}

	const currentQuizEntry = gameState.status === 'quizzing' ? gameState.pendingThrow[0] : undefined
	const isMyQuizToAnswer =
		currentQuizEntry !== undefined && (!isOnlineMultiplayer || currentQuizEntry.defenderIndex === myPlayerIndex)

	const showPassCurtain =
		!isOnlineMultiplayer &&
		playMode === 'hotseat-curtain' &&
		gameState.status === 'playing' &&
		curtainDismissedForTurn !== gameState.turn

	return (
		<div className="mx-auto max-w-[1400px] select-none space-y-5 px-4 py-5 md:px-6">
			{/* Top Match Status & Mode Bar */}
			<FlatPanel
				variant="silver"
				wellVariant="dark"
				wellClassName="flex flex-wrap items-center justify-between gap-4 px-4 py-3"
			>
				<div className="flex flex-wrap items-center gap-3 font-pixel text-xs">
					<FlatBanner variant="offset-bl" className="px-2 py-0.5 text-[10px]">
						{isOnlineMultiplayer ? `ONLINE ROOM ${roomCode} (YOU: P${onlineSeat})` : `LOCAL ROOM ${roomCode}`}
					</FlatBanner>
					<span className="text-slate-100">
						ROUND {gameState.round} (TURN {gameState.turn})
					</span>
					<span aria-hidden="true" className="text-slate-500">
						·
					</span>
					<span className={activeIdx === 0 ? 'text-amber-300' : 'text-sky-300'}>
						ACTIVE: P{activeIdx + 1} ({activePlayer.name.toUpperCase()})
					</span>
					{gameState.round >= ENGINE_CONFIG.fatigueStartRound && (
						<span className="flat-slot-orange px-2 py-0.5 text-[10px] text-white">
							FATIGUE ACTIVE (-{2 * (gameState.round - 24)} HP/TURN)
						</span>
					)}
				</div>

				{/* Mode Switcher & Match Utility Controls */}
				<div className="flex flex-wrap items-center gap-2">
					<div className="flex items-center gap-1">
						<FlatButton
							variant={cameraView === 'panoramic' ? 'blue' : 'dark'}
							size="sm"
							onClick={() => setCameraView('panoramic')}
						>
							Full Map (moon.png)
						</FlatButton>
						<FlatButton
							variant={cameraView === 'split' ? 'blue' : 'dark'}
							size="sm"
							onClick={() => setCameraView('split')}
						>
							Split Camera
						</FlatButton>
					</div>

					{!isOnlineMultiplayer ? (
						<>
							<div className="flex items-center gap-1">
								<FlatButton
									variant={playMode === 'vs-bot' ? 'gold' : 'dark'}
									size="sm"
									onClick={() => setPlayMode('vs-bot')}
								>
									1P vs Bot
								</FlatButton>
								<FlatButton
									variant={playMode === 'hotseat-open' ? 'gold' : 'dark'}
									size="sm"
									onClick={() => setPlayMode('hotseat-open')}
								>
									2P Open
								</FlatButton>
								<FlatButton
									variant={playMode === 'hotseat-curtain' ? 'gold' : 'dark'}
									size="sm"
									onClick={() => setPlayMode('hotseat-curtain')}
								>
									2P Curtain
								</FlatButton>
							</div>

							<FlatButton
								variant="cream"
								size="sm"
								onClick={() => {
									audioManager.playSfx('match-start')
									setMatchSeed((s) => s + 1)
								}}
							>
								New Deal
							</FlatButton>
						</>
					) : (
						<FlatWell variant="blue-dark" className="px-3 py-1 font-mono text-xs text-emerald-300">
							{onlineRoom?.status === 'waiting'
								? 'Waiting for Challenger (P2)...'
								: opponentSilenceSeconds >= 15
									? `Opponent silent: ${opponentSilenceSeconds}s / ${ENGINE_CONFIG.disconnectForfeitSeconds}s forfeit`
									: 'Firestore Live Sync Active'}
						</FlatWell>
					)}

					<FlatButton
						variant="orange"
						size="sm"
						icon="cross"
						onClick={() => handleForfeit(isOnlineMultiplayer ? myPlayerIndex : activeIdx)}
						disabled={gameState.status === 'finished'}
					>
						Forfeit P{(isOnlineMultiplayer ? myPlayerIndex : activeIdx) + 1}
					</FlatButton>
				</div>
			</FlatPanel>

			{/* Online Waiting for Challenger Banner */}
			{isOnlineMultiplayer && onlineRoom?.status === 'waiting' && (
				<FlatPanel variant="gold" wellVariant="gold-dark" wellClassName="px-6 py-4 text-center">
					<div className="font-pixel text-xs text-amber-300">WAITING FOR CHALLENGER TO JOIN ROOM {roomCode}...</div>
					<p className="mt-1 text-xs text-slate-200">
						Share room code <strong className="font-mono text-white">{roomCode}</strong> with Player 2. As soon as they
						join from the Lobby, the battle will unlock automatically!
					</p>
				</FlatPanel>
			)}

			{/* Online Attacker Waiting for Defender Quiz Banner */}
			{isOnlineMultiplayer && currentQuizEntry && !isMyQuizToAnswer && (
				<FlatPanel variant="blue" wellVariant="blue-dark" wellClassName="px-6 py-4 text-center">
					<div className="font-pixel text-xs text-sky-300">
						OPPONENT IS ANSWERING YOUR STEM QUIZ FOR {currentQuizEntry.card.name.toUpperCase()} (#
						{currentQuizEntry.card.id})...
					</div>
					<p className="mt-1 text-xs text-slate-200">
						Queue remaining: {gameState.pendingThrow.length} card(s). Card resolves as soon as the defender answers or
						their timer expires.
					</p>
				</FlatPanel>
			)}

			{/* Last Quiz Resolution Banner / Combat Feed */}
			{gameState.lastQuizResult && (
				<FlatWell
					variant={
						gameState.lastQuizResult.resolution === 'nullified'
							? 'blue-dark'
							: gameState.lastQuizResult.resolution === 'reduced'
								? 'gold-dark'
								: 'dark'
					}
					className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 text-xs"
				>
					<div className="flex flex-wrap items-center gap-2 font-pixel text-[10px]">
						<FlatIcon name="point" />
						<span>LAST RESOLVED CARD:</span>
						<span className="text-amber-300">
							{gameState.lastQuizResult.cardName} (#{gameState.lastQuizResult.cardId})
						</span>
						<span aria-hidden="true">·</span>
						<span>
							Defender Answer: <strong>{gameState.lastQuizResult.answer.toUpperCase()}</strong>
						</span>
						<span aria-hidden="true">→</span>
						<span className="underline">
							{gameState.lastQuizResult.resolution === 'nullified'
								? 'NULLIFIED (0% EFFECT)'
								: gameState.lastQuizResult.resolution === 'reduced'
									? 'REDUCED TO 35% STRENGTH'
									: 'FULL EFFECT (100%)'}
						</span>
					</div>
					<span className="font-mono text-[11px] text-slate-300">
						Pending Queue: {gameState.pendingThrow.length} card(s)
					</span>
				</FlatWell>
			)}

			{/* Finished Match Banner */}
			{gameState.status === 'finished' && (
				<FlatPanel
					variant="gold"
					wellVariant="gold-dark"
					wellClassName="flex flex-wrap items-center justify-between gap-4 px-5 py-4"
				>
					<div>
						<div className="font-pixel text-sm text-amber-300">
							{gameState.winner !== null
								? `VICTORY! PLAYER ${gameState.winner + 1} (${gameState.players[gameState.winner].name.toUpperCase()}) WINS THE DUEL!`
								: 'DRAW! MATCH REACHED THE 500-ACTION CAP!'}
						</div>
						<p className="mt-1 text-xs text-slate-200">
							Completed in {gameState.round} round(s) ({gameState.turn} turns).
							{gameState.forfeitedBy !== null ? ` Player ${gameState.forfeitedBy + 1} forfeited.` : ''}
						</p>
					</div>
					<div className="flex items-center gap-3">
						<FlatButton variant="silver" size="md" icon="play" onClick={handleRematchClick}>
							Instant Rematch
						</FlatButton>
						<FlatButton variant="cream" size="md" icon="arrow" onClick={handleProceedToResult}>
							View Match Summary
						</FlatButton>
					</div>
				</FlatPanel>
			)}

			{/* Arena Duel Viewport: Default moon.png Battle Map Stage + Symmetric Player 1 & Player 2 HUD Panels */}
			<div className="space-y-4">
				{cameraView === 'panoramic' && (
					<BattleArenaStage
						mapId={DEFAULT_BATTLE_MAP_ID}
						p1Character={effectiveP1Char}
						p2Character={effectiveP2Char}
						p1Name={p1State.name}
						p2Name={p2State.name}
						p1Animation={
							p1State.currentHealth <= 0 || (gameState.status === 'finished' && gameState.winner === 1)
								? 'death'
								: p1Anim
						}
						p2Animation={
							p2State.currentHealth <= 0 || (gameState.status === 'finished' && gameState.winner === 0)
								? 'death'
								: p2Anim
						}
						p1Hp={p1State.currentHealth}
						p1MaxHp={p1State.maxHealth}
						p1Block={p1State.block}
						p2Hp={p2State.currentHealth}
						p2MaxHp={p2State.maxHealth}
						p2Block={p2State.block}
						activePlayerIndex={activeIdx}
						isPlaying={gameState.status === 'playing'}
						onP1AnimationComplete={() => {
							if (p1Anim === 'turnStart') {
								setP1Anim('idle')
							} else if (p1Anim === 'turnEnd') {
								setP1Anim('idle2')
							} else if (p1Anim === 'attack' || p1Anim === 'hurt') {
								setP1Anim(getRestingIdleState(effectiveP1Char, activeIdx === 0))
							}
						}}
						onP2AnimationComplete={() => {
							if (p2Anim === 'turnStart') {
								setP2Anim('idle')
							} else if (p2Anim === 'turnEnd') {
								setP2Anim('idle2')
							} else if (p2Anim === 'attack' || p2Anim === 'hurt') {
								setP2Anim(getRestingIdleState(effectiveP2Char, activeIdx === 1))
							}
						}}
					/>
				)}

				<div className="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-2">
					{/* Player 1 Panel */}
					<FlatPanel
						variant={activeIdx === 0 ? 'gold' : 'silver'}
						wellVariant={activeIdx === 0 ? 'gold-dark' : 'dark'}
						wellClassName="flex flex-col justify-between p-4"
					>
						<div className="space-y-3">
							<div className="flex flex-wrap items-center justify-between gap-2">
								<div className="flex items-center gap-2">
									<span className="flat-slot-gold px-2 py-0.5 font-pixel text-[10px] text-[#141824]">
										P1{isOnlineMultiplayer && onlineSeat === 1 ? '·YOU' : ''}
									</span>
									<span className="font-pixel text-sm text-amber-300">{p1State.name}</span>
									{activeIdx === 0 && gameState.status === 'playing' && (
										<FlatBanner variant="offset-bl" className="px-2 py-0.5 text-[9px]">
											ACTIVE TURN
										</FlatBanner>
									)}
								</div>

								<div className="flex items-center gap-3 font-pixel text-xs tabular-nums">
									{p1State.block > 0 && (
										<span className="flat-slot-blue px-2 py-0.5 text-[10px] text-white">BLOCK {p1State.block}</span>
									)}
									<span className={p1State.currentHealth <= 20 ? 'text-red-400' : 'text-emerald-300'}>
										{p1State.currentHealth}/{p1State.maxHealth} HP
									</span>
								</div>
							</div>

							{/* FlatUI Pixel HP Bar */}
							<FlatBar
								value={p1State.currentHealth}
								max={p1State.maxHealth}
								fillTone={p1State.currentHealth <= 20 ? 'red' : 'green'}
								heightClass="h-5"
							/>

							{/* Persistent Mana Bar & Affinity Info */}
							<div className="flex flex-wrap items-center justify-between gap-2 text-xs">
								<div className="flex items-center gap-2">
									<span className="font-pixel text-[10px] text-slate-200">MANA:</span>
									<FlatManaPips
										currentMana={p1State.mana}
										maxMana={p1State.maxMana}
										reservedMana={myPlayerIndex === 0 ? selectedManaCost : 0}
									/>
									<span className="font-mono text-xs text-slate-200 tabular-nums">
										{p1State.mana}/{p1State.maxMana}
									</span>
								</div>

								<div className="text-[11px] text-slate-300">
									Aff:{' '}
									<strong style={{color: SUBJECT_BORDER_PALETTE[p1Meta.affinity].highlight}}>
										{SUBJECT_BORDER_PALETTE[p1Meta.affinity].shortCode}
									</strong>{' '}
									· Weak:{' '}
									<strong style={{color: SUBJECT_BORDER_PALETTE[p1Meta.weakness].highlight}}>
										{SUBJECT_BORDER_PALETTE[p1Meta.weakness].shortCode}
									</strong>
								</div>
							</div>

							<StatusBadges powers={p1State.powers} phoenixUsed={p1State.phoenixUsed} />
						</div>

						{cameraView === 'split' && (
							<PlayerMapCropStage
								seat={1}
								mapId={DEFAULT_BATTLE_MAP_ID}
								characterId={effectiveP1Char}
								animation={
									p1State.currentHealth <= 0 || (gameState.status === 'finished' && gameState.winner === 1)
										? 'death'
										: p1Anim
								}
								facing="right"
								onAnimationComplete={() => {
									if (p1Anim === 'turnStart') {
										setP1Anim('idle')
									} else if (p1Anim === 'turnEnd') {
										setP1Anim('idle2')
									} else if (p1Anim === 'attack' || p1Anim === 'hurt') {
										setP1Anim(getRestingIdleState(effectiveP1Char, activeIdx === 0))
									}
								}}
							/>
						)}

						{/* Pile Counters */}
						<div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 pt-3 font-mono text-xs text-slate-300">
							<span>Hand: {p1State.hand.length}</span>
							<div className="flex items-center gap-1.5">
								{(!isOnlineMultiplayer || onlineSeat === 1) && (
									<FlatButton
										variant="dark"
										size="sm"
										onClick={() => {
											audioManager.playSfx('popup-open')
											setPileModal({playerIndex: 0, pile: 'draw'})
										}}
									>
										Draw ({p1State.drawPile.length})
									</FlatButton>
								)}
								<FlatButton
									variant="dark"
									size="sm"
									onClick={() => {
										audioManager.playSfx('popup-open')
										setPileModal({playerIndex: 0, pile: 'discard'})
									}}
								>
									Discard ({p1State.discardPile.length})
								</FlatButton>
								<FlatButton
									variant="dark"
									size="sm"
									onClick={() => {
										audioManager.playSfx('popup-open')
										setPileModal({playerIndex: 0, pile: 'exhaust'})
									}}
								>
									Exhaust ({p1State.exhaustPile.length})
								</FlatButton>
							</div>
						</div>
					</FlatPanel>

					{/* Player 2 Panel */}
					<FlatPanel
						variant={activeIdx === 1 ? 'blue' : 'silver'}
						wellVariant={activeIdx === 1 ? 'blue-dark' : 'dark'}
						wellClassName="flex flex-col justify-between p-4"
					>
						<div className="space-y-3">
							<div className="flex flex-wrap items-center justify-between gap-2">
								<div className="flex items-center gap-2">
									<span className="flat-slot-blue px-2 py-0.5 font-pixel text-[10px] text-white">
										P2
										{isOnlineMultiplayer ? (onlineSeat === 2 ? '·YOU' : '') : playMode === 'vs-bot' ? '·BOT' : ''}
									</span>
									<span className="font-pixel text-sm text-sky-300">{p2State.name}</span>
									{activeIdx === 1 && gameState.status === 'playing' && (
										<FlatBanner variant="offset-bl" className="px-2 py-0.5 text-[9px]">
											ACTIVE TURN
										</FlatBanner>
									)}
								</div>

								<div className="flex items-center gap-3 font-pixel text-xs tabular-nums">
									{p2State.block > 0 && (
										<span className="flat-slot-blue px-2 py-0.5 text-[10px] text-white">BLOCK {p2State.block}</span>
									)}
									<span className={p2State.currentHealth <= 20 ? 'text-red-400' : 'text-emerald-300'}>
										{p2State.currentHealth}/{p2State.maxHealth} HP
									</span>
								</div>
							</div>

							{/* FlatUI Pixel HP Bar */}
							<FlatBar
								value={p2State.currentHealth}
								max={p2State.maxHealth}
								fillTone={p2State.currentHealth <= 20 ? 'red' : 'green'}
								heightClass="h-5"
							/>

							{/* Persistent Mana Bar & Affinity Info */}
							<div className="flex flex-wrap items-center justify-between gap-2 text-xs">
								<div className="flex items-center gap-2">
									<span className="font-pixel text-[10px] text-slate-200">MANA:</span>
									<FlatManaPips
										currentMana={p2State.mana}
										maxMana={p2State.maxMana}
										reservedMana={myPlayerIndex === 1 ? selectedManaCost : 0}
									/>
									<span className="font-mono text-xs text-slate-200 tabular-nums">
										{p2State.mana}/{p2State.maxMana}
									</span>
								</div>

								<div className="text-[11px] text-slate-300">
									Aff:{' '}
									<strong style={{color: SUBJECT_BORDER_PALETTE[p2Meta.affinity].highlight}}>
										{SUBJECT_BORDER_PALETTE[p2Meta.affinity].shortCode}
									</strong>{' '}
									· Weak:{' '}
									<strong style={{color: SUBJECT_BORDER_PALETTE[p2Meta.weakness].highlight}}>
										{SUBJECT_BORDER_PALETTE[p2Meta.weakness].shortCode}
									</strong>
								</div>
							</div>

							<StatusBadges powers={p2State.powers} phoenixUsed={p2State.phoenixUsed} />
						</div>

						{cameraView === 'split' && (
							<PlayerMapCropStage
								seat={2}
								mapId={DEFAULT_BATTLE_MAP_ID}
								characterId={effectiveP2Char}
								animation={
									p2State.currentHealth <= 0 || (gameState.status === 'finished' && gameState.winner === 0)
										? 'death'
										: p2Anim
								}
								facing="left"
								onAnimationComplete={() => {
									if (p2Anim === 'turnStart') {
										setP2Anim('idle')
									} else if (p2Anim === 'turnEnd') {
										setP2Anim('idle2')
									} else if (p2Anim === 'attack' || p2Anim === 'hurt') {
										setP2Anim(getRestingIdleState(effectiveP2Char, activeIdx === 1))
									}
								}}
							/>
						)}

						{/* Pile Counters */}
						<div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 pt-3 font-mono text-xs text-slate-300">
							<span>Hand: {p2State.hand.length}</span>
							<div className="flex items-center gap-1.5">
								{(!isOnlineMultiplayer || onlineSeat === 2) && (
									<FlatButton
										variant="dark"
										size="sm"
										onClick={() => {
											audioManager.playSfx('popup-open')
											setPileModal({playerIndex: 1, pile: 'draw'})
										}}
									>
										Draw ({p2State.drawPile.length})
									</FlatButton>
								)}
								<FlatButton
									variant="dark"
									size="sm"
									onClick={() => {
										audioManager.playSfx('popup-open')
										setPileModal({playerIndex: 1, pile: 'discard'})
									}}
								>
									Discard ({p2State.discardPile.length})
								</FlatButton>
								<FlatButton
									variant="dark"
									size="sm"
									onClick={() => {
										audioManager.playSfx('popup-open')
										setPileModal({playerIndex: 1, pile: 'exhaust'})
									}}
								>
									Exhaust ({p2State.exhaustPile.length})
								</FlatButton>
							</div>
						</div>
					</FlatPanel>
				</div>
			</div>

			{/* Player Hand & Throw Control Deck */}
			<FlatPanel variant="silver" wellVariant="dark" className="relative" wellClassName="space-y-4 p-5">
				{/* Optional Pass-and-Play Curtain */}
				{showPassCurtain && (
					<div className="flat-frame-gold absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/95 p-6 text-center">
						<FlatBanner variant="offset-bl">
							PASS DEVICE TO PLAYER {activeIdx + 1} ({activePlayer.name.toUpperCase()})
						</FlatBanner>
						<p className="mt-3 max-w-md text-xs text-slate-200">
							Hand cards are hidden during turn transitions in 2P Curtain mode so your opponent cannot see your hand or
							bound questions.
						</p>
						<FlatButton
							variant="cream"
							size="lg"
							icon="play"
							onClick={() => setCurtainDismissedForTurn(gameState.turn)}
							className="mt-4"
						>
							Reveal P{activeIdx + 1} Hand
						</FlatButton>
					</div>
				)}

				{/* Hand Header & Action Controls */}
				<div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-3">
					<div>
						<div className="flex flex-wrap items-center gap-2.5 font-pixel text-xs">
							<FlatBanner variant="offset-bl" className="px-2 py-0.5 text-[10px]">
								P{myPlayerIndex + 1} ({displayedHandPlayer.name}) HAND ({displayedHandPlayer.hand.length}/
								{ENGINE_CONFIG.maxHandSize})
							</FlatBanner>
							<span className="font-mono text-xs text-slate-200">
								Selected: {selectedInstanceIds.length} card(s) ({selectedManaCost}/{displayedHandPlayer.mana} Mana)
							</span>
						</div>
						<p className="mt-1.5 text-xs text-slate-300">
							{isMyTurnToAct
								? 'Click affordable cards in the order you want to throw them. Numbers marked with * show live matchup damage / block / heal.'
								: isOnlineMultiplayer
									? `Waiting for Player ${activeIdx + 1} (${activePlayer.name}) to complete their turn...`
									: 'Bot is executing turn...'}
						</p>
					</div>

					{/* Primary Turn Actions */}
					<div className="flex flex-wrap items-center gap-2.5">
						{selectedInstanceIds.length > 0 && (
							<FlatButton
								variant="silver"
								size="md"
								icon="cross"
								onClick={() => {
									audioManager.playSfx('cancel')
									setSelectedInstanceIds([])
								}}
							>
								Clear ({selectedInstanceIds.length})
							</FlatButton>
						)}

						<FlatButton
							variant="cream"
							size="md"
							icon="play"
							onClick={handleThrowSelected}
							disabled={selectedInstanceIds.length === 0 || !isMyTurnToAct}
						>
							Throw Selected ({selectedInstanceIds.length} · {selectedManaCost}M)
						</FlatButton>

						<FlatButton
							variant="blue"
							size="md"
							icon="plus"
							onClick={handleSkipTurn}
							disabled={hasThrownThisTurn || gameState.throwsThisTurn > 0 || !isMyTurnToAct}
							title="Throw nothing this turn to gain +1 bonus Mana (up to 5) and end turn"
						>
							Skip Turn (+1 Mana)
						</FlatButton>

						<FlatButton variant="gold" size="md" icon="arrow" onClick={handleEndTurn} disabled={!isMyTurnToAct}>
							End Turn
						</FlatButton>
					</div>
				</div>

				{/* Validation / Status Feedback */}
				{statusMessage && (
					<FlatWell variant="gold-dark" className="px-3 py-2 font-mono text-xs text-amber-200">
						{statusMessage}
					</FlatWell>
				)}

				{!hasAnyPlayableCard && !hasThrownThisTurn && isMyTurnToAct && (
					<FlatWell variant="blue-dark" className="px-3 py-2 font-mono text-xs text-sky-200">
						No card in hand is currently affordable with {displayedHandPlayer.mana} Mana. Click &ldquo;Skip Turn (+1
						Mana)&rdquo; to bank +1 bonus Mana!
					</FlatWell>
				)}

				{/* Hand Cards Row */}
				{displayedHandPlayer.hand.length === 0 ? (
					<div className="py-12 text-center font-pixel text-xs text-slate-400">
						No cards remaining in hand. Click &ldquo;End Turn&rdquo; to pass the turn.
					</div>
				) : (
					<div className="flex flex-wrap items-center justify-center gap-5 pt-3 pb-2">
						{displayedHandPlayer.hand.map((card) => {
							const selIdx = selectedInstanceIds.indexOf(card.instanceId)
							const isSelected = selIdx !== -1
							const remainingMana = displayedHandPlayer.mana - selectedManaCost
							const playableAlone = canPlay(gameState, card, myPlayerIndex)
							const canAddToSelection = isSelected || (isMyTurnToAct && playableAlone && card.cost <= remainingMana)
							const liveText = formatLiveCardText(card, gameState, myPlayerIndex)

							return (
								<div key={card.instanceId} className="relative">
									{isSelected && (
										<>
											<div className="flat-select-reticle pointer-events-none absolute -inset-2 z-20" />
											<div className="flat-slot-gold pointer-events-none absolute -top-3.5 left-1/2 z-30 -translate-x-1/2 px-2 py-0.5 font-pixel text-[9px] text-[#141824] shadow-md">
												THROW #{selIdx + 1}
											</div>
										</>
									)}
									<NineSliceCard
										id={card.id}
										name={card.name}
										subject={card.subject}
										rarity={card.rarity}
										cost={card.cost}
										text={liveText}
										upgraded={card.upgraded}
										exhaust={card.exhaust}
										power={card.power}
										integerScale={3}
										selected={isSelected}
										selectionOrder={isSelected ? selIdx + 1 : undefined}
										disabled={!canAddToSelection && !isSelected}
										onClick={() => handleToggleCard(card)}
										onPeek={() => {
											audioManager.playSfx('popup-open')
											setPeekCard(card)
										}}
									/>
								</div>
							)
						})}
					</div>
				)}
			</FlatPanel>

			{/* Active Quiz Modal when status === 'quizzing' and it is this client's quiz to answer */}
			{currentQuizEntry && isMyQuizToAnswer && (
				<QuizCanvasModal
					entry={currentQuizEntry}
					queuePosition={1}
					queueTotal={gameState.pendingThrow.length}
					attackerCharacter={currentQuizEntry.casterIndex === 0 ? effectiveP1Char : effectiveP2Char}
					defenderCharacter={currentQuizEntry.defenderIndex === 0 ? effectiveP1Char : effectiveP2Char}
					formattedCardText={formatLiveCardText(currentQuizEntry.card, gameState, currentQuizEntry.casterIndex)}
					seed={gameState.seed}
					isBotDefender={!isOnlineMultiplayer && playMode === 'vs-bot' && currentQuizEntry.defenderIndex === 1}
					onResolve={handleResolveQuiz}
				/>
			)}

			{/* Bound Question Peek Modal */}
			{peekCard && (
				<QuestionPeekModal
					card={peekCard}
					seed={gameState.seed}
					onClose={() => {
						audioManager.playSfx('popup-close')
						setPeekCard(null)
					}}
				/>
			)}

			{/* Pile Inspection Modal */}
			{pileModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
					<FlatPanel
						variant="silver"
						wellVariant="dark"
						className="max-h-[85vh] w-full max-w-[960px] overflow-y-auto"
						wellClassName="p-6 space-y-4"
					>
						<div className="flex items-center justify-between border-b border-slate-800 pb-3">
							<FlatBanner variant="offset-bl">
								P{pileModal.playerIndex + 1} ({gameState.players[pileModal.playerIndex].name}) ·{' '}
								{pileModal.pile.toUpperCase()} PILE
							</FlatBanner>
							<FlatButton
								variant="cream"
								size="sm"
								icon="cross"
								onClick={() => {
									audioManager.playSfx('popup-close')
									setPileModal(null)
								}}
							>
								Close
							</FlatButton>
						</div>

						{(() => {
							const p = gameState.players[pileModal.playerIndex]
							const list =
								pileModal.pile === 'draw'
									? [...p.drawPile].sort((a, b) => a.id.localeCompare(b.id))
									: pileModal.pile === 'discard'
										? p.discardPile
										: p.exhaustPile

							if (list.length === 0) {
								return <div className="py-10 text-center font-pixel text-xs text-slate-400">Pile is empty.</div>
							}

							return (
								<div className="flex flex-wrap items-center justify-center gap-4 py-2">
									{list.map((c) => (
										<NineSliceCard
											key={c.instanceId}
											id={c.id}
											name={c.name}
											subject={c.subject}
											rarity={c.rarity}
											cost={c.cost}
											text={c.text}
											upgraded={c.upgraded}
											exhaust={c.exhaust}
											power={c.power}
											integerScale={2}
										/>
									))}
								</div>
							)
						})()}
					</FlatPanel>
				</div>
			)}
		</div>
	)
}
