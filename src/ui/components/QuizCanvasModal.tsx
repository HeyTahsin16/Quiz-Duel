import {useCallback, useEffect, useRef, useState} from 'react'
import {audioManager} from '../../audio/audioManager'
import {type QuizQuestion, resolveCardQuestion} from '../../content/questions'
import type {QuizAnswerOutcome, ThrownCardEntry} from '../../engine/actions'
import type {CardInstance} from '../../engine/cards'
import {
	CHARACTERS,
	type CharacterId,
	ENGINE_CONFIG,
	RARITY_FILL_PALETTE,
	SUBJECT_BORDER_PALETTE,
} from '../../engine/config'
import {FlatBanner, FlatBar, FlatButton, FlatPanel, FlatWell} from './FlatUi'
import {NineSliceCard} from './NineSliceCard'
import {PixelSprite} from './PixelSprite'

export interface QuizCanvasModalProps {
	entry: ThrownCardEntry
	queuePosition: number
	queueTotal: number
	attackerCharacter: CharacterId
	defenderCharacter: CharacterId
	formattedCardText: string
	seed?: number
	isBotDefender?: boolean
	onResolve: (outcome: QuizAnswerOutcome) => void
}

export interface QuestionPeekModalProps {
	card: CardInstance
	seed?: number
	onClose: () => void
}

/**
 * Draws text onto a 2D canvas with anti-OCR / anti-copy friction:
 * - Background diagonal watermark
 * - Word-wrapped text with per-word vertical jitter (±1.5px)
 * - Horizontal scanlines
 * No question or choice strings ever appear in the DOM or ARIA attributes.
 */
function drawProtectedCanvasText(
	canvas: HTMLCanvasElement | null,
	text: string,
	options: {
		width: number
		height: number
		fontSize?: number
		textColor?: string
		bgColor?: string
		borderColor?: string
		watermark?: string
		prefixBadge?: string
		prefixColor?: string
		seedOffset?: number
	},
) {
	if (!canvas) return
	const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1
	canvas.width = options.width * dpr
	canvas.height = options.height * dpr
	canvas.style.width = `${options.width}px`
	canvas.style.height = `${options.height}px`

	const ctx = canvas.getContext('2d')
	if (!ctx) return

	ctx.save()
	ctx.scale(dpr, dpr)

	const {
		width,
		height,
		fontSize = 15,
		textColor = '#f8fafc',
		bgColor = '#0b0f1a',
		borderColor = '#1e293b',
		watermark = 'QUIZ DUEL · STEM SHIELD',
		prefixBadge,
		prefixColor = '#fbbf24',
		seedOffset = 17,
	} = options

	// 1. Background fill
	ctx.fillStyle = bgColor
	ctx.fillRect(0, 0, width, height)

	// 2. Subtle diagonal watermark pattern
	ctx.save()
	ctx.font = '700 10px "Plus Jakarta Sans", "Inter", ui-sans-serif, system-ui, sans-serif'
	ctx.fillStyle = 'rgba(148, 163, 184, 0.06)'
	ctx.translate(width / 2, height / 2)
	ctx.rotate(-0.18)
	for (let y = -height; y < height; y += 26) {
		for (let x = -width; x < width; x += 180) {
			ctx.fillText(watermark, x, y)
		}
	}
	ctx.restore()

	// 3. Word-wrap and draw each word with subtle deterministic jitter
	ctx.font = `600 ${fontSize}px "Plus Jakarta Sans", "Inter", ui-sans-serif, system-ui, -apple-system, sans-serif`
	ctx.textBaseline = 'middle'

	const padX = prefixBadge ? 44 : 16
	const maxLineWidth = width - padX - 16
	const words = text.split(/\s+/)
	const lines: string[][] = []
	let currentLine: string[] = []
	let currentWidth = 0

	for (const word of words) {
		const wordW = ctx.measureText(`${word} `).width
		if (currentLine.length > 0 && currentWidth + wordW > maxLineWidth) {
			lines.push(currentLine)
			currentLine = [word]
			currentWidth = wordW
		} else {
			currentLine.push(word)
			currentWidth += wordW
		}
	}
	if (currentLine.length > 0) {
		lines.push(currentLine)
	}

	// Optional choice badge [A], [B], [C], [D]
	if (prefixBadge) {
		ctx.fillStyle = 'rgba(251, 191, 36, 0.12)'
		ctx.fillRect(10, height / 2 - 13, 24, 26)
		ctx.strokeStyle = prefixColor
		ctx.lineWidth = 1.5
		ctx.strokeRect(10, height / 2 - 13, 24, 26)
		ctx.font = '700 12px "Plus Jakarta Sans", "Inter", ui-sans-serif, system-ui, sans-serif'
		ctx.fillStyle = prefixColor
		ctx.textAlign = 'center'
		ctx.fillText(prefixBadge, 22, height / 2 + 1)
		ctx.textAlign = 'left'
	}

	ctx.font = `600 ${fontSize}px "Plus Jakarta Sans", "Inter", ui-sans-serif, system-ui, -apple-system, sans-serif`
	ctx.fillStyle = textColor

	const lineHeight = Math.round(fontSize * 1.45)
	const totalTextHeight = lines.length * lineHeight
	const startY = Math.max(lineHeight / 2 + 6, (height - totalTextHeight) / 2 + lineHeight / 2)

	let wordIndex = 0
	lines.forEach((lineWords, lineIdx) => {
		let cursorX = padX
		const baseLineY = startY + lineIdx * lineHeight
		for (const word of lineWords) {
			wordIndex++
			const hash = Math.sin((wordIndex + seedOffset) * 12.9898) * 43758.5453
			const frac = hash - Math.floor(hash)
			const jitterY = (frac - 0.5) * 2.4
			const jitterX = ((frac * 7) % 1) * 0.8

			ctx.fillText(word, cursorX + jitterX, baseLineY + jitterY)
			cursorX += ctx.measureText(`${word} `).width
		}
	})

	// 4. Subtle horizontal scanlines + noise dots
	ctx.fillStyle = 'rgba(15, 23, 42, 0.24)'
	for (let y = 0; y < height; y += 3) {
		ctx.fillRect(0, y, width, 1)
	}

	// 5. Outer border
	ctx.strokeStyle = borderColor
	ctx.lineWidth = 2
	ctx.strokeRect(1, 1, width - 2, height - 2)

	ctx.restore()
}

export function QuizCanvasModal({
	entry,
	queuePosition,
	queueTotal,
	attackerCharacter,
	defenderCharacter,
	formattedCardText,
	seed,
	isBotDefender = false,
	onResolve,
}: QuizCanvasModalProps) {
	const {card} = entry
	const question: QuizQuestion = resolveCardQuestion(card, seed, entry.questionId) || {
		id: 'Q-FALLBACK',
		subject: card.subject,
		rarity: card.rarity,
		timerSeconds: ENGINE_CONFIG.quizTimersSeconds[card.rarity],
		prompt: 'Solve for x: 3x + 7 = 22',
		choices: ['3', '5', '7', '9'],
		correctIndex: 1,
		explanation: '3(5) + 7 = 15 + 7 = 22.',
	}

	const totalMs = question.timerSeconds * 1000
	const [remainingMs, setRemainingMs] = useState<number>(totalMs)
	const [selectedChoice, setSelectedChoice] = useState<number | null>(null)
	const [resolvedOutcome, setResolvedOutcome] = useState<QuizAnswerOutcome | null>(null)
	const [isWindowBlurred, setIsWindowBlurred] = useState<boolean>(false)

	const promptCanvasRef = useRef<HTMLCanvasElement | null>(null)
	const choiceCanvasRefs = useRef<Array<HTMLCanvasElement | null>>([null, null, null, null])
	const explanationCanvasRef = useRef<HTMLCanvasElement | null>(null)

	const attacker = CHARACTERS[attackerCharacter]
	const defender = CHARACTERS[defenderCharacter]
	const subjectMeta = SUBJECT_BORDER_PALETTE[card.subject]
	const rarityMeta = RARITY_FILL_PALETTE[card.rarity]
	const isEpicOrLegendary = card.rarity === 'epic' || card.rarity === 'legendary'

	// Reset state whenever a new thrown card entry arrives
	const entryKey = `${card.instanceId}:${question.id}`
	useEffect(() => {
		if (!entryKey) return
		setRemainingMs(question.timerSeconds * 1000)
		setSelectedChoice(null)
		setResolvedOutcome(null)
		audioManager.playSfx('popup-open')
	}, [entryKey, question.timerSeconds])

	// Play STEM Trial tension BGM while quiz modal is active, then restore battle BGM on close
	useEffect(() => {
		audioManager.playBgm('quiz')
		return () => {
			audioManager.playBgm('battle')
		}
	}, [])

	// Handle window blur / visibility anti-cheat mask (ENGINE_CONFIG.hideOnBlur) + block copy/cut/contextmenu
	useEffect(() => {
		const blockCopy = (e: Event) => e.preventDefault()
		document.addEventListener('copy', blockCopy)
		document.addEventListener('cut', blockCopy)
		document.addEventListener('contextmenu', blockCopy)

		if (!ENGINE_CONFIG.hideOnBlur) {
			return () => {
				document.removeEventListener('copy', blockCopy)
				document.removeEventListener('cut', blockCopy)
				document.removeEventListener('contextmenu', blockCopy)
			}
		}

		const handleBlur = () => setIsWindowBlurred(true)
		const handleFocus = () => setIsWindowBlurred(false)
		const handleVisibility = () => {
			if (document.visibilityState === 'hidden') {
				setIsWindowBlurred(true)
			} else {
				setIsWindowBlurred(false)
			}
		}

		window.addEventListener('blur', handleBlur)
		window.addEventListener('focus', handleFocus)
		document.addEventListener('visibilitychange', handleVisibility)
		return () => {
			document.removeEventListener('copy', blockCopy)
			document.removeEventListener('cut', blockCopy)
			document.removeEventListener('contextmenu', blockCopy)
			window.removeEventListener('blur', handleBlur)
			window.removeEventListener('focus', handleFocus)
			document.removeEventListener('visibilitychange', handleVisibility)
		}
	}, [])

	const commitAnswer = useCallback(
		(choiceIndex: number | null, isTimeout = false) => {
			if (resolvedOutcome !== null) return
			let outcome: QuizAnswerOutcome
			if (isTimeout || choiceIndex === null) {
				outcome = 'timeout'
			} else if (choiceIndex === question.correctIndex) {
				outcome = 'correct'
			} else {
				outcome = 'wrong'
			}

			setSelectedChoice(choiceIndex)
			setResolvedOutcome(outcome)

			if (outcome === 'correct') {
				audioManager.playSfx('quiz-correct')
			} else {
				audioManager.playSfx('quiz-wrong')
				audioManager.playCharacterVoice(defenderCharacter, 'hurt')
			}
		},
		[defenderCharacter, question.correctIndex, resolvedOutcome],
	)

	// Countdown timer + final 4-second clock tick SFX
	const lastTickSecondRef = useRef<number | null>(null)
	useEffect(() => {
		if (!entryKey || resolvedOutcome !== null) return
		const startedAt = performance.now()
		lastTickSecondRef.current = null

		const interval = window.setInterval(() => {
			const elapsed = performance.now() - startedAt
			const nextRemaining = Math.max(0, totalMs - elapsed)
			setRemainingMs(nextRemaining)

			const wholeSec = Math.ceil(nextRemaining / 1000)
			if (wholeSec >= 1 && wholeSec <= 4 && lastTickSecondRef.current !== wholeSec) {
				lastTickSecondRef.current = wholeSec
				audioManager.playSfx('tick')
			}

			if (nextRemaining <= 0) {
				window.clearInterval(interval)
				commitAnswer(null, true)
			}
		}, 50)

		return () => window.clearInterval(interval)
	}, [commitAnswer, entryKey, resolvedOutcome, totalMs])

	// Bot defender auto-answer
	useEffect(() => {
		if (!isBotDefender || resolvedOutcome !== null) return
		const botAccuracyByRarity: Record<string, number> = {
			normal: 0.65,
			uncommon: 0.55,
			epic: 0.45,
			legendary: 0.35,
		}
		const targetAccuracy = botAccuracyByRarity[card.rarity] ?? 0.5
		const timer = window.setTimeout(() => {
			const roll = Math.random()
			if (roll < targetAccuracy) {
				commitAnswer(question.correctIndex, false)
			} else {
				const wrongChoices = [0, 1, 2, 3].filter((idx) => idx !== question.correctIndex)
				const pick = wrongChoices[Math.floor(Math.random() * wrongChoices.length)] ?? 0
				commitAnswer(pick, false)
			}
		}, 1150)
		return () => window.clearTimeout(timer)
	}, [card.rarity, commitAnswer, isBotDefender, question.correctIndex, resolvedOutcome])

	// Keyboard shortcuts (1-4 / A-D, Enter/Space to continue after resolution)
	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			if (resolvedOutcome !== null) {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault()
					onResolve(resolvedOutcome)
				}
				return
			}
			if (isBotDefender) return
			const key = e.key.toUpperCase()
			if (key === '1' || key === 'A') commitAnswer(0)
			if (key === '2' || key === 'B') commitAnswer(1)
			if (key === '3' || key === 'C') commitAnswer(2)
			if (key === '4' || key === 'D') commitAnswer(3)
		}
		window.addEventListener('keydown', onKeyDown)
		return () => window.removeEventListener('keydown', onKeyDown)
	}, [commitAnswer, isBotDefender, onResolve, resolvedOutcome])

	// Render prompt and choices to <canvas>
	useEffect(() => {
		drawProtectedCanvasText(promptCanvasRef.current, question.prompt, {
			width: 620,
			height: 112,
			fontSize: 16,
			textColor: '#f8fafc',
			bgColor: '#090d16',
			borderColor: subjectMeta.border,
			watermark: `QUIZ DUEL · ${subjectMeta.label.toUpperCase()} · ${rarityMeta.label.toUpperCase()}`,
			seedOffset: 31,
		})

		const badges = ['A', 'B', 'C', 'D']
		question.choices.forEach((choiceText, idx) => {
			const isSelected = selectedChoice === idx
			const isCorrect = idx === question.correctIndex
			let borderColor = '#334155'
			let bgColor = '#0f172a'
			let textColor = '#f1f5f9'

			if (resolvedOutcome !== null) {
				if (isCorrect) {
					borderColor = '#10b981'
					bgColor = '#062c22'
					textColor = '#6ee7b7'
				} else if (isSelected && !isCorrect) {
					borderColor = '#ef4444'
					bgColor = '#3b0d15'
					textColor = '#fca5a5'
				}
			}

			drawProtectedCanvasText(choiceCanvasRefs.current[idx], choiceText, {
				width: 298,
				height: 68,
				fontSize: 14,
				textColor,
				bgColor,
				borderColor,
				prefixBadge: badges[idx],
				prefixColor: resolvedOutcome !== null && isCorrect ? '#34d399' : subjectMeta.highlight,
				watermark: `OPTION ${badges[idx]} · NO COPY`,
				seedOffset: 100 + idx * 19,
			})
		})

		if (resolvedOutcome !== null && explanationCanvasRef.current) {
			drawProtectedCanvasText(explanationCanvasRef.current, `Explanation: ${question.explanation}`, {
				width: 620,
				height: 66,
				fontSize: 13,
				textColor: '#fde68a',
				bgColor: '#131826',
				borderColor: '#475569',
				watermark: 'STEM SOLUTION VERIFIED',
				seedOffset: 73,
			})
		}
	}, [
		question,
		rarityMeta.label,
		resolvedOutcome,
		selectedChoice,
		subjectMeta.border,
		subjectMeta.highlight,
		subjectMeta.label,
	])

	const secondsDisplay = (remainingMs / 1000).toFixed(1)

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 select-none backdrop-blur-xs">
			<FlatPanel variant="gold" wellVariant="dark" className="w-full max-w-[1060px] shadow-2xl" wellClassName="p-6">
				{/* Top Quiz Header Bar */}
				<div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
					<div className="flex items-center gap-3">
						<FlatBanner variant="offset-bl">
							{subjectMeta.label.toUpperCase()} QUIZ ({queuePosition}/{queueTotal})
						</FlatBanner>
						<span style={{color: rarityMeta.badgeText}} className="font-pixel text-xs">
							{rarityMeta.label} Card · {question.timerSeconds}s Limit
						</span>
					</div>

					{/* Defender Identity */}
					<div className="flex items-center gap-3 text-xs">
						<span className="text-slate-300">
							Attacker: <strong className="text-amber-300">{attacker.name}</strong>
						</span>
						<span aria-hidden="true" className="text-slate-500">
							→
						</span>
						<span className="text-slate-200">
							Defender Answering:{' '}
							<strong className="text-sky-300">
								{defender.name} (P{entry.defenderIndex + 1}
								{isBotDefender ? ' · BOT' : ''})
							</strong>
						</span>
					</div>
				</div>

				{/* Countdown Progress Bar using FlatBar */}
				<div className="my-4 space-y-1.5">
					<div className="flex items-center justify-between font-pixel text-xs">
						<span className="text-slate-200">
							{resolvedOutcome === null
								? isBotDefender
									? `${defender.name} (Bot) is calculating answer...`
									: `Defender P${entry.defenderIndex + 1} (${defender.name}): Answer before timer expires!`
								: 'Question Resolved'}
						</span>
						<span className={`tabular-nums ${remainingMs <= 3000 ? 'text-red-400 animate-pulse' : 'text-amber-300'}`}>
							{secondsDisplay}s
						</span>
					</div>
					<FlatBar
						value={remainingMs}
						max={totalMs}
						fillTone={remainingMs <= 3000 ? 'red' : remainingMs <= 6000 ? 'gold' : 'green'}
						heightClass="h-5"
					/>
				</div>

				{/* Main 2-Column Quiz Arena: Thrown Card on Left, Protected Canvas Quiz on Right */}
				<div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
					{/* Left Column: Incoming Thrown Card + Resolution Stakes */}
					<FlatWell variant="gold-dark" className="flex flex-col items-center justify-between p-4 lg:col-span-4">
						<div className="mb-2 flex w-full items-center justify-between text-xs text-slate-300">
							<div className="flex items-center gap-2">
								<PixelSprite characterId={attackerCharacter} integerScale={1} facing="right" />
								<span className="font-pixel text-[10px] text-amber-300">Thrown Card</span>
							</div>
							<span className="font-mono text-[11px] text-slate-300">#{card.id}</span>
						</div>

						<NineSliceCard
							id={card.id}
							name={card.name}
							subject={card.subject}
							rarity={card.rarity}
							cost={card.cost}
							text={formattedCardText}
							upgraded={card.upgraded}
							exhaust={card.exhaust}
							power={card.power}
							integerScale={3}
						/>

						{/* Stakes Matrix */}
						<div className="mt-4 w-full space-y-1.5 border-t border-slate-800 pt-3 text-xs">
							<div className="font-pixel text-[9px] text-slate-300">DEFENDER QUIZ STAKES:</div>
							<div className="flat-slot-blue flex items-center justify-between px-2.5 py-1 text-white">
								<span>If Correct:</span>
								<span className="font-semibold">{isEpicOrLegendary ? 'Reduced to 35%' : 'NULLIFIED (No Effect)'}</span>
							</div>
							{isEpicOrLegendary && card.reducedText && (
								<div className="flat-slot-dark px-2.5 py-1 text-[11px] text-amber-200">
									Reduced Form: {card.reducedText}
								</div>
							)}
							<div className="flat-slot-orange flex items-center justify-between px-2.5 py-1 text-white">
								<span>If Wrong / Timeout:</span>
								<span className="font-semibold">FULL EFFECT (100%)</span>
							</div>
						</div>
					</FlatWell>

					{/* Right Column: Anti-Copy <canvas> Question & 4 Choice Buttons */}
					<div className="relative flex flex-col justify-between space-y-4 lg:col-span-8">
						{/* Anti-Cheat Blur Mask when window loses focus */}
						{isWindowBlurred && resolvedOutcome === null && (
							<div className="flat-frame-gold absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/95 p-6 text-center">
								<div className="font-pixel text-sm text-amber-300">ANTI-CHEAT SHIELD ACTIVE</div>
								<p className="mt-2 max-w-md text-xs text-slate-200">
									Quiz prompt and choices are hidden while the game window is unfocused. Click inside the window to
									resume viewing before the timer runs out!
								</p>
							</div>
						)}

						{/* Question Prompt Canvas */}
						<FlatWell variant="dark" className="overflow-x-auto p-2">
							<div className="mb-1 flex items-center justify-between px-1 font-mono text-[11px] text-slate-400">
								<span>Protected Canvas Render (No DOM Text · Jitter + Scanline Active)</span>
								<span>Keys: [1-4] or [A-D]</span>
							</div>
							<div className="flex justify-center">
								<canvas ref={promptCanvasRef} className="max-w-full" />
							</div>
						</FlatWell>

						{/* 4 Multiple Choice Canvas Buttons */}
						<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
							{[0, 1, 2, 3].map((idx) => (
								<button
									key={idx}
									type="button"
									disabled={resolvedOutcome !== null || isBotDefender}
									aria-label={`Select quiz option ${idx + 1}`}
									onClick={() => commitAnswer(idx, false)}
									className={`flat-slot-dark flex items-center justify-center overflow-hidden p-1 transition-transform ${
										resolvedOutcome === null && !isBotDefender
											? 'cursor-pointer hover:-translate-y-0.5'
											: 'cursor-default'
									}`}
								>
									<canvas
										ref={(el) => {
											choiceCanvasRefs.current[idx] = el
										}}
										className="pointer-events-none max-w-full"
									/>
								</button>
							))}
						</div>

						{/* Post-Answer Resolution Banner + Explanation Canvas + Continue Button */}
						{resolvedOutcome !== null && (
							<div className="space-y-3 border-t border-slate-800 pt-3">
								<FlatWell
									variant={resolvedOutcome === 'correct' ? 'blue' : 'orange'}
									className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5"
								>
									<div className="font-pixel text-xs text-white">
										{resolvedOutcome === 'correct'
											? isEpicOrLegendary
												? 'CORRECT ANSWER! CARD REDUCED TO 35% STRENGTH!'
												: 'CORRECT ANSWER! CARD COMPLETELY NULLIFIED!'
											: resolvedOutcome === 'timeout'
												? 'TIME EXPIRED! CARD LANDS AT FULL STRENGTH!'
												: 'WRONG ANSWER! CARD LANDS AT FULL STRENGTH!'}
									</div>

									<FlatButton variant="cream" size="md" icon="play" onClick={() => onResolve(resolvedOutcome)}>
										Apply &amp; Continue
									</FlatButton>
								</FlatWell>

								<div className="flex justify-center overflow-x-auto">
									<canvas ref={explanationCanvasRef} className="max-w-full" />
								</div>
							</div>
						)}
					</div>
				</div>
			</FlatPanel>
		</div>
	)
}

/**
 * Allows the active player to peek at the STEM question bound to a card in their own hand before throwing it.
 * Also renders strictly on <canvas> per Section 7.
 */
export function QuestionPeekModal({card, seed, onClose}: QuestionPeekModalProps) {
	const promptCanvasRef = useRef<HTMLCanvasElement | null>(null)
	const choiceCanvasRefs = useRef<Array<HTMLCanvasElement | null>>([null, null, null, null])
	const question = resolveCardQuestion(card, seed)
	const subjectMeta = SUBJECT_BORDER_PALETTE[card.subject]
	const rarityMeta = RARITY_FILL_PALETTE[card.rarity]

	useEffect(() => {
		if (!question) return
		drawProtectedCanvasText(promptCanvasRef.current, question.prompt, {
			width: 560,
			height: 100,
			fontSize: 15,
			textColor: '#f8fafc',
			bgColor: '#090d16',
			borderColor: subjectMeta.border,
			watermark: 'BOUND QUESTION PREVIEW',
			seedOffset: 19,
		})

		const badges = ['A', 'B', 'C', 'D']
		question.choices.forEach((choiceText, idx) => {
			drawProtectedCanvasText(choiceCanvasRefs.current[idx], choiceText, {
				width: 268,
				height: 60,
				fontSize: 13,
				textColor: '#e2e8f0',
				bgColor: '#0f172a',
				borderColor: '#334155',
				prefixBadge: badges[idx],
				prefixColor: subjectMeta.highlight,
				watermark: 'PREVIEW ONLY',
				seedOffset: 50 + idx * 13,
			})
		})
	}, [question, subjectMeta.border, subjectMeta.highlight])

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 select-none">
			<FlatPanel variant="silver" wellVariant="dark" className="w-full max-w-[660px]" wellClassName="p-6 space-y-4">
				<div className="flex items-center justify-between border-b border-slate-800 pb-3">
					<div>
						<FlatBanner variant="offset-bl">
							Bound Question Peek · {card.name} (#{card.id})
						</FlatBanner>
						<div className="mt-2 text-xs text-slate-300">
							{subjectMeta.label} · {rarityMeta.label} · Opponent gets {question?.timerSeconds ?? 15}s to answer when
							thrown
						</div>
					</div>
					<FlatButton variant="cream" size="sm" icon="cross" onClick={onClose}>
						Close
					</FlatButton>
				</div>

				{question ? (
					<div className="space-y-3">
						<div className="flex justify-center overflow-x-auto">
							<canvas ref={promptCanvasRef} className="max-w-full" />
						</div>
						<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
							{[0, 1, 2, 3].map((idx) => (
								<div key={idx} className="flat-slot-dark flex justify-center overflow-hidden p-1">
									<canvas
										ref={(el) => {
											choiceCanvasRefs.current[idx] = el
										}}
										className="max-w-full"
									/>
								</div>
							))}
						</div>
					</div>
				) : (
					<div className="py-6 text-center text-xs text-slate-400">No bound question found on this card instance.</div>
				)}
			</FlatPanel>
		</div>
	)
}
