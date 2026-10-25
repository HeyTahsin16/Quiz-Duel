import {audioManager} from '../../audio/audioManager'
import {CHARACTERS, type CharacterId} from '../../engine/config'
import {FlatBanner, FlatButton, FlatPanel, FlatWell} from '../components/FlatUi'
import {PixelSprite} from '../components/PixelSprite'
import type {MatchSummary} from './BattleScreen'

export interface ResultScreenProps {
	winner: 0 | 1 | 2
	p1Character: CharacterId
	p2Character: CharacterId
	summary?: MatchSummary | null
	onRematch: () => void
	onReturnSelect: () => void
}

export function ResultScreen({
	winner,
	p1Character,
	p2Character,
	summary,
	onRematch,
	onReturnSelect,
}: ResultScreenProps) {
	const winChar = CHARACTERS[winner === 2 ? p2Character : p1Character]
	const loseChar = CHARACTERS[winner === 2 ? p1Character : p2Character]

	return (
		<div className="mx-auto max-w-[900px] space-y-8 px-6 py-12 text-center">
			<FlatPanel variant="gold" wellVariant="dark" wellClassName="space-y-6 p-8">
				<div className="flex justify-center">
					<FlatBanner variant="offset-bl">MATCH COMPLETE</FlatBanner>
				</div>
				<h1 className="font-pixel text-2xl text-white">
					{winner === 0 ? 'DRAW AT 500-ACTION CAP!' : `PLAYER ${winner} (${winChar.name.toUpperCase()}) WINS!`}
				</h1>

				{summary && (
					<div className="mx-auto grid max-w-xl grid-cols-2 gap-3 text-xs sm:grid-cols-4">
						<FlatWell variant="gold-dark" className="p-3">
							<div className="text-slate-300">Rounds</div>
							<div className="mt-1 font-pixel text-sm text-amber-300 tabular-nums">{summary.rounds}</div>
						</FlatWell>
						<FlatWell variant="dark" className="p-3">
							<div className="text-slate-300">P1 Final HP</div>
							<div className="mt-1 font-pixel text-sm text-emerald-300 tabular-nums">
								{summary.p1EndHp}/{summary.p1MaxHp}
							</div>
						</FlatWell>
						<FlatWell variant="blue-dark" className="p-3">
							<div className="text-slate-300">P2 Final HP</div>
							<div className="mt-1 font-pixel text-sm text-sky-300 tabular-nums">
								{summary.p2EndHp}/{summary.p2MaxHp}
							</div>
						</FlatWell>
						<FlatWell variant="dark" className="p-3">
							<div className="text-slate-300">Logged Actions</div>
							<div className="mt-1 font-pixel text-sm text-slate-200 tabular-nums">{summary.actionCount}</div>
						</FlatWell>
					</div>
				)}

				<div className="my-8 flex items-end justify-center gap-12">
					<FlatWell variant="gold-dark" className="flex flex-col items-center px-6 py-4">
						<PixelSprite
							characterId={winner === 1 ? p1Character : p2Character}
							animation="idle"
							integerScale={3}
							facing="right"
						/>
						<span className="mt-3 font-pixel text-xs text-emerald-300">Winner: {winChar.name}</span>
					</FlatWell>

					<FlatWell variant="dark" className="flex flex-col items-center px-6 py-4 opacity-85">
						<PixelSprite
							characterId={winner === 1 ? p2Character : p1Character}
							animation="death"
							integerScale={3}
							facing="left"
						/>
						<span className="mt-3 font-pixel text-xs text-slate-400">Defeated: {loseChar.name}</span>
					</FlatWell>
				</div>

				<div className="flex flex-wrap items-center justify-center gap-4 pt-4">
					<FlatButton
						variant="cream"
						size="lg"
						icon="play"
						onClick={() => {
							audioManager.playSfx('click')
							onRematch()
						}}
					>
						Play Again (Rematch)
					</FlatButton>
					<FlatButton
						variant="silver"
						size="lg"
						icon="arrow"
						onClick={() => {
							audioManager.playSfx('click')
							onReturnSelect()
						}}
					>
						Character Select
					</FlatButton>
				</div>
			</FlatPanel>
		</div>
	)
}
