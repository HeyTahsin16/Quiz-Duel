import {useMemo, useState} from 'react'
import {audioManager} from '../../audio/audioManager'
import {CATALOG_CARDS} from '../../content/cards'
import {buildCharacterDeck} from '../../content/decks'
import {QUESTION_BANK} from '../../content/questions'
import {
	CHARACTER_LIST,
	CHARACTERS,
	type CharacterId,
	RARITY_LIST,
	type Rarity,
	SUBJECT_BORDER_PALETTE,
	SUBJECT_LIST,
	type Subject,
} from '../../engine/config'
import {FlatBanner, FlatButton, FlatPanel, FlatWell} from '../components/FlatUi'
import {NineSliceCard} from '../components/NineSliceCard'
import {PixelSprite} from '../components/PixelSprite'

export interface CollectionScreenProps {
	onBackToMenu: () => void
	onSelectFighterForPlay: (id: CharacterId) => void
}

export function CollectionScreen({onBackToMenu, onSelectFighterForPlay}: CollectionScreenProps) {
	const [activeTab, setActiveTab] = useState<'cards' | 'decks' | 'questions'>('cards')
	const [subjectFilter, setSubjectFilter] = useState<Subject | 'all'>('all')
	const [rarityFilter, setRarityFilter] = useState<Rarity | 'all'>('all')
	const [showUpgraded, setShowUpgraded] = useState<boolean>(false)
	const [selectedCharacter, setSelectedCharacter] = useState<CharacterId>('dark-ninja')

	const filteredCards = useMemo(() => {
		return CATALOG_CARDS.filter((card) => {
			if (subjectFilter !== 'all' && card.subject !== subjectFilter) return false
			if (rarityFilter !== 'all' && card.rarity !== rarityFilter) return false
			return true
		})
	}, [rarityFilter, subjectFilter])

	const characterDeck = useMemo(() => {
		return buildCharacterDeck(selectedCharacter, 1337)
	}, [selectedCharacter])

	const filteredQuestions = useMemo(() => {
		return QUESTION_BANK.filter((q) => {
			if (subjectFilter !== 'all' && q.subject !== subjectFilter) return false
			if (rarityFilter !== 'all' && q.rarity !== rarityFilter) return false
			return true
		})
	}, [rarityFilter, subjectFilter])

	const activeCharMeta = CHARACTERS[selectedCharacter]

	return (
		<div className="mx-auto max-w-[1360px] space-y-6 px-6 py-6">
			{/* Top Mode Switcher Bar */}
			<FlatPanel
				variant="silver"
				wellVariant="dark"
				wellClassName="flex flex-wrap items-center justify-between gap-4 p-4"
			>
				<div className="flex flex-wrap items-center gap-2.5">
					<FlatButton
						variant={activeTab === 'cards' ? 'gold' : 'dark'}
						size="md"
						icon="point"
						onClick={() => {
							audioManager.playSfx('click')
							setActiveTab('cards')
						}}
					>
						80-Card Catalog ({CATALOG_CARDS.length})
					</FlatButton>
					<FlatButton
						variant={activeTab === 'decks' ? 'gold' : 'dark'}
						size="md"
						icon="play"
						onClick={() => {
							audioManager.playSfx('click')
							setActiveTab('decks')
						}}
					>
						Champion 24-Card Decks (4)
					</FlatButton>
					<FlatButton
						variant={activeTab === 'questions' ? 'gold' : 'dark'}
						size="md"
						icon="check"
						onClick={() => {
							audioManager.playSfx('click')
							setActiveTab('questions')
						}}
					>
						160 STEM Question Bank
					</FlatButton>
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
			</FlatPanel>

			{/* Filter Bar for Cards & Questions */}
			{(activeTab === 'cards' || activeTab === 'questions') && (
				<FlatPanel
					variant="blue"
					wellVariant="blue-dark"
					wellClassName="flex flex-wrap items-center justify-between gap-4 p-4"
				>
					<div className="flex flex-wrap items-center gap-2">
						<span className="font-pixel text-[10px] text-slate-300">SUBJECT:</span>
						<FlatButton
							variant={subjectFilter === 'all' ? 'cream' : 'dark'}
							size="sm"
							onClick={() => {
								audioManager.playSfx('click')
								setSubjectFilter('all')
							}}
						>
							All (4)
						</FlatButton>
						{SUBJECT_LIST.map((subj) => (
							<FlatButton
								key={subj}
								variant={subjectFilter === subj ? 'gold' : 'dark'}
								size="sm"
								onClick={() => {
									audioManager.playSfx('click')
									setSubjectFilter(subj)
								}}
							>
								{SUBJECT_BORDER_PALETTE[subj].label}
							</FlatButton>
						))}
					</div>

					<div className="flex flex-wrap items-center gap-2">
						<span className="font-pixel text-[10px] text-slate-300">RARITY:</span>
						<FlatButton
							variant={rarityFilter === 'all' ? 'cream' : 'dark'}
							size="sm"
							onClick={() => {
								audioManager.playSfx('click')
								setRarityFilter('all')
							}}
						>
							All
						</FlatButton>
						{RARITY_LIST.map((rar) => (
							<FlatButton
								key={rar}
								variant={rarityFilter === rar ? 'blue' : 'dark'}
								size="sm"
								onClick={() => {
									audioManager.playSfx('click')
									setRarityFilter(rar)
								}}
							>
								{rar.toUpperCase()}
							</FlatButton>
						))}
					</div>

					{activeTab === 'cards' && (
						<FlatButton
							variant={showUpgraded ? 'gold' : 'silver'}
							size="sm"
							icon={showUpgraded ? 'check' : 'plus'}
							onClick={() => {
								audioManager.playSfx('click')
								setShowUpgraded((prev) => !prev)
							}}
						>
							{showUpgraded ? 'Showing Upgraded (+)' : 'Show Upgraded (+)'}
						</FlatButton>
					)}
				</FlatPanel>
			)}

			{/* TAB 1: 80-Card Catalog Grid */}
			{activeTab === 'cards' && (
				<FlatPanel variant="silver" wellVariant="dark" wellClassName="p-6 space-y-5">
					<div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
						<FlatBanner variant="offset-bl">
							SHOWING {filteredCards.length} OF 80 CARDS ({showUpgraded ? 'FRAME B · UPGRADED +' : 'FRAME A · BASE'})
						</FlatBanner>
						<span className="text-xs text-slate-300">
							Normal &amp; Uncommon cards nullify on a correct quiz answer; Epic &amp; Legendary cards resolve their 35%
							reduced effect.
						</span>
					</div>

					<div className="flex flex-wrap items-start justify-center gap-5 py-2">
						{filteredCards.map((baseDef) => {
							const def = showUpgraded ? baseDef.upgrade(baseDef) : baseDef
							return (
								<div key={def.id} className="flex flex-col items-center gap-2">
									<NineSliceCard
										id={def.id}
										name={def.name}
										subject={def.subject}
										rarity={def.rarity}
										cost={def.cost}
										text={def.text}
										upgraded={showUpgraded}
										exhaust={def.exhaust}
										power={def.power}
										integerScale={2}
									/>
									{def.reducedText && (
										<div className="w-[192px] text-center font-mono text-[10px] text-amber-300/90">
											Quiz Defended: {def.reducedText}
										</div>
									)}
								</div>
							)
						})}
					</div>
				</FlatPanel>
			)}

			{/* TAB 2: Champion 24-Card Decks */}
			{activeTab === 'decks' && (
				<div className="space-y-6">
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
						{CHARACTER_LIST.map((char) => {
							const isSelected = char.id === selectedCharacter
							return (
								<FlatPanel
									key={char.id}
									variant={isSelected ? 'gold' : 'silver'}
									wellVariant={isSelected ? 'gold-dark' : 'dark'}
									wellClassName="p-4 flex flex-col justify-between gap-3"
								>
									<button
										type="button"
										onClick={() => {
											audioManager.playSfx('select')
											setSelectedCharacter(char.id)
										}}
										className="flex cursor-pointer items-center gap-3.5 text-left"
									>
										<PixelSprite characterId={char.id} integerScale={2} facing="right" />
										<div>
											<div className="font-pixel text-xs" style={{color: char.accentHex}}>
												{char.name}
											</div>
											<div className="mt-0.5 text-[11px] text-slate-300">{char.title}</div>
											<div className="mt-1 text-[11px] text-slate-400">
												Aff: {SUBJECT_BORDER_PALETTE[char.affinity].shortCode} · Weak:{' '}
												{SUBJECT_BORDER_PALETTE[char.weakness].shortCode}
											</div>
										</div>
									</button>
									<FlatButton
										variant={isSelected ? 'cream' : 'dark'}
										size="sm"
										icon="play"
										onClick={() => {
											audioManager.playSfx('click')
											onSelectFighterForPlay(char.id)
										}}
										className="w-full"
									>
										Play as {char.name}
									</FlatButton>
								</FlatPanel>
							)
						})}
					</div>

					<FlatPanel variant="gold" wellVariant="dark" wellClassName="p-6 space-y-5">
						<div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
							<div>
								<FlatBanner variant="offset-bl">
									{activeCharMeta.name.toUpperCase()} · FIXED 24-CARD STARTING DECK
								</FlatBanner>
								<p className="mt-2 text-xs text-slate-300">
									10 {SUBJECT_BORDER_PALETTE[activeCharMeta.affinity].label} (Affinity +25% Out / -25% In) · 2{' '}
									{SUBJECT_BORDER_PALETTE[activeCharMeta.weakness].label} (Weakness -25% Out / +25% In) · 6 + 6 Neutral
									| 10 Normal · 8 Uncommon · 4 Epic · 2 Legendary
								</p>
							</div>
							<FlatButton
								variant="cream"
								size="md"
								icon="play"
								onClick={() => {
									audioManager.playSfx('select')
									onSelectFighterForPlay(selectedCharacter)
								}}
							>
								Choose {activeCharMeta.name} for Battle
							</FlatButton>
						</div>

						<div className="flex flex-wrap items-center justify-center gap-4 py-2">
							{characterDeck.map((card) => (
								<NineSliceCard
									key={card.instanceId}
									id={card.id}
									name={card.name}
									subject={card.subject}
									rarity={card.rarity}
									cost={card.cost}
									text={card.text}
									upgraded={card.upgraded}
									exhaust={card.exhaust}
									power={card.power}
									integerScale={2}
								/>
							))}
						</div>
					</FlatPanel>
				</div>
			)}

			{/* TAB 3: 160 STEM Question Bank */}
			{activeTab === 'questions' && (
				<FlatPanel variant="silver" wellVariant="dark" wellClassName="p-6 space-y-4">
					<div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
						<FlatBanner variant="offset-bl">STEM QUESTION ARCHIVE ({filteredQuestions.length} OF 160)</FlatBanner>
						<span className="text-xs text-slate-300">
							During battle, answer choices are deterministically shuffled per match seed.
						</span>
					</div>

					<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
						{filteredQuestions.map((q) => (
							<FlatWell key={q.id} variant="dark" className="space-y-2 p-4">
								<div className="flex items-center justify-between text-xs">
									<span className="font-pixel text-[11px]" style={{color: SUBJECT_BORDER_PALETTE[q.subject].highlight}}>
										{q.id} · {SUBJECT_BORDER_PALETTE[q.subject].label.toUpperCase()} ({q.rarity.toUpperCase()})
									</span>
									<span className="font-mono text-xs text-slate-400 tabular-nums">{q.timerSeconds}s Timer</span>
								</div>
								<p className="text-sm font-semibold text-white">{q.prompt}</p>
								<div className="grid grid-cols-2 gap-1.5 pt-1 text-xs">
									{q.choices.map((choice, idx) => (
										<div
											key={choice}
											className={`px-2 py-1 font-mono ${
												idx === q.correctIndex ? 'text-emerald-300 font-bold' : 'text-slate-400'
											}`}
										>
											{String.fromCharCode(65 + idx)}. {choice}
										</div>
									))}
								</div>
							</FlatWell>
						))}
					</div>
				</FlatPanel>
			)}
		</div>
	)
}
