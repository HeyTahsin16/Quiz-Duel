import {useEffect, useState} from 'react'
import {
	audioManager,
	BGM_TRACK_MAP,
	type BgmTrackId,
	SFX_FILE_MAP,
	type SfxEvent,
	type VoicePlaybackReport,
} from '../../audio/audioManager'
import {
	CHARACTER_LIST,
	type CharacterId,
	DARK_NINJA_AUDIO_CONFIG,
	FRAME_LIST,
	type FrameType,
	NINE_SLICE_CONFIG,
	RARITY_FILL_PALETTE,
	RARITY_LIST,
	type Rarity,
	type SpriteAnimationState,
	SUBJECT_BORDER_PALETTE,
	SUBJECT_LIST,
	type Subject,
	VOICE_EVENT_LIST,
	VOICE_MAP,
	type VoiceEvent,
} from '../../engine/config'
import {BattleArenaStage} from '../components/BattleArenaStage'
import {FlatBanner, FlatButton, FlatPanel, FlatWell} from '../components/FlatUi'
import {NineSliceCard} from '../components/NineSliceCard'
import {PixelSprite} from '../components/PixelSprite'
import {
	type CachedFrameStats,
	getFrameCacheStats,
	preloadAllCardFrames,
	replaceFrameSourceAndRebuild,
} from '../utils/nineSliceCache'

const SAMPLE_CATALOG_CARDS: Record<
	Subject,
	Record<
		Rarity,
		{
			id: string
			name: string
			cost: number
			baseText: string
			upgradedText: string
			upgradedCost?: number
			exhaust?: boolean
			power?: boolean
		}
	>
> = {
	maths: {
		normal: {
			id: 'M1',
			name: 'Strike',
			cost: 1,
			baseText: 'Deal 6.',
			upgradedText: 'Deal 8.',
		},
		uncommon: {
			id: 'M9',
			name: 'Carnage',
			cost: 2,
			baseText: 'Deal 20.',
			upgradedText: 'Deal 28.',
		},
		epic: {
			id: 'M18',
			name: 'Bludgeon',
			cost: 3,
			baseText: 'Deal 32.',
			upgradedText: 'Deal 45.',
		},
		legendary: {
			id: 'M20',
			name: 'Feed',
			cost: 2,
			baseText: 'Deal 14. Life steal 50%. Raise your max HP by 4.',
			upgradedText: 'Deal 20. Life steal 50%. Raise your max HP by 6.',
			exhaust: true,
		},
	},
	physics: {
		normal: {
			id: 'P1',
			name: 'Defend',
			cost: 1,
			baseText: 'Gain 5 Block.',
			upgradedText: 'Gain 7 Block.',
		},
		uncommon: {
			id: 'P9',
			name: 'Melter',
			cost: 1,
			baseText: "Remove all of the opponent's Block. Deal 10.",
			upgradedText: "Remove all of the opponent's Block. Deal 14.",
		},
		epic: {
			id: 'P15',
			name: 'Impervious',
			cost: 2,
			baseText: 'Gain 30 Block.',
			upgradedText: 'Gain 42 Block.',
			exhaust: true,
		},
		legendary: {
			id: 'P20',
			name: 'Hyperbeam',
			cost: 2,
			baseText: "Remove all of the opponent's Block. Deal 26.",
			upgradedText: "Remove all of the opponent's Block. Deal 36.",
		},
	},
	chemistry: {
		normal: {
			id: 'C1',
			name: 'Deadly Poison',
			cost: 1,
			baseText: 'Apply 5 Poison.',
			upgradedText: 'Apply 7 Poison.',
		},
		uncommon: {
			id: 'C12',
			name: 'Crippling Cloud',
			cost: 2,
			baseText: 'Apply 4 Poison and 2 Weak.',
			upgradedText: 'Apply 6 Poison and 3 Weak.',
			exhaust: true,
		},
		epic: {
			id: 'C15',
			name: 'Shockwave',
			cost: 2,
			baseText: 'Apply 3 Weak and 3 Vulnerable.',
			upgradedText: 'Apply 4 Weak and 4 Vulnerable.',
			exhaust: true,
		},
		legendary: {
			id: 'C19',
			name: 'Corpse Explosion',
			cost: 3,
			baseText: 'Apply 6 Poison, then Poison burst.',
			upgradedText: 'Apply 8 Poison, then Poison burst.',
			exhaust: true,
		},
	},
	biology: {
		normal: {
			id: 'B3',
			name: 'Photosynthesis',
			cost: 1,
			baseText: 'Heal 5.',
			upgradedText: 'Heal 7.',
		},
		uncommon: {
			id: 'B13',
			name: 'Transfusion',
			cost: 2,
			baseText: 'Heal 12.',
			upgradedText: 'Heal 17.',
		},
		epic: {
			id: 'B16',
			name: 'Quarantine',
			cost: 2,
			baseText: 'Cure all your debuffs and gain 3 Ward.',
			upgradedText: 'Cure all your debuffs and gain 4 Ward.',
			exhaust: true,
		},
		legendary: {
			id: 'B19',
			name: 'Phoenix',
			cost: 3,
			upgradedCost: 2,
			baseText: 'Once this battle, if your HP would reach 0, revive with 30% max HP.',
			upgradedText: 'Once this battle, if your HP would reach 0, revive with 30% max HP.',
			exhaust: true,
		},
	},
}

export function DebugGalleryScreen() {
	const [cardScale, setCardScale] = useState<2 | 3 | 4>(2)
	const [showSliceGuides, setShowSliceGuides] = useState(false)
	const [filterFrame, setFilterFrame] = useState<'ALL' | FrameType>('ALL')
	const [cacheStats, setCacheStats] = useState<CachedFrameStats>(() => getFrameCacheStats())

	// Sprite comparison controls
	const [spriteScale, setSpriteScale] = useState<2 | 3 | 4>(3)
	const [spriteFacing, setSpriteFacing] = useState<'right' | 'left' | 'duel'>('duel')
	const [spriteAnimation, setSpriteAnimation] = useState<SpriteAnimationState>('idle')
	const [animateSprites, setAnimateSprites] = useState(true)
	const [manualFrame, setManualFrame] = useState<number>(0)
	const [mapP1Char, setMapP1Char] = useState<CharacterId>('dark-ninja')
	const [mapP2Char, setMapP2Char] = useState<CharacterId>('samurai')
	const [showGroundGuides, setShowGroundGuides] = useState<boolean>(true)

	// Audio & Muffle tester state
	const [lastAudioReport, setLastAudioReport] = useState<VoicePlaybackReport | null>(() => audioManager.getLastReport())

	useEffect(() => {
		preloadAllCardFrames([2, 3, 4]).then(setCacheStats)
		audioManager.preloadAllVoiceClips()
		return audioManager.subscribe((report) => {
			setLastAudioReport(report)
		})
	}, [])

	const visibleFrames: FrameType[] = filterFrame === 'ALL' ? FRAME_LIST : [filterFrame]
	const maxFramesForSelectedAnim = Math.max(
		...CHARACTER_LIST.map((c) => c.animations[spriteAnimation]?.frameCount ?? c.frameCount),
	)

	return (
		<div className="mx-auto max-w-[1400px] space-y-10 px-6 py-8">
			{/* Page Header */}
			<FlatPanel variant="silver" wellVariant="dark" wellClassName="flex flex-wrap items-end justify-between gap-6 p-5">
				<div>
					<FlatBanner variant="offset-bl">Phase 1 Asset &amp; Visual Sign-Off Gallery (#/debug)</FlatBanner>
					<p className="mt-2 max-w-3xl text-sm text-slate-300">
						Inspect all 32 pre-rendered 9-slice card frames (4 rarities × 2 frames × 4 subject borders), compare the 4
						character sprites at integer scales, and test the 3 male voice packs and Dark Ninja&apos;s Web Audio muffle
						chain.
					</p>
				</div>
				<div className="flex items-center gap-4 text-xs text-slate-300 tabular-nums">
					<span>Cached Textures: {cacheStats.totalCached}</span>
					<span aria-hidden="true">·</span>
					<span>Cache Hits: {cacheStats.cacheHits}</span>
					<span aria-hidden="true">·</span>
					<span>
						Source: {cacheStats.sourceDimensions.width}×{cacheStats.sourceDimensions.height}px (Insets{' '}
						{cacheStats.sliceInsets.top}/{cacheStats.sliceInsets.right}/{cacheStats.sliceInsets.bottom}/
						{cacheStats.sliceInsets.left}px)
					</span>
				</div>
			</FlatPanel>

			{/* SECTION 1: 32 Card Frame Matrix */}
			<section className="space-y-6">
				<FlatPanel variant="silver" wellVariant="dark" wellClassName="space-y-6 p-5">
					<div className="flex flex-wrap items-center justify-between gap-4">
						<div>
							<FlatBanner variant="offset-bl">
								01. 9-Slice Card Frame Matrix (8 Rarity×Frame Looks × 4 Subject Borders = 32 Cards)
							</FlatBanner>
							<p className="mt-2 text-xs text-slate-300">
								Interior fill = Rarity (darker than borders) · Border tint = Subject · Frame A = Base · Frame B =
								Upgraded (+). Corners are 16×16px and never stretched.
							</p>
						</div>

						{/* Interactive Toolbar */}
						<div className="flex flex-wrap items-center gap-3">
							<div className="flex items-center gap-1">
								{(['ALL', 'A', 'B'] as const).map((mode) => (
									<FlatButton
										key={mode}
										variant={filterFrame === mode ? 'gold' : 'dark'}
										size="sm"
										onClick={() => setFilterFrame(mode)}
									>
										{mode === 'ALL' ? 'All 32 (A + B)' : `Frame ${mode} (16)`}
									</FlatButton>
								))}
							</div>

							<div className="flex items-center gap-1">
								{([2, 3, 4] as const).map((sc) => (
									<FlatButton
										key={sc}
										variant={cardScale === sc ? 'blue' : 'dark'}
										size="sm"
										onClick={() => {
											setCardScale(sc)
											setCacheStats(getFrameCacheStats())
										}}
									>
										{sc}x ({NINE_SLICE_CONFIG.logicalCardWidth * sc}×{NINE_SLICE_CONFIG.logicalCardHeight * sc}px)
									</FlatButton>
								))}
							</div>

							<FlatButton
								variant={showSliceGuides ? 'cream' : 'silver'}
								size="sm"
								onClick={() => setShowSliceGuides((v) => !v)}
							>
								{showSliceGuides ? 'Hide 9-Slice Guides' : 'Show 9-Slice Guides'}
							</FlatButton>
						</div>
					</div>

					{/* Source Frame Inspector & Custom Upload (4 goldui frames: C, D, E, and recolored F) */}
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						{SUBJECT_LIST.map((subj) => {
							const meta = SUBJECT_BORDER_PALETTE[subj]
							return (
								<FlatWell key={subj} variant="dark" className="flex items-center justify-between gap-4 p-3">
									<div className="flex items-center gap-4">
										<img
											src={meta.framePath}
											alt={`Source Frame ${meta.frameKey} (${meta.label})`}
											referrerPolicy="no-referrer"
											className="pixelated h-16 w-16 border border-slate-700 bg-slate-950 p-1"
										/>
										<div>
											<div className="font-pixel text-xs text-slate-100">
												20240707dragon9Slices{meta.frameKey}.png ({meta.label})
											</div>
											<div className="mt-1 text-xs text-slate-300">
												48×48px goldui source · Fill {meta.fill} · 16px unstretched corners
											</div>
										</div>
									</div>
									<label className="flat-btn-bevel cursor-pointer px-3 py-1.5 font-pixel text-[9px] text-[#141824] whitespace-nowrap">
										Swap {meta.frameKey} PNG
										<input
											type="file"
											accept="image/png"
											onChange={(e) => {
												const file = e.target.files?.[0]
												if (!file) return
												const reader = new FileReader()
												reader.onload = () => {
													if (typeof reader.result === 'string') {
														replaceFrameSourceAndRebuild(subj, reader.result, [2, 3, 4]).then(setCacheStats)
													}
												}
												reader.readAsDataURL(file)
											}}
											className="hidden"
										/>
									</label>
								</FlatWell>
							)
						})}
					</div>

					{/* Palette Legend */}
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						<FlatWell variant="dark" className="p-3">
							<div className="font-pixel text-[10px] text-amber-300">Rarity Badges</div>
							<div className="mt-2 flex flex-wrap gap-4">
								{RARITY_LIST.map((r) => (
									<div key={r} className="flex items-center gap-2 text-xs">
										<span
											style={{backgroundColor: RARITY_FILL_PALETTE[r].badgeText}}
											className="inline-block h-4 w-4 border border-white/20"
										/>
										<span className="text-slate-200">{RARITY_FILL_PALETTE[r].label}</span>
										<span className="font-mono text-slate-400">{RARITY_FILL_PALETTE[r].badgeText}</span>
									</div>
								))}
							</div>
						</FlatWell>
						<FlatWell variant="dark" className="p-3">
							<div className="font-pixel text-[10px] text-sky-300">
								Subject 9-Slice Frames (`goldui` C, D, E + Recolored F)
							</div>
							<div className="mt-2 flex flex-wrap gap-4">
								{SUBJECT_LIST.map((s) => (
									<div key={s} className="flex items-center gap-2 text-xs">
										<span
											style={{backgroundColor: SUBJECT_BORDER_PALETTE[s].fill}}
											className="inline-block h-4 w-4 border border-black/40"
										/>
										<span className="text-slate-200">
											{SUBJECT_BORDER_PALETTE[s].label} (Frame {SUBJECT_BORDER_PALETTE[s].frameKey})
										</span>
										<span className="font-mono text-slate-400">{SUBJECT_BORDER_PALETTE[s].fill}</span>
									</div>
								))}
							</div>
						</FlatWell>
					</div>

					{/* 8 Rarity x Frame Rows, each with 4 Subject Columns = 32 Cards */}
					<div className="space-y-6">
						{RARITY_LIST.map((rarity) =>
							visibleFrames.map((frame) => {
								const isUpgraded = frame === 'B'
								return (
									<FlatWell key={`${rarity}-${frame}`} variant="dark" className="space-y-3 p-4">
										<div className="flex items-center justify-between border-b border-slate-800 pb-2">
											<div className="flex items-center gap-2 font-pixel text-xs">
												<span style={{color: RARITY_FILL_PALETTE[rarity].badgeText}}>
													{RARITY_FILL_PALETTE[rarity].label} Rarity
												</span>
												<span aria-hidden="true" className="text-slate-600">
													·
												</span>
												<span className="text-slate-200">
													Frame {frame} ({isUpgraded ? 'Upgraded +' : 'Base'})
												</span>
											</div>
											<span className="font-mono text-xs text-slate-400">
												Interior Fill: {RARITY_FILL_PALETTE[rarity].fill}
											</span>
										</div>

										<div className="flex flex-wrap items-start justify-around gap-6 pt-2">
											{SUBJECT_LIST.map((subject) => {
												const sample = SAMPLE_CATALOG_CARDS[subject][rarity]
												return (
													<div key={`${rarity}-${frame}-${subject}`} className="flex flex-col items-center gap-2">
														<NineSliceCard
															id={sample.id}
															name={sample.name}
															subject={subject}
															rarity={rarity}
															cost={isUpgraded && sample.upgradedCost !== undefined ? sample.upgradedCost : sample.cost}
															text={isUpgraded ? sample.upgradedText : sample.baseText}
															upgraded={isUpgraded}
															exhaust={sample.exhaust}
															power={sample.power}
															integerScale={cardScale}
															showSliceGuides={showSliceGuides}
														/>
														<div className="text-center font-mono text-[11px] text-slate-300">
															{SUBJECT_BORDER_PALETTE[subject].label} ({SUBJECT_BORDER_PALETTE[subject].border})
														</div>
													</div>
												)
											})}
										</div>
									</FlatWell>
								)
							}),
						)}
					</div>
				</FlatPanel>
			</section>

			{/* SECTION 2: Character Sprites Comparison Stage */}
			<section className="space-y-6">
				<FlatPanel variant="blue" wellVariant="dark" wellClassName="space-y-6 p-5">
					<div className="flex flex-wrap items-center justify-between gap-4">
						<div>
							<FlatBanner variant="offset-bl">02. Character Sprites &amp; Scale / Facing Comparison Stage</FlatBanner>
							<p className="mt-2 text-xs text-slate-300">
								Compare all 4 character sprites side-by-side on the same ground baseline (`y = 55`): Dark Ninja, Reaper
								(`idle` scythe-out, `idle2` scythe-stowed, `turnStart` BattleStartanimation, `turnEnd` ReaperDefeated,
								and low-opacity death fade), Samurai, and Knight.
							</p>
						</div>

						<div className="flex flex-wrap items-center gap-2">
							<div className="flex flex-wrap items-center gap-1">
								{(['idle', 'idle2', 'turnStart', 'turnEnd', 'attack', 'hurt', 'death'] as const).map((anim) => (
									<FlatButton
										key={anim}
										variant={spriteAnimation === anim ? 'gold' : 'dark'}
										size="sm"
										onClick={() => {
											setSpriteAnimation(anim)
											setManualFrame(0)
										}}
									>
										{anim.toUpperCase()}
									</FlatButton>
								))}
							</div>

							<div className="flex items-center gap-1">
								{([2, 3, 4] as const).map((sc) => (
									<FlatButton
										key={sc}
										variant={spriteScale === sc ? 'cream' : 'dark'}
										size="sm"
										onClick={() => setSpriteScale(sc)}
									>
										{sc}x
									</FlatButton>
								))}
							</div>

							<div className="flex items-center gap-1">
								{(['duel', 'right', 'left'] as const).map((dir) => (
									<FlatButton
										key={dir}
										variant={spriteFacing === dir ? 'blue' : 'dark'}
										size="sm"
										onClick={() => setSpriteFacing(dir)}
									>
										{dir === 'duel' ? 'Duel Facing (2v2)' : `All Face ${dir}`}
									</FlatButton>
								))}
							</div>

							<FlatButton variant="silver" size="sm" onClick={() => setAnimateSprites((a) => !a)}>
								{animateSprites ? 'Pause Animation' : 'Play Animation'}
							</FlatButton>

							{!animateSprites && (
								<div className="flex flex-wrap items-center gap-1">
									{Array.from({length: maxFramesForSelectedAnim}, (_, fIdx) => fIdx).map((fIdx) => (
										<FlatButton
											key={fIdx}
											variant={manualFrame === fIdx ? 'gold' : 'dark'}
											size="sm"
											onClick={() => setManualFrame(fIdx)}
										>
											F{fIdx + 1}
										</FlatButton>
									))}
								</div>
							)}
						</div>
					</div>

					{/* Shared Arena Stage */}
					<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
						{CHARACTER_LIST.map((char, idx) => {
							const facing: 'left' | 'right' = spriteFacing === 'duel' ? (idx < 2 ? 'right' : 'left') : spriteFacing
							const animCfg = char.animations[spriteAnimation] ?? char.animations.idle
							return (
								<FlatWell key={char.id} variant="dark" className="flex flex-col items-center justify-between p-4">
									<div className="w-full text-center">
										<div className="font-pixel text-xs" style={{color: char.accentHex}}>
											{char.name}
										</div>
										<div className="mt-1 text-xs text-slate-300">
											{char.title} · {animCfg.frameWidth}×{animCfg.frameHeight}px ({animCfg.frameCount}f @ {animCfg.fps}
											fps)
										</div>
									</div>

									{/* Ground Line Stage */}
									<div className="my-6 flex min-h-[256px] w-full flex-col items-center justify-end overflow-hidden border-b-2 border-slate-700 pb-0">
										<PixelSprite
											characterId={char.id}
											animation={spriteAnimation}
											loopOverride={true}
											integerScale={spriteScale}
											facing={facing}
											animate={animateSprites}
											forcedFrame={animateSprites ? undefined : manualFrame}
											groundAlign
										/>
									</div>

									<div className="w-full space-y-1.5 text-xs">
										<div className="flex justify-between">
											<span className="text-slate-400">Affinity (×1.25 out / ×0.75 in):</span>
											<span style={{color: SUBJECT_BORDER_PALETTE[char.affinity].highlight}} className="font-semibold">
												{SUBJECT_BORDER_PALETTE[char.affinity].label}
											</span>
										</div>
										<div className="flex justify-between">
											<span className="text-slate-400">Weakness (×0.75 out / ×1.25 in):</span>
											<span style={{color: SUBJECT_BORDER_PALETTE[char.weakness].highlight}} className="font-semibold">
												{SUBJECT_BORDER_PALETTE[char.weakness].label}
											</span>
										</div>
										<div className="flex justify-between">
											<span className="text-slate-400">Voice Pack:</span>
											<span className="font-mono text-slate-200">
												{char.voicePack ? `${char.voicePack}${char.muffleVoice ? ' + muffle' : ''}` : 'none (SFX only)'}
											</span>
										</div>
									</div>
								</FlatWell>
							)
						})}
					</div>

					{/* Default Battle Map (moon.png) Ground Calibration Preview */}
					<FlatWell variant="dark" className="space-y-4 p-4">
						<div className="flex flex-wrap items-center justify-between gap-4">
							<div>
								<div className="font-pixel text-xs text-amber-300">
									Default Arena Map (`moon.png` · 3072×1664px) Ground Baseline Calibration
								</div>
								<p className="mt-1 text-xs text-slate-300">
									P1 spawns on the left lower cobblestone path (`x = 592px / 19.27%`, `groundY = 1336px / 80.29%`) and
									P2 spawns on the right elevated plateau (`x = 2208px / 71.88%`, `groundY = 1080px / 64.90%`). Sprite
									foot row `y = 55/64` (`87.5%` from top) locks directly to `groundY`.
								</p>
							</div>
							<div className="flex flex-wrap items-center gap-2 text-xs">
								<select
									value={mapP1Char}
									onChange={(e) => setMapP1Char(e.target.value as CharacterId)}
									className="flat-input px-2.5 py-1 font-pixel text-[10px]"
								>
									{CHARACTER_LIST.map((c) => (
										<option key={c.id} value={c.id}>
											P1: {c.name}
										</option>
									))}
								</select>
								<select
									value={mapP2Char}
									onChange={(e) => setMapP2Char(e.target.value as CharacterId)}
									className="flat-input px-2.5 py-1 font-pixel text-[10px]"
								>
									{CHARACTER_LIST.map((c) => (
										<option key={c.id} value={c.id}>
											P2: {c.name}
										</option>
									))}
								</select>
								<FlatButton
									variant={showGroundGuides ? 'gold' : 'silver'}
									size="sm"
									onClick={() => setShowGroundGuides((v) => !v)}
								>
									{showGroundGuides ? 'Hide Ground Guides' : 'Show Ground Guides'}
								</FlatButton>
							</div>
						</div>

						<BattleArenaStage
							p1Character={mapP1Char}
							p2Character={mapP2Char}
							p1Name={CHARACTER_LIST.find((c) => c.id === mapP1Char)?.name ?? 'P1'}
							p2Name={CHARACTER_LIST.find((c) => c.id === mapP2Char)?.name ?? 'P2'}
							p1Animation={spriteAnimation}
							p2Animation={spriteAnimation}
							p1Hp={80}
							p1MaxHp={80}
							p1Block={0}
							p2Hp={80}
							p2MaxHp={80}
							p2Block={0}
							activePlayerIndex={0}
							isPlaying={true}
							showGroundGuides={showGroundGuides}
						/>
					</FlatWell>
				</FlatPanel>
			</section>

			{/* SECTION 3: Audio Manager & Dark Ninja Web Audio Muffle Tester */}
			<section className="space-y-6">
				<FlatPanel variant="gold" wellVariant="dark" wellClassName="space-y-6 p-5">
					<div className="flex flex-wrap items-center justify-between gap-4">
						<div>
							<FlatBanner variant="offset-bl">
								03. Voice Pack Assignment &amp; Dark Ninja Web Audio Muffle Lab
							</FlatBanner>
							<p className="mt-2 text-xs text-slate-300">
								Test each character&apos;s 3 combat voice events (`attack`, `hurt`, `death`) from the 3 Male dialogue
								actors (Sean Lenhart, Alex Brodie, Ian Lampert; Reaper has no voice). Compare Dark Ninja&apos;s voice
								with and without the real-time Web Audio muffle chain ({DARK_NINJA_AUDIO_CONFIG.lowpassHz} Hz low-pass +{' '}
								{DARK_NINJA_AUDIO_CONFIG.playbackRate}x rate + distortion/reverb).
							</p>
						</div>

						{lastAudioReport && (
							<FlatWell variant="gold-dark" className="px-4 py-2 font-mono text-xs text-slate-200 tabular-nums">
								Last Played: <strong className="text-amber-300">{lastAudioReport.characterId}</strong> ·{' '}
								<span>{lastAudioReport.event}</span> · Pack:{' '}
								<span>{lastAudioReport.voicePack ?? 'none (SFX only)'}</span> · Chain:{' '}
								<span className={lastAudioReport.muffleApplied ? 'text-emerald-300' : 'text-sky-300'}>
									{lastAudioReport.muffleApplied
										? `MUFFLED (${lastAudioReport.lowpassHz}Hz LP @ ${lastAudioReport.playbackRate}x)`
										: 'DRY (1.0x)'}
								</span>
							</FlatWell>
						)}
					</div>

					{/* Dark Ninja A/B Comparison Box */}
					<FlatWell variant="gold-dark" className="p-4">
						<div className="flex flex-wrap items-center justify-between gap-4">
							<div>
								<div className="font-pixel text-xs text-amber-300">
									Dark Ninja A/B Muffle Audibility Test (`voice-dark`)
								</div>
								<p className="mt-1 text-xs text-slate-200">
									Click the buttons below to hear the exact same `voice-dark` WAV clip routed through the muffled Web
									Audio chain versus unmuffled dry playback.
								</p>
							</div>
							<div className="flex flex-wrap items-center gap-2.5">
								{VOICE_EVENT_LIST.map((ev) => (
									<div key={ev} className="flex items-center gap-1">
										<FlatButton
											variant="gold"
											size="sm"
											icon="play"
											onClick={() => audioManager.playCharacterVoice('dark-ninja', ev, {forceMuffle: true})}
										>
											{ev} (Muffled)
										</FlatButton>
										<FlatButton
											variant="silver"
											size="sm"
											onClick={() => audioManager.playCharacterVoice('dark-ninja', ev, {forceMuffle: false})}
										>
											Dry
										</FlatButton>
									</div>
								))}
							</div>
						</div>
					</FlatWell>

					{/* All 4 Characters x 5 Voice Events Grid */}
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						{CHARACTER_LIST.map((char) => {
							const voiceCfg = VOICE_MAP[char.id]
							return (
								<FlatWell key={char.id} variant="dark" className="p-4">
									<div className="flex items-center justify-between border-b border-slate-800 pb-3">
										<div>
											<span className="font-pixel text-xs" style={{color: char.accentHex}}>
												{char.name}
											</span>
											<span className="ml-2 font-mono text-xs text-slate-300">
												({voiceCfg.pack ? voiceCfg.pack : 'No Voice · SFX Only'})
											</span>
										</div>
										<span className="text-xs text-slate-300">
											{voiceCfg.muffle ? '1.2 kHz Low-Pass + 0.9x Rate' : 'Standard Playback'}
										</span>
									</div>

									<div className="mt-3 flex flex-wrap gap-2">
										{VOICE_EVENT_LIST.map((ev: VoiceEvent) => (
											<FlatButton
												key={ev}
												variant="cream"
												size="sm"
												icon="play"
												onClick={() => audioManager.playCharacterVoice(char.id as CharacterId, ev)}
											>
												Play &ldquo;{ev}&rdquo;
											</FlatButton>
										))}
									</div>
								</FlatWell>
							)
						})}
					</div>

					{/* Background Music & Real WAV SFX Soundboard */}
					<div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
						<FlatWell variant="blue-dark" className="space-y-3 p-4 lg:col-span-5">
							<div className="font-pixel text-xs text-sky-300">
								Background Music Tracks (`/public/assets/music/*.wav`)
							</div>
							<p className="text-xs text-slate-300">
								Looping background themes mixed from `assets/sounds/Musical Effects` (Music Box, Harpsichord, Grand
								Piano, Vibraphone, Synth Bass, 8-Bit) and `Environment/ambient_wind.wav`.
							</p>
							<div className="flex flex-wrap gap-2 pt-1">
								{(Object.keys(BGM_TRACK_MAP) as BgmTrackId[]).map((trackId) => (
									<FlatButton
										key={trackId}
										variant="blue"
										size="sm"
										icon="play"
										onClick={() => {
											audioManager.setMusicMuted(false)
											audioManager.playBgm(trackId)
										}}
									>
										{BGM_TRACK_MAP[trackId].label}
									</FlatButton>
								))}
								<FlatButton variant="silver" size="sm" icon="cross" onClick={() => audioManager.stopBgm()}>
									Stop BGM
								</FlatButton>
							</div>
						</FlatWell>

						<FlatWell variant="dark" className="space-y-3 p-4 lg:col-span-7">
							<div className="font-pixel text-xs text-amber-300">
								Real WAV Sound Effects Soundboard (`assets/uisfx` &amp; `assets/sounds`)
							</div>
							<p className="text-xs text-slate-300">
								Click any event below to audition the mapped WAV sound effects (`/public/assets/sfx/*.wav`).
							</p>
							<div className="flex flex-wrap gap-2 pt-1">
								{(Object.keys(SFX_FILE_MAP) as SfxEvent[]).map((sfxKey) => (
									<FlatButton
										key={sfxKey}
										variant="cream"
										size="sm"
										icon="play"
										onClick={() => audioManager.playSfx(sfxKey)}
									>
										{sfxKey} ({SFX_FILE_MAP[sfxKey].length})
									</FlatButton>
								))}
							</div>
						</FlatWell>
					</div>
				</FlatPanel>
			</section>
		</div>
	)
}
