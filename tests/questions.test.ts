/**
 * Quiz Duel — 160-Question STEM Quiz Bank Unit Tests
 */

import test from 'ava'
import {getQuestionById, getQuestionsBySubjectAndRarity, QUESTION_BANK} from '../src/content/questions'
import {ENGINE_CONFIG, RARITIES, SUBJECTS} from '../src/engine/config'

test('QUESTION_BANK contains 160 questions (10 per subject and rarity across all 16 cells)', (t) => {
	t.is(QUESTION_BANK.length, 160)

	for (const subject of SUBJECTS) {
		for (const rarity of RARITIES) {
			const cell = getQuestionsBySubjectAndRarity(subject, rarity)
			t.is(cell.length, 10, `${subject} × ${rarity} has 10 questions`)
		}
	}
})

test('every question in QUESTION_BANK has a unique ID, 4 distinct choices, valid correctIndex, explanation, and timer', (t) => {
	const ids = new Set<string>()
	const prompts = new Set<string>()

	for (const qItem of QUESTION_BANK) {
		t.false(ids.has(qItem.id), `Duplicate question ID: ${qItem.id}`)
		ids.add(qItem.id)

		t.false(prompts.has(qItem.prompt), `Duplicate question prompt: ${qItem.prompt}`)
		prompts.add(qItem.prompt)

		t.true(qItem.prompt.trim().length > 10)
		t.is(qItem.choices.length, 4)

		const choiceSet = new Set(qItem.choices.map((c) => c.trim()))
		t.is(choiceSet.size, 4, `Question ${qItem.id} has 4 distinct choices`)

		t.true([0, 1, 2, 3].includes(qItem.correctIndex))
		t.true(qItem.explanation.trim().length > 5)
		t.is(qItem.timerSeconds, ENGINE_CONFIG.quizTimersSeconds[qItem.rarity])
		t.deepEqual(getQuestionById(qItem.id), qItem)
	}
})

test('shuffling question choices per match across all 160 questions and 5 seeds places 22-28% of correct answers in each position', (t) => {
	const seeds = [101, 202, 303, 404, 505]
	const counts: [number, number, number, number] = [0, 0, 0, 0]
	const totalSamples = QUESTION_BANK.length * seeds.length
	t.is(totalSamples, 800)

	for (const seed of seeds) {
		for (const baseQuestion of QUESTION_BANK) {
			const expectedCorrectAnswer = baseQuestion.choices[baseQuestion.correctIndex]
			const shuffled = getQuestionById(baseQuestion.id, seed)
			t.truthy(shuffled)
			if (!shuffled) continue

			t.is(shuffled.choices[shuffled.correctIndex], expectedCorrectAnswer)
			t.is(new Set(shuffled.choices).size, 4)
			counts[shuffled.correctIndex] += 1
		}
	}

	for (const pos of [0, 1, 2, 3] as const) {
		const ratio = counts[pos] / totalSamples
		t.true(
			ratio >= 0.22 && ratio <= 0.28,
			`Expected answer position ${pos} to hold 22-28% of correct answers, got ${(ratio * 100).toFixed(2)}% (${counts[pos]}/${totalSamples})`,
		)
	}
})
