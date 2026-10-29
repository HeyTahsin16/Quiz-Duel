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
	onBackToMenu?: () => void
}

export interface AttributeEntry {
	badge: string
	name: string
	category: 'mechanic' | 'permanent' | 'buff' | 'debuff'
	summary: string
}

const ATTRIBUTE_ENTRIES: AttributeEntry[] = [
	// Core Card Mechanics & Keywords
	{
		badge: 'BLOCK',
		name: 'Block',
		category: 'mechanic',
		summary:
			'Absorbs incoming attack damage before HP is lost. Resets to 0 at the start of your next turn unless preserved by Barricade or Blur.',
	},
	{
		badge: 'DRAW',
		name: 'Draw',
		category: 'mechanic',
		summary:
			'Draws cards from your Draw Pile into your Hand (max 10 cards in hand). When the Draw Pile is empty, your Discard Pile automatically shuffles into a new Draw Pile.',
	},
	{
		badge: 'EXHAUST',
		name: 'Exhaust',
		category: 'mechanic',
		summary:
			'When resolved, the card is moved to the Exhaust Pile for the rest of the battle instead of going to the Discard Pile.',
	},
	{
		badge: 'POWER (P)',
		name: 'Power Card',
		category: 'mechanic',
		summary:
			'Grants a persistent passive ability for the remainder of the duel. Power cards only take effect after being played and automatically Exhaust.',
	},
	{
		badge: 'UPGRADE (+)',
		name: 'Upgraded Card (+)',
		category: 'mechanic',
		summary:
			'Enhanced Frame B version of a card. Every 4 correct STEM quiz answers upgrades a random card in your deck (+damage, +block, +stacks, or reduced Mana cost).',
	},
	{
		badge: 'MANA',
		name: 'Mana',
		category: 'mechanic',
		summary:
			'Action points used to throw cards (refills to 3 Mana at the start of each turn). Cards cost 0–3 Mana to throw.',
	},
	{
		badge: 'STEAL',
		name: 'Life Steal',
		category: 'mechanic',
		summary:
			'Heals your fighter based on unblocked damage dealt to the opponent. Negated while afflicted by Hemostasis (NO-STEAL).',
	},
	{
		badge: 'TRUE DMG',
		name: 'True Damage / HP Loss',
		category: 'mechanic',
		summary: 'Bypasses the target’s Block completely and subtracts directly from HP.',
	},
	{
		badge: 'CURE',
		name: 'Cure',
		category: 'mechanic',
		summary:
			'Biology cleansing mechanic that removes active debuffs (Poison, Parasite, Weak, Vulnerable, Corrode, Anti-heal, Hemostasis, and Strength loss).',
	},
	{
		badge: 'BURST',
		name: 'Poison Burst',
		category: 'mechanic',
		summary: 'Deals immediate damage equal to the opponent’s current Poison stacks.',
	},
	{
		badge: 'AFFINITY',
		name: 'Subject Affinity & Weakness',
		category: 'mechanic',
		summary:
			'Cards matching your champion’s Affinity gain +25% outgoing effect and reduce incoming damage of that subject by 25%. Weakness cards deal -25% outgoing and take +25% incoming.',
	},
	{
		badge: 'DEFENSE',
		name: 'Quiz Defense (Nullify / 35%)',
		category: 'mechanic',
		summary:
			'Answering a thrown card’s STEM quiz correctly within the timer completely nullifies Normal & Uncommon cards, or reduces Epic & Legendary cards to 35% power.',
	},

	// Permanent Powers
	{
		badge: 'STR',
		name: 'Strength',
		category: 'permanent',
		summary:
			'Adds +N damage to every attack hit you deal for the rest of the battle. Can become negative if reduced by debuffs.',
	},
	{
		badge: 'DEMON',
		name: 'Demon Form (P)',
		category: 'permanent',
		summary: 'Gain +N Strength automatically at the start of each of your turns.',
	},
	{
		badge: 'METAL',
		name: 'Metallicize (P)',
		category: 'permanent',
		summary: 'Gain N Block automatically at the end of each of your turns.',
	},
	{
		badge: 'BARRICADE',
		name: 'Barricade (P)',
		category: 'permanent',
		summary: 'Your Block is never removed at the start of your turn for the rest of the battle.',
	},
	{
		badge: 'JUGG',
		name: 'Juggernaut (P)',
		category: 'permanent',
		summary: 'Whenever you gain Block, automatically deal N damage to the opponent.',
	},
	{
		badge: 'FUMES',
		name: 'Noxious Fumes (P)',
		category: 'permanent',
		summary: 'Apply N Poison to the opponent automatically at the start of each of your turns.',
	},
	{
		badge: 'ENVENOM',
		name: 'Envenom (P)',
		category: 'permanent',
		summary: 'Whenever your attack deals unblocked damage, apply N Poison to the opponent.',
	},
	{
		badge: 'REPAIR',
		name: 'Self-Repair (P)',
		category: 'permanent',
		summary: 'Heal N HP automatically at the end of each of your turns.',
	},
	{
		badge: 'PHOENIX',
		name: 'Phoenix (P)',
		category: 'permanent',
		summary: 'Once this battle, if your HP would reach 0, immediately revive at 30% (or 45%+) of your Max HP.',
	},

	// Buffs
	{
		badge: 'FLEX',
		name: 'Temporary Strength',
		category: 'buff',
		summary: 'Gain +N Strength for the current turn only; removed at the end of the turn.',
	},
	{
		badge: 'BLUR',
		name: 'Blur (1-Turn Barricade)',
		category: 'buff',
		summary: 'Your Block is not removed at the start of your next turn.',
	},
	{
		badge: 'COAT',
		name: 'Venomous Coat',
		category: 'buff',
		summary: 'Your next unblocked attack hit applies +N Poison to the opponent.',
	},
	{
		badge: 'WARD',
		name: 'Ward',
		category: 'buff',
		summary: 'Negates and blocks the next N debuff applications targeting you.',
	},
	{
		badge: 'REFLECT',
		name: 'Reflect (Mirror Calculus)',
		category: 'buff',
		summary: 'Until your next turn, reflects P% of attack damage taken back at the attacker.',
	},
	{
		badge: 'APPARITION',
		name: 'Apparition',
		category: 'buff',
		summary: 'Until the start of your next turn, any single hit or HP loss you take is reduced to at most 1 HP.',
	},
	{
		badge: '2X TAP',
		name: 'Double Tap',
		category: 'buff',
		summary: 'Your next Maths attack card played this turn resolves twice.',
	},
	{
		badge: 'REGEN',
		name: 'Regeneration',
		category: 'buff',
		summary: 'Heal N HP at the start of each of your turns for R rounds.',
	},
	{
		badge: 'HIBERNATE',
		name: 'Hibernate (Next Turn Heal)',
		category: 'buff',
		summary: 'Heal N HP at the start of your next turn.',
	},
	{
		badge: 'CHARGE',
		name: 'Next Turn Mana',
		category: 'buff',
		summary: 'Gain +N bonus Mana at the start of your next turn.',
	},
	{
		badge: 'STUN-IMM',
		name: 'Stun Immune',
		category: 'buff',
		summary: 'Cannot be Stunned for N rounds (automatically granted for 2 rounds after recovering from Stun).',
	},

	// Debuffs
	{
		badge: 'POISON',
		name: 'Poison',
		category: 'debuff',
		summary: 'Lose N HP (ignores Block) at the start of your turn, then Poison decreases by 1.',
	},
	{
		badge: 'PARASITE',
		name: 'Parasite',
		category: 'debuff',
		summary:
			'Lose N HP (ignores Block) at the start of your turn, then Parasite increases by 1 each turn! Only a Biology Cure removes it.',
	},
	{
		badge: 'WEAK',
		name: 'Weak',
		category: 'debuff',
		summary: 'Deal 25% less attack damage for N rounds.',
	},
	{
		badge: 'VULN',
		name: 'Vulnerable',
		category: 'debuff',
		summary: 'Take 50% more attack damage for N rounds.',
	},
	{
		badge: 'CORRODE',
		name: 'Corrode',
		category: 'debuff',
		summary: 'Gain 25% less Block from cards for N rounds.',
	},
	{
		badge: 'ANTI-HEAL',
		name: 'Anti-Heal',
		category: 'debuff',
		summary: 'All healing received is reduced by 50% for N rounds.',
	},
	{
		badge: 'NO-STEAL',
		name: 'Hemostasis (No Life Steal)',
		category: 'debuff',
		summary: 'Life Steal effects heal 0 HP for N rounds.',
	},
	{
		badge: 'STUNNED',
		name: 'Stun',
		category: 'debuff',
		summary: 'Your next turn is skipped, then you gain Stun Immune for 2 rounds.',
	},
]

export function CollectionScreen({onBackToMenu}: CollectionScreenProps) {
	const [activeTab, setActiveTab] = useState<'cards' | 'decks' | 'questions' | 'attributes'>('cards')
	const [attributeFilter, setAttributeFilter] = useState<'all' | AttributeEntry['category']>('all')
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

	const filteredAttributes = useMemo(() => {
		if (attributeFilter === 'all') return ATTRIBUTE_ENTRIES
		return ATTRIBUTE_ENTRIES.filter((entry) => entry.category === attributeFilter)
	}, [attributeFilter])

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
					{onBackToMenu && (
						<FlatButton variant="cream" size="md" icon="arrow" onClick={onBackToMenu}>
							Main Menu
						</FlatButton>
					)}
					<FlatButton
						variant={activeTab === 'cards' ? 'gold' : 'dark'}
						size="md"
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
						onClick={() => {
							audioManager.playSfx('click')
							setActiveTab('questions')
						}}
					>
						160 STEM Question Bank
					</FlatButton>
					<FlatButton
						variant={activeTab === 'attributes' ? 'gold' : 'dark'}
						size="md"
						onClick={() => {
							audioManager.playSfx('click')
							setActiveTab('attributes')
						}}
					>
						Attributes ({ATTRIBUTE_ENTRIES.length})
					</FlatButton>
				</div>
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
										scaleMultiplier={1.2}
									/>
									{def.reducedText && (
										<div className="w-[154px] text-center font-mono text-[10px] text-amber-300/90">
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
									wellClassName="p-4 flex flex-col justify-center"
								>
									<button
										type="button"
										onClick={() => {
											audioManager.playSfx('select')
											setSelectedCharacter(char.id)
										}}
										className="flex w-full cursor-pointer items-center gap-3.5 text-left"
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
									scaleMultiplier={1.2}
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

			{/* TAB 4: Attributes (Card Mechanics, Permanent Powers, Buffs, & Debuffs) */}
			{activeTab === 'attributes' && (
				<div className="space-y-5">
					<FlatPanel
						variant="blue"
						wellVariant="blue-dark"
						wellClassName="flex flex-wrap items-center justify-between gap-3 p-4"
					>
						<div className="flex flex-wrap items-center gap-2">
							<span className="font-pixel text-[10px] text-slate-300">CATEGORY:</span>
							<FlatButton
								variant={attributeFilter === 'all' ? 'cream' : 'dark'}
								size="sm"
								onClick={() => {
									audioManager.playSfx('click')
									setAttributeFilter('all')
								}}
							>
								All ({ATTRIBUTE_ENTRIES.length})
							</FlatButton>
							<FlatButton
								variant={attributeFilter === 'mechanic' ? 'gold' : 'dark'}
								size="sm"
								onClick={() => {
									audioManager.playSfx('click')
									setAttributeFilter('mechanic')
								}}
							>
								Card Mechanics (12)
							</FlatButton>
							<FlatButton
								variant={attributeFilter === 'permanent' ? 'gold' : 'dark'}
								size="sm"
								onClick={() => {
									audioManager.playSfx('click')
									setAttributeFilter('permanent')
								}}
							>
								Permanent Powers (9)
							</FlatButton>
							<FlatButton
								variant={attributeFilter === 'buff' ? 'blue' : 'dark'}
								size="sm"
								onClick={() => {
									audioManager.playSfx('click')
									setAttributeFilter('buff')
								}}
							>
								Buffs (11)
							</FlatButton>
							<FlatButton
								variant={attributeFilter === 'debuff' ? 'silver' : 'dark'}
								size="sm"
								onClick={() => {
									audioManager.playSfx('click')
									setAttributeFilter('debuff')
								}}
							>
								Debuffs (8)
							</FlatButton>
						</div>
					</FlatPanel>

					<FlatPanel variant="silver" wellVariant="dark" wellClassName="p-6 space-y-4">
						<div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
							<FlatBanner variant="offset-bl">
								ATTRIBUTES &amp; STATUS EFFECTS ({filteredAttributes.length} OF {ATTRIBUTE_ENTRIES.length})
							</FlatBanner>
							<span className="text-xs text-slate-300">
								Complete reference of card keywords, permanent powers, turn buffs, and round-decaying debuffs.
							</span>
						</div>

						<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
							{filteredAttributes.map((attr) => {
								const badgeClass =
									attr.category === 'debuff'
										? 'flat-slot-orange text-white'
										: attr.category === 'permanent'
											? 'flat-slot-gold text-[#141824]'
											: attr.category === 'buff'
												? 'flat-slot-blue text-white'
												: 'flat-slot-dark border border-amber-400/50 text-amber-300'

								const categoryLabel =
									attr.category === 'mechanic'
										? 'CARD MECHANIC'
										: attr.category === 'permanent'
											? 'PERMANENT POWER (P)'
											: attr.category === 'buff'
												? 'BUFF'
												: 'DEBUFF'

								return (
									<FlatWell key={`${attr.category}-${attr.badge}`} variant="dark" className="space-y-2 p-4">
										<div className="flex flex-wrap items-center justify-between gap-2">
											<div className="flex items-center gap-2.5">
												<span className={`inline-flex items-center px-2 py-0.5 font-pixel text-[10px] ${badgeClass}`}>
													{attr.badge}
												</span>
												<span className="font-pixel text-xs text-white">{attr.name}</span>
											</div>
											<span className="font-mono text-[10px] tracking-wider text-slate-400">{categoryLabel}</span>
										</div>
										<p className="text-xs leading-relaxed text-slate-200">{attr.summary}</p>
									</FlatWell>
								)
							})}
						</div>
					</FlatPanel>
				</div>
			)}
		</div>
	)
}
