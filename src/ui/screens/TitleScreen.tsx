import {audioManager} from '../../audio/audioManager'
import {CHARACTER_LIST, type CharacterId, SUBJECT_BORDER_PALETTE} from '../../engine/config'
import {FlatBanner, FlatButton, FlatPanel, FlatWell} from '../components/FlatUi'
import {PixelSprite} from '../components/PixelSprite'

export interface TitleScreenProps {
	onStartSelect: () => void
	onOpenCollection: () => void
	onOpenSettings: () => void
	onOpenCredits: () => void
	onSelectCharacter: (id: CharacterId) => void
}

export function TitleScreen({
	onStartSelect,
	onOpenCollection,
	onOpenSettings,
	onOpenCredits,
	onSelectCharacter,
}: TitleScreenProps) {
	return (
		<div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-[#0e1320] px-4 py-8">
			{/* Atmospheric Pixel-Art Moon Arena Backdrop */}
			<div
				style={{
					backgroundImage: 'url("/assets/maps/moon.png")',
					backgroundSize: 'cover',
					backgroundPosition: 'center 72%',
				}}
				className="pixelated pointer-events-none absolute inset-0 opacity-35"
			/>
			<div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#0b0f1a]/80 via-[#0e1320]/55 to-[#0b0f1a]/90" />

			{/* Main Game Stage Container */}
			<div className="relative z-10 mx-auto flex w-full max-w-[1180px] flex-col items-center gap-8">
				{/* Title Crest */}
				<FlatPanel
					variant="gold"
					wellVariant="gold-dark"
					className="w-full max-w-[680px]"
					wellClassName="flex flex-col items-center px-6 py-6 text-center"
				>
					<FlatBanner variant="offset-bl">1V1 TACTICAL STEM CARD BATTLER</FlatBanner>
					<h1 className="mt-3 font-pixel text-3xl tracking-wider text-amber-300 sm:text-5xl">QUIZ DUEL</h1>
					<p className="mt-2 max-w-md text-xs text-slate-200 sm:text-sm">
						Throw Maths, Physics, Chemistry &amp; Biology cards. Defend by solving live STEM challenges before the clock
						runs out.
					</p>
				</FlatPanel>

				{/* Center Menu Tower Flanked by Champion Showcase Pedestals */}
				<div className="grid w-full grid-cols-1 items-center gap-6 lg:grid-cols-12">
					{/* Left Champions Pedestal (Desktop) */}
					<div className="hidden flex-col gap-4 lg:col-span-4 lg:flex">
						{CHARACTER_LIST.slice(0, 2).map((char) => (
							<button
								key={char.id}
								type="button"
								onClick={() => {
									audioManager.playSfx('select')
									onSelectCharacter(char.id)
								}}
								className="flat-frame-silver cursor-pointer p-1 text-left transition-transform hover:-translate-y-0.5"
							>
								<div className="flat-slot-dark flex items-center gap-4 p-4">
									<PixelSprite characterId={char.id} integerScale={2} facing="right" animate />
									<div>
										<div className="font-pixel text-xs" style={{color: char.accentHex}}>
											{char.name}
										</div>
										<div className="mt-0.5 text-[11px] text-slate-300">{char.title}</div>
										<div className="mt-1 text-[11px] text-slate-400">
											Affinity: {SUBJECT_BORDER_PALETTE[char.affinity].label}
										</div>
									</div>
								</div>
							</button>
						))}
					</div>

					{/* Center Vertical Game Main Menu Stack: 1. Play -> 2. Collection -> 3. Settings -> 4. Credits */}
					<div className="lg:col-span-4">
						<FlatPanel variant="silver" wellVariant="dark" wellClassName="flex flex-col items-stretch gap-3.5 p-6">
							<div className="mb-1 text-center">
								<FlatBanner variant="offset-bl">MAIN MENU</FlatBanner>
							</div>

							<FlatButton
								variant="cream"
								size="lg"
								icon="play"
								onClick={() => {
									audioManager.playSfx('select')
									onStartSelect()
								}}
								className="w-full justify-center py-3 text-sm"
							>
								PLAY
							</FlatButton>

							<FlatButton
								variant="gold"
								size="lg"
								icon="point"
								onClick={() => {
									audioManager.playSfx('click')
									onOpenCollection()
								}}
								className="w-full justify-center py-3 text-sm"
							>
								COLLECTION
							</FlatButton>

							<FlatButton
								variant="blue"
								size="lg"
								icon="stripe"
								onClick={() => {
									audioManager.playSfx('click')
									onOpenSettings()
								}}
								className="w-full justify-center py-3 text-sm"
							>
								SETTINGS
							</FlatButton>

							<FlatButton
								variant="silver"
								size="lg"
								icon="arrow"
								onClick={() => {
									audioManager.playSfx('click')
									onOpenCredits()
								}}
								className="w-full justify-center py-3 text-sm"
							>
								CREDITS
							</FlatButton>
						</FlatPanel>
					</div>

					{/* Right Champions Pedestal (Desktop) */}
					<div className="hidden flex-col gap-4 lg:col-span-4 lg:flex">
						{CHARACTER_LIST.slice(2, 4).map((char) => (
							<button
								key={char.id}
								type="button"
								onClick={() => {
									audioManager.playSfx('select')
									onSelectCharacter(char.id)
								}}
								className="flat-frame-silver cursor-pointer p-1 text-left transition-transform hover:-translate-y-0.5"
							>
								<div className="flat-slot-dark flex items-center justify-between gap-4 p-4">
									<div>
										<div className="font-pixel text-xs" style={{color: char.accentHex}}>
											{char.name}
										</div>
										<div className="mt-0.5 text-[11px] text-slate-300">{char.title}</div>
										<div className="mt-1 text-[11px] text-slate-400">
											Affinity: {SUBJECT_BORDER_PALETTE[char.affinity].label}
										</div>
									</div>
									<PixelSprite characterId={char.id} integerScale={2} facing="left" animate />
								</div>
							</button>
						))}
					</div>
				</div>

				{/* Compact Rules Status Strip at Bottom of Title Screen */}
				<FlatWell
					variant="dark"
					className="flex flex-wrap items-center justify-center gap-6 px-6 py-3 text-center text-xs text-slate-300"
				>
					<span>80 HP · 5 Mana Pool</span>
					<span aria-hidden="true">·</span>
					<span>4 Champions · 24-Card Decks</span>
					<span aria-hidden="true">·</span>
					<span>80 STEM Cards · 160 Quiz Challenges</span>
					<span aria-hidden="true">·</span>
					<span>1P vs Bot · 2P Local · Online 1v1</span>
				</FlatWell>
			</div>
		</div>
	)
}
