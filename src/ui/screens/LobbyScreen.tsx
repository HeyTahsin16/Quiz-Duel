import type {User} from 'firebase/auth'
import {useEffect, useState} from 'react'
import {audioManager} from '../../audio/audioManager'
import {CHARACTERS, type CharacterId} from '../../engine/config'
import {signInWithGoogle, signOutUser} from '../../firebase/client'
import {
	createMultiplayerRoom,
	generateRandomRoomCode,
	joinMultiplayerRoom,
	type MultiplayerSeat,
	type RoomDocument,
	sanitizeRoomCode,
	subscribeToRoom,
} from '../../firebase/multiplayer'
import {FlatBanner, FlatButton, FlatPanel, FlatWell} from '../components/FlatUi'

export interface LobbyScreenProps {
	p1Character: CharacterId
	p2Character: CharacterId
	authUser: User | null
	onBackToFighters?: () => void
	onStartOnlineBattle: (roomCode: string, seat: MultiplayerSeat, room?: RoomDocument) => void
}

export function LobbyScreen({
	p1Character,
	p2Character,
	authUser,
	onBackToFighters,
	onStartOnlineBattle,
}: LobbyScreenProps) {
	const [roomCode, setRoomCode] = useState<string>('QD7X9K')
	const [joinInput, setJoinInput] = useState<string>('')
	const [hostedRoom, setHostedRoom] = useState<RoomDocument | null>(null)
	const [isBusy, setIsBusy] = useState<boolean>(false)
	const [errorMsg, setErrorMsg] = useState<string | null>(null)
	const [copiedCode, setCopiedCode] = useState<boolean>(false)

	const handleCopyCode = () => {
		audioManager.playSfx('click')
		navigator.clipboard?.writeText(roomCode).catch(() => {})
		setCopiedCode(true)
		window.setTimeout(() => setCopiedCode(false), 1800)
	}

	// Subscribe to hosted room while waiting for challenger to join
	useEffect(() => {
		if (!hostedRoom) return
		const unsub = subscribeToRoom(
			hostedRoom.roomCode,
			(updated) => {
				if (!updated) return
				setHostedRoom(updated)
				if (updated.status === 'playing' && updated.guestUid !== '') {
					audioManager.playSfx('select')
					onStartOnlineBattle(updated.roomCode, 1, updated)
				}
			},
			(err) => {
				setErrorMsg(err instanceof Error ? err.message : 'Failed to sync room state.')
			},
		)
		return () => unsub()
	}, [hostedRoom, onStartOnlineBattle])

	const handleGenerateCode = () => {
		audioManager.playSfx('click')
		setRoomCode(generateRandomRoomCode())
		setHostedRoom(null)
		setErrorMsg(null)
		setCopiedCode(false)
	}

	const handleSignIn = async () => {
		setErrorMsg(null)
		setIsBusy(true)
		try {
			await signInWithGoogle()
			audioManager.playSfx('click')
		} catch (err) {
			setErrorMsg(err instanceof Error ? err.message : 'Google sign-in failed.')
		} finally {
			setIsBusy(false)
		}
	}

	const handleSignOut = async () => {
		setErrorMsg(null)
		setHostedRoom(null)
		await signOutUser()
	}

	const handleHostOnlineRoom = async () => {
		setErrorMsg(null)
		setIsBusy(true)
		try {
			let currentUser = authUser
			if (!currentUser) {
				currentUser = await signInWithGoogle()
			}
			const {roomCode: createdCode, tabSeatId} = await createMultiplayerRoom(roomCode, p1Character, p2Character)
			audioManager.playSfx('click')
			setHostedRoom({
				roomCode: createdCode,
				hostUid: currentUser.uid,
				hostSeatId: tabSeatId,
				hostName: currentUser.displayName || 'Host P1',
				hostCharacter: p1Character,
				guestUid: '',
				guestSeatId: '',
				guestName: '',
				guestCharacter: p2Character,
				seed: 1337,
				status: 'waiting',
				actionCount: 1,
				actionLog: [],
				hostLastSeenMs: Date.now(),
				guestLastSeenMs: Date.now(),
				winnerSeat: 0,
				forfeitedBySeat: 0,
				rematchCount: 0,
			})
		} catch (err) {
			setErrorMsg(err instanceof Error ? err.message : 'Could not create online room.')
		} finally {
			setIsBusy(false)
		}
	}

	const handleJoinOnlineRoom = async () => {
		setErrorMsg(null)
		const targetCode = sanitizeRoomCode(joinInput || roomCode)
		if (targetCode.length !== 6) {
			setErrorMsg('Please enter a 6-character room code (A–Z, 0–9).')
			return
		}
		setIsBusy(true)
		try {
			if (!authUser) {
				await signInWithGoogle()
			}
			const {roomCode: joinedCode, seat, room} = await joinMultiplayerRoom(targetCode, p2Character)
			audioManager.playSfx('select')
			onStartOnlineBattle(joinedCode, seat, room)
		} catch (err) {
			setErrorMsg(err instanceof Error ? err.message : 'Could not join room.')
		} finally {
			setIsBusy(false)
		}
	}

	return (
		<div className="mx-auto max-w-[1120px] space-y-6 px-6 py-8">
			{/* Top Header & Auth Bar */}
			<FlatPanel
				variant="silver"
				wellVariant="dark"
				wellClassName="flex flex-wrap items-center justify-between gap-4 p-5"
			>
				<div>
					<FlatBanner variant="offset-bl">MATCH LOBBY</FlatBanner>
					<p className="mt-2 text-sm text-slate-300">Host or join a live 1v1 online room by 6-character code.</p>
				</div>
				<div className="flex flex-wrap items-center gap-3">
					{onBackToFighters && (
						<FlatButton
							variant="cream"
							size="md"
							icon="arrow"
							onClick={() => {
								audioManager.playSfx('click')
								onBackToFighters()
							}}
						>
							Back to Fighters
						</FlatButton>
					)}
					{authUser ? (
						<FlatWell variant="dark" className="flex items-center gap-3 px-3 py-1.5 text-xs">
							<span className="text-emerald-300">
								Signed in: <strong>{authUser.displayName || authUser.email || 'Duelist'}</strong>
							</span>
							<FlatButton variant="silver" size="sm" onClick={handleSignOut}>
								Sign Out
							</FlatButton>
						</FlatWell>
					) : (
						<FlatButton variant="gold" size="md" icon="check" disabled={isBusy} onClick={handleSignIn}>
							Sign in with Google
						</FlatButton>
					)}
				</div>
			</FlatPanel>

			{errorMsg && (
				<FlatWell variant="orange" className="px-4 py-3 font-mono text-xs text-white">
					{errorMsg}
				</FlatWell>
			)}

			<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
				{/* Create Online Room Panel (Seat 1) */}
				<FlatPanel variant="gold" wellVariant="gold-dark" wellClassName="flex flex-col justify-between space-y-4 p-5">
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<FlatBanner variant="offset-bl">01. Host Online Room (Seat 1)</FlatBanner>
							<span className="font-mono text-xs text-amber-200">Champion: {CHARACTERS[p1Character].name}</span>
						</div>

						<div className="flat-input flex items-center justify-between px-3 py-2">
							<span className="font-pixel text-lg tracking-widest text-amber-300 tabular-nums">{roomCode}</span>
							<div className="flex items-center gap-2">
								<FlatButton variant="gold" size="sm" icon={copiedCode ? 'check' : 'point'} onClick={handleCopyCode}>
									{copiedCode ? 'Copied!' : 'Copy'}
								</FlatButton>
								<FlatButton variant="silver" size="sm" onClick={handleGenerateCode}>
									New Code
								</FlatButton>
							</div>
						</div>

						{hostedRoom && (
							<FlatWell variant="dark" className="space-y-2 p-3 text-xs text-amber-200">
								<div className="font-pixel text-[10px]">ROOM {hostedRoom.roomCode} LIVE — WAITING FOR OPPONENT...</div>
								<p className="text-slate-300">
									Share code <strong className="font-mono text-white">{hostedRoom.roomCode}</strong> with your opponent.
									The match starts automatically when they join, or you can enter the arena now.
								</p>
								<FlatButton
									variant="gold"
									size="sm"
									icon="play"
									onClick={() => onStartOnlineBattle(hostedRoom.roomCode, 1, hostedRoom)}
									className="mt-1 w-full"
								>
									Enter Waiting Arena Now
								</FlatButton>
							</FlatWell>
						)}
					</div>

					<div className="pt-2">
						<FlatButton
							variant="cream"
							size="lg"
							icon="play"
							disabled={isBusy}
							onClick={handleHostOnlineRoom}
							className="w-full"
						>
							{hostedRoom ? `Re-Host Online Room ${roomCode}` : `Create Online Room ${roomCode}`}
						</FlatButton>
					</div>
				</FlatPanel>

				{/* Join by 6-Character Code Panel (Seat 2) */}
				<FlatPanel variant="blue" wellVariant="blue-dark" wellClassName="flex flex-col justify-between space-y-4 p-5">
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<FlatBanner variant="offset-bl">02. Join Online Room (Seat 2)</FlatBanner>
							<span className="font-mono text-xs text-sky-200">Champion: {CHARACTERS[p2Character].name}</span>
						</div>

						<input
							type="text"
							maxLength={6}
							value={joinInput}
							onChange={(e) => setJoinInput(sanitizeRoomCode(e.target.value))}
							placeholder="ENTER 6-CHAR CODE (E.G. QD7X9K)"
							className="flat-input w-full px-3 py-2.5 font-pixel text-sm uppercase tracking-widest text-white placeholder:text-slate-300"
						/>

						<p className="text-xs leading-relaxed text-slate-300">
							Enter the 6-character code created by Player 1. If you were disconnected from an active room within the
							60-second window, entering its code here reconnects and resumes your seat immediately.
						</p>
					</div>

					<FlatButton
						variant="blue"
						size="lg"
						icon="play"
						disabled={isBusy}
						onClick={handleJoinOnlineRoom}
						className="w-full"
					>
						Join Online Room &amp; Enter Arena
					</FlatButton>
				</FlatPanel>
			</div>
		</div>
	)
}
