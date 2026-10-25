import type {User} from 'firebase/auth'
import {useEffect, useState} from 'react'
import {audioManager} from './audio/audioManager'
import type {CharacterId} from './engine/config'
import {subscribeAuth} from './firebase/client'
import type {MultiplayerSeat, RoomDocument} from './firebase/multiplayer'
import {FlatBanner, FlatButton} from './ui/components/FlatUi'
import {SettingsContent, SettingsModal} from './ui/components/SettingsModal'
import {BattleScreen, type MatchSummary} from './ui/screens/BattleScreen'
import {CharacterSelectScreen} from './ui/screens/CharacterSelectScreen'
import {CollectionScreen} from './ui/screens/CollectionScreen'
import {CreditsScreen} from './ui/screens/CreditsScreen'
import {DebugGalleryScreen} from './ui/screens/DebugGalleryScreen'
import {LobbyScreen} from './ui/screens/LobbyScreen'
import {ResultScreen} from './ui/screens/ResultScreen'
import {TitleScreen} from './ui/screens/TitleScreen'
import {preloadAllCardFrames} from './ui/utils/nineSliceCache'

export type ScreenRoute =
	| 'title'
	| 'select'
	| 'lobby'
	| 'battle'
	| 'result'
	| 'collection'
	| 'settings'
	| 'credits'
	| 'debug'

function parseHashRoute(): ScreenRoute {
	const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase()
	if (hash === 'debug') return 'debug'
	if (hash === 'select') return 'select'
	if (hash === 'lobby') return 'lobby'
	if (hash === 'battle') return 'battle'
	if (hash === 'result') return 'result'
	if (hash === 'collection') return 'collection'
	if (hash === 'settings') return 'settings'
	if (hash === 'credits') return 'credits'
	return 'title'
}

const ROUTE_BANNER_LABELS: Record<ScreenRoute, string> = {
	title: 'MAIN MENU',
	select: 'PLAY · CHOOSE YOUR FIGHTER',
	lobby: 'PLAY · ROOM LOBBY',
	battle: 'BATTLE ARENA',
	result: 'MATCH RESULT',
	collection: 'COLLECTION · CARDS & DECKS',
	settings: 'SETTINGS · AUDIO & SOUND',
	credits: 'CREDITS & ATTRIBUTIONS',
	debug: 'CREDITS · DEBUG GALLERY',
}

export function App() {
	const [route, setRoute] = useState<ScreenRoute>(() => parseHashRoute())
	const [p1Character, setP1Character] = useState<CharacterId>('dark-ninja')
	const [p2Character, setP2Character] = useState<CharacterId>('knight')
	const [roomCode, setRoomCode] = useState<string>('QD7X9K')
	const [isOnlineMultiplayer, setIsOnlineMultiplayer] = useState<boolean>(false)
	const [onlineSeat, setOnlineSeat] = useState<MultiplayerSeat>(1)
	const [activeOnlineRoom, setActiveOnlineRoom] = useState<RoomDocument | null>(null)
	const [authUser, setAuthUser] = useState<User | null>(null)
	const [winner, setWinner] = useState<0 | 1 | 2>(1)
	const [matchSummary, setMatchSummary] = useState<MatchSummary | null>(null)
	const [showSettingsOverlay, setShowSettingsOverlay] = useState<boolean>(false)

	useEffect(() => {
		preloadAllCardFrames([2, 3, 4])
		audioManager.preloadAllVoiceClips()

		const unsubAuth = subscribeAuth((u) => {
			setAuthUser(u)
		})

		const onHashChange = () => {
			audioManager.playSfx('cursor')
			setRoute(parseHashRoute())
		}
		window.addEventListener('hashchange', onHashChange)

		// Unlock and start background music on first user gesture
		const unlockBgm = () => {
			if (!audioManager.isMusicMuted() && !audioManager.isBgmPlaying()) {
				audioManager.playBgm(parseHashRoute() === 'battle' ? 'battle' : 'menu')
			}
		}
		window.addEventListener('pointerdown', unlockBgm, {passive: true})
		window.addEventListener('keydown', unlockBgm, {passive: true})

		return () => {
			unsubAuth()
			window.removeEventListener('hashchange', onHashChange)
			window.removeEventListener('pointerdown', unlockBgm)
			window.removeEventListener('keydown', unlockBgm)
		}
	}, [])

	// Switch background music track automatically when navigating between Menu/Lobby and Battle Arena
	useEffect(() => {
		const targetTrack = route === 'battle' ? 'battle' : 'menu'
		audioManager.playBgm(targetTrack)
	}, [route])

	const navigate = (next: ScreenRoute) => {
		audioManager.playSfx('click')
		window.location.hash = next === 'title' ? '#/' : `#/${next}`
		setRoute(next)
	}

	return (
		<div className="flex min-h-screen flex-col bg-[#141926] text-slate-100">
			{/* Uniform In-Game Top HUD Bar on Sub-Screens (Hidden on Title Main Menu) */}
			{route !== 'title' && (
				<header className="flat-frame-silver bg-[#adb7c4] px-2 py-1">
					<div className="flat-slot-dark flex flex-wrap items-center justify-between gap-4 px-4 py-2">
						<div className="flex items-center gap-2.5">
							<FlatButton
								variant="cream"
								size="sm"
								icon="arrow"
								onClick={() => {
									if (route === 'debug') {
										navigate('credits')
									} else if (route === 'lobby') {
										navigate('select')
									} else {
										navigate('title')
									}
								}}
							>
								{route === 'debug' ? 'Back to Credits' : route === 'lobby' ? 'Back to Fighters' : 'Main Menu'}
							</FlatButton>

							{(route === 'debug' || route === 'lobby') && (
								<FlatButton variant="dark" size="sm" onClick={() => navigate('title')}>
									Main Menu
								</FlatButton>
							)}
						</div>

						<FlatBanner variant="offset-bl" className="px-3 py-0.5 text-[11px]">
							{ROUTE_BANNER_LABELS[route]}
						</FlatBanner>

						<div className="flex items-center gap-2">
							{route !== 'collection' && route !== 'battle' && (
								<FlatButton variant="gold" size="sm" icon="point" onClick={() => navigate('collection')}>
									Collection
								</FlatButton>
							)}

							{route !== 'settings' && (
								<FlatButton
									variant="blue"
									size="sm"
									icon="stripe"
									onClick={() => {
										audioManager.playSfx('popup-open')
										setShowSettingsOverlay(true)
									}}
								>
									Settings
								</FlatButton>
							)}
						</div>
					</div>
				</header>
			)}

			{/* Main Screen Content */}
			<main className="flex-1">
				{route === 'title' && (
					<TitleScreen
						onStartSelect={() => navigate('select')}
						onOpenCollection={() => navigate('collection')}
						onOpenSettings={() => navigate('settings')}
						onOpenCredits={() => navigate('credits')}
						onSelectCharacter={(id) => {
							setP1Character(id)
							navigate('select')
						}}
					/>
				)}

				{route === 'select' && (
					<CharacterSelectScreen
						p1Character={p1Character}
						p2Character={p2Character}
						onSelectP1={setP1Character}
						onSelectP2={setP2Character}
						onProceedToLobby={() => navigate('lobby')}
						onStartQuickBattle={() => {
							setIsOnlineMultiplayer(false)
							navigate('battle')
						}}
					/>
				)}

				{route === 'collection' && (
					<CollectionScreen
						onBackToMenu={() => navigate('title')}
						onSelectFighterForPlay={(id) => {
							setP1Character(id)
							navigate('select')
						}}
					/>
				)}

				{route === 'settings' && (
					<div className="mx-auto flex max-w-[900px] flex-col items-center px-6 py-8">
						<SettingsContent onClose={() => navigate('title')} />
					</div>
				)}

				{route === 'credits' && (
					<CreditsScreen onBackToMenu={() => navigate('title')} onOpenDebugGallery={() => navigate('debug')} />
				)}

				{route === 'lobby' && (
					<LobbyScreen
						p1Character={p1Character}
						p2Character={p2Character}
						authUser={authUser}
						onBackToSelect={() => navigate('select')}
						onStartLocalBattle={(code) => {
							setRoomCode(code)
							setIsOnlineMultiplayer(false)
							setActiveOnlineRoom(null)
							navigate('battle')
						}}
						onStartOnlineBattle={(code, seat, roomDoc) => {
							setRoomCode(code)
							setOnlineSeat(seat)
							setIsOnlineMultiplayer(true)
							if (roomDoc) {
								setActiveOnlineRoom(roomDoc)
								setP1Character(roomDoc.hostCharacter)
								setP2Character(roomDoc.guestCharacter)
							}
							navigate('battle')
						}}
					/>
				)}

				{route === 'battle' && (
					<BattleScreen
						p1Character={p1Character}
						p2Character={p2Character}
						roomCode={roomCode}
						isOnlineMultiplayer={isOnlineMultiplayer}
						onlineSeat={onlineSeat}
						initialRoom={activeOnlineRoom}
						onFinishBattle={(winSeat, summary) => {
							setWinner(winSeat)
							setMatchSummary(summary ?? null)
							navigate('result')
						}}
					/>
				)}

				{route === 'result' && (
					<ResultScreen
						winner={winner}
						p1Character={p1Character}
						p2Character={p2Character}
						summary={matchSummary}
						onRematch={() => navigate('battle')}
						onReturnSelect={() => navigate('select')}
					/>
				)}

				{route === 'debug' && <DebugGalleryScreen />}
			</main>

			{/* Global In-Game Settings Overlay (Sound Sliders accessible anytime) */}
			{showSettingsOverlay && <SettingsModal onClose={() => setShowSettingsOverlay(false)} />}
		</div>
	)
}
