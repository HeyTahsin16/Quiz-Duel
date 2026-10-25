import {audioManager} from '../../audio/audioManager'
import {CHARACTER_LIST, VOICE_MAP} from '../../engine/config'
import {FlatBanner, FlatButton, FlatPanel, FlatWell} from '../components/FlatUi'
import {PixelSprite} from '../components/PixelSprite'

export interface CreditsScreenProps {
	onBackToMenu: () => void
	onOpenDebugGallery: () => void
}

export function CreditsScreen({onBackToMenu, onOpenDebugGallery}: CreditsScreenProps) {
	return (
		<div className="mx-auto max-w-[980px] space-y-6 px-6 py-8">
			<FlatPanel variant="gold" wellVariant="dark" wellClassName="p-6 md:p-8 space-y-6">
				<div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
					<div>
						<FlatBanner variant="offset-bl">CREDITS &amp; ATTRIBUTIONS</FlatBanner>
						<h1 className="mt-3 font-pixel text-xl text-white">Quiz Duel — 1v1 Tactical STEM Card Battler</h1>
					</div>

					<FlatButton
						variant="cream"
						size="sm"
						icon="arrow"
						onClick={() => {
							audioManager.playSfx('cancel')
							onBackToMenu()
						}}
					>
						Back to Main Menu
					</FlatButton>
				</div>

				{/* Voice Cast Showcase */}
				<div className="space-y-3">
					<FlatBanner variant="offset-bl" className="px-2 py-0.5 text-[10px]">
						CHARACTER VOICE CAST
					</FlatBanner>
					<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
						{CHARACTER_LIST.map((char) => {
							const voice = VOICE_MAP[char.id]
							return (
								<FlatWell key={char.id} variant="dark" className="flex flex-col items-center p-4 text-center">
									<PixelSprite characterId={char.id} integerScale={2} facing="right" />
									<div className="mt-2 font-pixel text-xs" style={{color: char.accentHex}}>
										{char.name}
									</div>
									<div className="mt-1 text-xs text-slate-200">{voice.actor ?? 'Silent Wraith (SFX Only)'}</div>
									<div className="mt-0.5 font-mono text-[10px] text-slate-400">
										{voice.pack ? `${voice.pack}${voice.muffle ? ' · 1.2kHz Muffle' : ''}` : 'No Voice Pack'}
									</div>
									<FlatButton
										variant="dark"
										size="sm"
										icon="play"
										onClick={() => audioManager.playCharacterVoice(char.id, 'attack')}
										className="mt-3 w-full"
									>
										Sample Voice
									</FlatButton>
								</FlatWell>
							)
						})}
					</div>
				</div>

				{/* Core Engine, Card Design & Asset Credits */}
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					<FlatWell variant="blue-dark" className="space-y-2 p-4">
						<div className="font-pixel text-xs text-sky-300">ENGINE &amp; CARD DESIGN</div>
						<p className="text-xs leading-relaxed text-slate-200">
							State &amp; action queue architecture ported and extended in TypeScript from{' '}
							<span className="font-mono text-amber-300">oskarrough/slaytheweb</span> (AGPL-3.0-or-later).
						</p>
						<p className="text-xs leading-relaxed text-slate-300">
							Card mechanics inspired by <em>Slay the Spire</em> by MegaCrit (CC BY-SA 4.0 reference wiki).
						</p>
					</FlatWell>

					<FlatWell variant="gold-dark" className="space-y-2 p-4">
						<div className="font-pixel text-xs text-amber-300">PIXEL ART, UI &amp; AUDIO</div>
						<p className="text-xs leading-relaxed text-slate-200">
							9-Slice Dragon Card Frames (C, D, E, F), FlatUI Pixel Interface Sprites, Moonlit Graveyard Arena Map, and
							4 Animated Champion Sprite Sheets.
						</p>
						<p className="text-xs leading-relaxed text-slate-300">
							Looping Tavern &amp; Duel WAV Soundtracks, UI Sound Effects, and Combat Clash Audio.
						</p>
					</FlatWell>
				</div>

				{/* Debug Gallery Under Credits */}
				<FlatWell variant="dark" className="flex flex-wrap items-center justify-between gap-4 p-5">
					<div className="space-y-1">
						<FlatBanner variant="offset-bl" className="px-2 py-0.5 text-[10px]">
							DEVELOPER TOOLS &amp; ASSET INSPECTOR
						</FlatBanner>
						<p className="pt-1 text-xs text-slate-300">
							Inspect all 32 9-slice card frame combinations, character animation timelines, ground-anchor calibration,
							and Web Audio muffle diagnostics.
						</p>
					</div>

					<FlatButton
						variant="gold"
						size="lg"
						icon="point"
						onClick={() => {
							audioManager.playSfx('select')
							onOpenDebugGallery()
						}}
					>
						Open Debug Gallery (#/debug)
					</FlatButton>
				</FlatWell>
			</FlatPanel>
		</div>
	)
}
