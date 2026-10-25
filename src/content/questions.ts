/**
 * Quiz Duel — 160-Question STEM Quiz Bank (Maths, Physics, Chemistry, Biology × 4 Rarities)
 * Difficulty scales with card rarity and timer:
 *  - Normal: 8s timer (Foundational concepts & mental calculation)
 *  - Uncommon: 15s timer (Multi-step secondary STEM problems)
 *  - Epic: 25s timer (Advanced AP / early university STEM problems)
 *  - Legendary: 40s timer (Deep analytical & synthesis STEM problems)
 */

import type {CardInstance} from '../engine/cards'
import {ENGINE_CONFIG, RARITY_LIST, type Rarity, SUBJECT_LIST, type Subject} from '../engine/config'
import {seededShuffle} from '../engine/utils'

export interface QuizQuestion {
	id: string
	subject: Subject
	rarity: Rarity
	timerSeconds: number
	prompt: string
	choices: [string, string, string, string]
	correctIndex: 0 | 1 | 2 | 3
	explanation: string
}

function q(
	id: string,
	subject: Subject,
	rarity: Rarity,
	prompt: string,
	choices: [string, string, string, string],
	correctIndex: 0 | 1 | 2 | 3,
	explanation: string,
): QuizQuestion {
	return {
		id,
		subject,
		rarity,
		timerSeconds: ENGINE_CONFIG.quizTimersSeconds[rarity],
		prompt,
		choices,
		correctIndex,
		explanation,
	}
}

export const MATHS_QUESTIONS: QuizQuestion[] = [
	// Normal (8s)
	q(
		'Q-M-N-1',
		'maths',
		'normal',
		'What is the value of 7 × 8 - 12?',
		['42', '44', '46', '48'],
		1,
		'7 × 8 = 56, and 56 - 12 = 44.',
	),
	q(
		'Q-M-N-2',
		'maths',
		'normal',
		'Solve for x: 3x + 5 = 20.',
		['3', '4', '5', '6'],
		2,
		'Subtract 5 to get 3x = 15, then divide by 3 to get x = 5.',
	),
	q(
		'Q-M-N-3',
		'maths',
		'normal',
		'What is 15% of 200?',
		['25', '30', '35', '40'],
		1,
		'15% of 100 is 15, so 15% of 200 is 30.',
	),
	q(
		'Q-M-N-4',
		'maths',
		'normal',
		'What is the interior angle sum of any triangle in Euclidean geometry?',
		['90°', '180°', '270°', '360°'],
		1,
		'The interior angles of a Euclidean triangle always sum to 180°.',
	),
	q(
		'Q-M-N-5',
		'maths',
		'normal',
		'Which of the following numbers is prime?',
		['21', '27', '29', '33'],
		2,
		'29 has no positive divisors other than 1 and 29.',
	),
	q(
		'Q-M-N-6',
		'maths',
		'normal',
		'What is the area of a rectangle with length 9 and width 6?',
		['30', '48', '54', '63'],
		2,
		'Area = length × width = 9 × 6 = 54.',
	),
	q('Q-M-N-7', 'maths', 'normal', 'Evaluate 2^5.', ['16', '25', '32', '64'], 2, '2^5 = 2 × 2 × 2 × 2 × 2 = 32.'),
	q(
		'Q-M-N-8',
		'maths',
		'normal',
		'What is the greatest common divisor (GCD) of 24 and 36?',
		['6', '8', '12', '18'],
		2,
		'12 is the largest integer that divides both 24 and 36.',
	),
	q(
		'Q-M-N-9',
		'maths',
		'normal',
		'If a right triangle has legs of length 3 and 4, what is the length of its hypotenuse?',
		['5', '6', '7', '25'],
		0,
		'By the Pythagorean theorem, √(3² + 4²) = √25 = 5.',
	),
	q(
		'Q-M-N-10',
		'maths',
		'normal',
		'What is the median of the data set {2, 5, 9, 11, 18}?',
		['5', '9', '10', '11'],
		1,
		'In the sorted 5-element set, the middle (3rd) value is 9.',
	),

	// Uncommon (15s)
	q(
		'Q-M-U-1',
		'maths',
		'uncommon',
		'What are the roots of x² - 5x + 6 = 0?',
		['x = 1, 6', 'x = 2, 3', 'x = -2, -3', 'x = -1, 6'],
		1,
		'x² - 5x + 6 factors as (x - 2)(x - 3) = 0, giving x = 2 and x = 3.',
	),
	q('Q-M-U-2', 'maths', 'uncommon', 'What is log₂(64)?', ['5', '6', '7', '8'], 1, 'Since 2^6 = 64, log₂(64) = 6.'),
	q(
		'Q-M-U-3',
		'maths',
		'uncommon',
		'How many distinct ways can 4 books be arranged on a shelf?',
		['12', '16', '24', '32'],
		2,
		'The number of permutations of 4 distinct items is 4! = 4 × 3 × 2 × 1 = 24.',
	),
	q(
		'Q-M-U-4',
		'maths',
		'uncommon',
		'What is the value of sin(30°) + cos(60°)?',
		['0.5', '1', '√3 / 2', '√3'],
		1,
		'sin(30°) = 0.5 and cos(60°) = 0.5, so their sum is 1.',
	),
	q(
		'Q-M-U-5',
		'maths',
		'uncommon',
		'In an arithmetic sequence with first term a₁ = 4 and common difference d = 3, what is the 10th term?',
		['28', '31', '34', '37'],
		1,
		'a₁₀ = a₁ + (10 - 1)d = 4 + 9 × 3 = 31.',
	),
	q(
		'Q-M-U-6',
		'maths',
		'uncommon',
		'What is the slope of the line passing through (-1, 2) and (3, 14)?',
		['2', '3', '4', '6'],
		1,
		'Slope m = (14 - 2) / (3 - (-1)) = 12 / 4 = 3.',
	),
	q(
		'Q-M-U-7',
		'maths',
		'uncommon',
		'What is the binomial coefficient C(6, 2) ("6 choose 2")?',
		['12', '15', '20', '30'],
		1,
		'C(6, 2) = (6 × 5) / (2 × 1) = 15.',
	),
	q(
		'Q-M-U-8',
		'maths',
		'uncommon',
		'If f(x) = 2x² - 3x + 1, what is f(-2)?',
		['3', '11', '15', '17'],
		2,
		'f(-2) = 2(4) - 3(-2) + 1 = 8 + 6 + 1 = 15.',
	),
	q(
		'Q-M-U-9',
		'maths',
		'uncommon',
		'A circle has circumference 10π. What is its area?',
		['10π', '20π', '25π', '100π'],
		2,
		'2πr = 10π implies r = 5, so Area = πr² = 25π.',
	),
	q(
		'Q-M-U-10',
		'maths',
		'uncommon',
		'Solve for x: 9^(x) = 27.',
		['1.25', '1.5', '2', '3'],
		1,
		'9^x = (3²)^x = 3^(2x) and 27 = 3³, so 2x = 3 and x = 1.5.',
	),

	// Epic (25s)
	q(
		'Q-M-E-1',
		'maths',
		'epic',
		'What is the derivative f′(2) of f(x) = x³ - 4x² + 5x?',
		['1', '3', '5', '9'],
		0,
		'f′(x) = 3x² - 8x + 5, so f′(2) = 3(4) - 8(2) + 5 = 12 - 16 + 5 = 1.',
	),
	q(
		'Q-M-E-2',
		'maths',
		'epic',
		'Evaluate the definite integral ∫₀³ (2x + 1) dx.',
		['9', '10', '12', '15'],
		2,
		'The antiderivative is x² + x. Evaluated from 0 to 3: 3² + 3 = 12.',
	),
	q(
		'Q-M-E-3',
		'maths',
		'epic',
		'What is the determinant of the 2×2 matrix [[4, 3], [2, 5]]?',
		['11', '14', '20', '26'],
		1,
		'det([[a, b], [c, d]]) = ad - bc = 4(5) - 3(2) = 20 - 6 = 14.',
	),
	q(
		'Q-M-E-4',
		'maths',
		'epic',
		'What is the sum of the infinite geometric series 8 + 4 + 2 + 1 + ...?',
		['14', '15', '16', '20'],
		2,
		'For first term a = 8 and ratio r = 1/2, S = a / (1 - r) = 8 / 0.5 = 16.',
	),
	q(
		'Q-M-E-5',
		'maths',
		'epic',
		'When two fair 6-sided dice are rolled, what is the probability that their sum is 7?',
		['1/9', '1/6', '7/36', '1/4'],
		1,
		'There are 6 outcomes summing to 7 out of 36 total outcomes: 6/36 = 1/6.',
	),
	q(
		'Q-M-E-6',
		'maths',
		'epic',
		'What is lim(x → 0) [sin(5x) / x]?',
		['0', '1', '5', '1/5'],
		2,
		'Since lim(u → 0) sin(u)/u = 1, lim(x → 0) 5·sin(5x)/(5x) = 5.',
	),
	q(
		'Q-M-E-7',
		'maths',
		'epic',
		'What is the dot product of vectors u = (2, -3, 4) and v = (5, 2, -1)?',
		['0', '2', '12', '20'],
		0,
		'u · v = 2(5) + (-3)(2) + 4(-1) = 10 - 6 - 4 = 0.',
	),
	q(
		'Q-M-E-8',
		'maths',
		'epic',
		'For complex number z = 3 - 4i, what is |z|² (the squared modulus)?',
		['5', '7', '25', '49'],
		2,
		'|z|² = 3² + (-4)² = 9 + 16 = 25.',
	),
	q(
		'Q-M-E-9',
		'maths',
		'epic',
		'If ln(x) + ln(x - 2) = ln(8), what is the valid real value of x?',
		['2', '4', '6', '-2'],
		1,
		'x(x - 2) = 8 gives x² - 2x - 8 = 0, so (x - 4)(x + 2) = 0; since x > 2 for real logs, x = 4.',
	),
	q(
		'Q-M-E-10',
		'maths',
		'epic',
		'At what value of x does f(x) = x² - 6x + 13 attain its global minimum?',
		['x = -3', 'x = 3', 'x = 4', 'x = 6'],
		1,
		'Completing the square gives (x - 3)² + 4, which attains its minimum at x = 3.',
	),

	// Legendary (40s)
	q(
		'Q-M-L-1',
		'maths',
		'legendary',
		'What are the eigenvalues of the matrix [[3, 1], [1, 3]]?',
		['1 and 3', '2 and 4', '0 and 6', '-2 and 4'],
		1,
		'The trace is 6 and determinant is 8; λ² - 6λ + 8 = 0 factors into (λ - 2)(λ - 4) = 0.',
	),
	q(
		'Q-M-L-2',
		'maths',
		'legendary',
		'Solve the initial value problem dy/dx = 2xy with y(0) = 3. What is y(1)?',
		['3e', '3e²', '6e', 'e³'],
		0,
		'Separating variables gives y(x) = 3e^(x²), so y(1) = 3e¹ = 3e.',
	),
	q(
		'Q-M-L-3',
		'maths',
		'legendary',
		'What is the remainder when 3^100 is divided by 8?',
		['1', '3', '5', '7'],
		0,
		'Since 3² = 9 ≡ 1 (mod 8), 3^100 = (3²)^50 ≡ 1^50 = 1 (mod 8).',
	),
	q(
		'Q-M-L-4',
		'maths',
		'legendary',
		'In the Maclaurin series of cos(2x), what is the coefficient of x⁴?',
		['1/24', '2/3', '-2/3', '16/12'],
		1,
		'cos(u) = 1 - u²/2! + u⁴/4! - ...; substituting u = 2x gives (2x)⁴ / 24 = 16x⁴ / 24 = (2/3)x⁴.',
	),
	q(
		'Q-M-L-5',
		'maths',
		'legendary',
		'Let f(x, y) = x²y + y³. What is the Laplacian ∇²f = ∂²f/∂x² + ∂²f/∂y² at (1, 2)?',
		['8', '12', '14', '16'],
		3,
		'∂²f/∂x² = 2y and ∂²f/∂y² = 6y, so ∇²f = 8y; at (1, 2) this equals 8(2) = 16.',
	),
	q(
		'Q-M-L-6',
		'maths',
		'legendary',
		'Evaluate ∫₀^(π/2) sin(x) cos(x) dx.',
		['1/4', '1/2', '1', 'π/4'],
		1,
		'Using u = sin(x), du = cos(x) dx, the integral is [sin²(x)/2]₀^(π/2) = 1/2.',
	),
	q(
		'Q-M-L-7',
		'maths',
		'legendary',
		'What is the radius of convergence R of the power series Σ_{n=1}^∞ (x^n) / (n · 3^n)?',
		['1/3', '1', '3', '∞'],
		2,
		'By the ratio test, lim |(x/(3))| = |x|/3 < 1, so the radius of convergence is R = 3.',
	),
	q(
		'Q-M-L-8',
		'maths',
		'legendary',
		'How many generators does the cyclic group Z₁₂ under addition modulo 12 have?',
		['2', '4', '6', '11'],
		1,
		'The number of generators of Z_n is Euler totient φ(12) = 12(1 - 1/2)(1 - 1/3) = 4 (namely 1, 5, 7, 11).',
	),
	q(
		'Q-M-L-9',
		'maths',
		'legendary',
		'By the Residue Theorem or standard contour integration, what is ∮_{|z|=2} (1 / z) dz traversed once counterclockwise?',
		['0', 'πi', '2πi', '4πi'],
		2,
		'The simple pole at z = 0 has residue 1, so the contour integral equals 2πi.',
	),
	q(
		'Q-M-L-10',
		'maths',
		'legendary',
		'If X is a Poisson random variable with parameter λ = 3, what is E[X²]?',
		['3', '6', '9', '12'],
		3,
		'For Poisson(λ), Var(X) = λ = 3 and E[X] = λ = 3, so E[X²] = Var(X) + (E[X])² = 3 + 9 = 12.',
	),
]

export const PHYSICS_QUESTIONS: QuizQuestion[] = [
	// Normal (8s)
	q(
		'Q-P-N-1',
		'physics',
		'normal',
		'What is the SI unit of electrical resistance?',
		['Volt', 'Ampere', 'Ohm', 'Watt'],
		2,
		'Electrical resistance is measured in Ohms (Ω).',
	),
	q(
		'Q-P-N-2',
		'physics',
		'normal',
		'A net force of 20 N acts on a 4 kg mass. What is its acceleration?',
		['2 m/s²', '4 m/s²', '5 m/s²', '80 m/s²'],
		2,
		'By Newton’s second law, a = F / m = 20 N / 4 kg = 5 m/s².',
	),
	q(
		'Q-P-N-3',
		'physics',
		'normal',
		'Which electromagnetic wave has the shortest wavelength?',
		['Radio waves', 'Infrared', 'Ultraviolet', 'Gamma rays'],
		3,
		'Gamma rays have the highest frequency and shortest wavelength in the electromagnetic spectrum.',
	),
	q(
		'Q-P-N-4',
		'physics',
		'normal',
		'If a 6 Ω resistor carries a current of 2 A, what is the voltage across it?',
		['3 V', '8 V', '12 V', '24 V'],
		2,
		'By Ohm’s law, V = I × R = 2 A × 6 Ω = 12 V.',
	),
	q(
		'Q-P-N-5',
		'physics',
		'normal',
		'What is the approximate speed of light in a vacuum?',
		['3 × 10⁵ m/s', '3 × 10⁶ m/s', '3 × 10⁸ m/s', '3 × 10¹⁰ m/s'],
		2,
		'Light travels in vacuum at c ≈ 3.00 × 10⁸ m/s.',
	),
	q(
		'Q-P-N-6',
		'physics',
		'normal',
		'A wave has frequency 50 Hz and wavelength 4 m. What is its wave speed?',
		['12.5 m/s', '54 m/s', '100 m/s', '200 m/s'],
		3,
		'Wave speed v = f × λ = 50 Hz × 4 m = 200 m/s.',
	),
	q(
		'Q-P-N-7',
		'physics',
		'normal',
		'Which of the following is a vector quantity?',
		['Speed', 'Mass', 'Temperature', 'Momentum'],
		3,
		'Momentum has both magnitude and direction, making it a vector.',
	),
	q(
		'Q-P-N-8',
		'physics',
		'normal',
		'An object starts from rest and accelerates uniformly at 3 m/s² for 4 s. What is its final speed?',
		['7 m/s', '12 m/s', '16 m/s', '24 m/s'],
		1,
		'v = u + at = 0 + (3 m/s²)(4 s) = 12 m/s.',
	),
	q(
		'Q-P-N-9',
		'physics',
		'normal',
		'What is the SI unit of power?',
		['Joule', 'Newton', 'Watt', 'Pascal'],
		2,
		'Power (energy per unit time, J/s) is measured in Watts (W).',
	),
	q(
		'Q-P-N-10',
		'physics',
		'normal',
		'Which law states that for every action force there is an equal and opposite reaction force?',
		['Newton’s 1st Law', 'Newton’s 2nd Law', 'Newton’s 3rd Law', 'Hooke’s Law'],
		2,
		'Newton’s 3rd Law describes equal and opposite action-reaction force pairs.',
	),

	// Uncommon (15s)
	q(
		'Q-P-U-1',
		'physics',
		'uncommon',
		'What is the kinetic energy of a 3 kg object moving at 4 m/s?',
		['6 J', '12 J', '24 J', '48 J'],
		2,
		'KE = ½mv² = 0.5 × 3 × 4² = 24 J.',
	),
	q(
		'Q-P-U-2',
		'physics',
		'uncommon',
		'Two 10 Ω resistors are connected in parallel. What is their equivalent resistance?',
		['2.5 Ω', '5 Ω', '10 Ω', '20 Ω'],
		1,
		'1/R_eq = 1/10 + 1/10 = 2/10, so R_eq = 5 Ω.',
	),
	q(
		'Q-P-U-3',
		'physics',
		'uncommon',
		'A 2 kg cart moving at 5 m/s collides with and sticks to a stationary 3 kg cart. What is their final speed?',
		['1.5 m/s', '2.0 m/s', '2.5 m/s', '3.0 m/s'],
		1,
		'By conservation of momentum, (2 × 5) / (2 + 3) = 10 / 5 = 2.0 m/s.',
	),
	q(
		'Q-P-U-4',
		'physics',
		'uncommon',
		'A spring with spring constant k = 200 N/m is compressed by 0.1 m. How much elastic potential energy is stored?',
		['1 J', '2 J', '10 J', '20 J'],
		0,
		'U = ½kx² = 0.5 × 200 × (0.1)² = 1 J.',
	),
	q(
		'Q-P-U-5',
		'physics',
		'uncommon',
		'If the distance between two point charges is doubled, the electrostatic force between them changes by a factor of:',
		['1/4', '1/2', '2', '4'],
		0,
		'By Coulomb’s inverse-square law (F ∝ 1/r²), doubling r reduces F to 1/4.',
	),
	q(
		'Q-P-U-6',
		'physics',
		'uncommon',
		'An ideal transformer has 100 primary turns and 400 secondary turns. If 12 V AC is applied to the primary, what is the secondary voltage?',
		['3 V', '24 V', '48 V', '96 V'],
		2,
		'V_s / V_p = N_s / N_p = 400 / 100 = 4, so V_s = 4 × 12 V = 48 V.',
	),
	q(
		'Q-P-U-7',
		'physics',
		'uncommon',
		'A projectile is launched horizontally from a 20 m high cliff (take g = 10 m/s²). How long does it take to hit the ground?',
		['1 s', '2 s', '3 s', '4 s'],
		1,
		'From h = ½gt², 20 = 5t², giving t² = 4 and t = 2 s.',
	),
	q(
		'Q-P-U-8',
		'physics',
		'uncommon',
		'What is the centripetal acceleration of a car moving at 10 m/s around a circular track of radius 25 m?',
		['0.4 m/s²', '2.5 m/s²', '4.0 m/s²', '10 m/s²'],
		2,
		'a_c = v² / r = 10² / 25 = 100 / 25 = 4.0 m/s².',
	),
	q(
		'Q-P-U-9',
		'physics',
		'uncommon',
		'An ideal gas expands isobarically at pressure 2000 Pa from volume 0.2 m³ to 0.5 m³. How much work is done by the gas?',
		['400 J', '600 J', '1000 J', '1400 J'],
		1,
		'W = PΔV = 2000 Pa × (0.5 - 0.2) m³ = 600 J.',
	),
	q(
		'Q-P-U-10',
		'physics',
		'uncommon',
		'Light travels from air (n = 1.0) into glass (n = 1.5). Its frequency f and wavelength λ in the glass satisfy:',
		['f increases, λ decreases', 'f is unchanged, λ decreases', 'f decreases, λ is unchanged', 'both f and λ decrease'],
		1,
		'Frequency remains constant across a boundary while wavelength decreases to λ₀ / n.',
	),

	// Epic (25s)
	q(
		'Q-P-E-1',
		'physics',
		'epic',
		'What is the capacitive time constant τ of a series RC circuit with R = 250 kΩ and C = 4 μF?',
		['0.1 s', '1.0 s', '4.0 s', '10 s'],
		1,
		'τ = R × C = (2.5 × 10⁵ Ω) × (4 × 10⁻⁶ F) = 1.0 s.',
	),
	q(
		'Q-P-E-2',
		'physics',
		'epic',
		'A solid uniform disk (I = ½MR²) rolls without slipping along a flat surface at speed v. What fraction of its total kinetic energy is rotational?',
		['1/4', '1/3', '1/2', '2/3'],
		1,
		'K_trans = ½Mv² and K_rot = ½(½MR²)(v/R)² = ¼Mv², so K_rot / K_total = (1/4) / (3/4) = 1/3.',
	),
	q(
		'Q-P-E-3',
		'physics',
		'epic',
		'In the photoelectric effect, if a metal has work function Φ = 2.2 eV and is illuminated by 3.5 eV photons, what is the maximum kinetic energy of emitted electrons?',
		['1.3 eV', '2.2 eV', '3.5 eV', '5.7 eV'],
		0,
		'By Einstein’s photoelectric equation, K_max = hf - Φ = 3.5 eV - 2.2 eV = 1.3 eV.',
	),
	q(
		'Q-P-E-4',
		'physics',
		'epic',
		'A satellite is in circular orbit of radius R around a planet with orbital speed v. A second satellite orbits the same planet at radius 4R. What is its orbital speed?',
		['v / 4', 'v / 2', 'v / √2', '2v'],
		1,
		'Since v = √(GM/r) ∝ 1/√r, quadrupling the radius reduces orbital speed by a factor of √4 = 2.',
	),
	q(
		'Q-P-E-5',
		'physics',
		'epic',
		'An electron moves at speed v perpendicular to a uniform magnetic field B. If its speed is doubled to 2v, how do its cyclotron radius r and period T change?',
		['r doubles, T is unchanged', 'r doubles, T doubles', 'r quadruples, T doubles', 'r is unchanged, T halves'],
		0,
		'r = mv/(qB) is proportional to v, while T = 2πm/(qB) is independent of speed in the non-relativistic regime.',
	),
	q(
		'Q-P-E-6',
		'physics',
		'epic',
		'A simple pendulum has period T on Earth (g). What is its period on a planet where gravitational acceleration is g/4?',
		['T / 2', 'T', '2T', '4T'],
		2,
		'Since T = 2π√(L/g), dividing g by 4 multiplies the period by √4 = 2.',
	),
	q(
		'Q-P-E-7',
		'physics',
		'epic',
		'An object is placed 30 cm in front of a thin converging lens of focal length f = 10 cm. At what distance behind the lens does the real image form?',
		['12 cm', '15 cm', '20 cm', '30 cm'],
		1,
		'1/d_i = 1/f - 1/d_o = 1/10 - 1/30 = 2/30 = 1/15, so d_i = 15 cm.',
	),
	q(
		'Q-P-E-8',
		'physics',
		'epic',
		'A pipe open at both ends has length L = 1.7 m. If the speed of sound is 340 m/s, what is its fundamental resonant frequency?',
		['50 Hz', '100 Hz', '200 Hz', '340 Hz'],
		1,
		'For an open-open pipe, λ₁ = 2L = 3.4 m, so f₁ = v / λ₁ = 340 / 3.4 = 100 Hz.',
	),
	q(
		'Q-P-E-9',
		'physics',
		'epic',
		'According to the Stefan-Boltzmann law (P ∝ T⁴), if the absolute temperature T of an ideal blackbody triples, its radiated power increases by a factor of:',
		['9', '12', '27', '81'],
		3,
		'Since radiated power scales as T⁴, tripling T multiplies power by 3⁴ = 81.',
	),
	q(
		'Q-P-E-10',
		'physics',
		'epic',
		'What is the escape velocity from a planet of mass M and radius R compared to its surface circular orbital velocity v_orb = √(GM/R)?',
		['v_orb / √2', 'v_orb', '√2 · v_orb', '2 · v_orb'],
		2,
		'Escape velocity is √(2GM/R) = √2 · v_orb.',
	),

	// Legendary (40s)
	q(
		'Q-P-L-1',
		'physics',
		'legendary',
		'A relativistic particle travels at speed v = 0.8c. What is its Lorentz factor γ = 1 / √(1 - v²/c²)?',
		['1.25', '4/3', '5/3', '2.0'],
		2,
		'√(1 - 0.8²) = √(1 - 0.64) = √0.36 = 0.6 = 3/5, so γ = 1 / (3/5) = 5/3.',
	),
	q(
		'Q-P-L-2',
		'physics',
		'legendary',
		'A Carnot heat engine operates between a hot reservoir at 600 K and a cold reservoir at 150 K. What is its maximum possible thermal efficiency?',
		['25%', '50%', '75%', '80%'],
		2,
		'η_max = 1 - T_c / T_h = 1 - 150 / 600 = 1 - 0.25 = 0.75 (75%).',
	),
	q(
		'Q-P-L-3',
		'physics',
		'legendary',
		'In the Bohr model of the hydrogen atom, the ground-state energy is -13.6 eV. What is the energy of a photon emitted in the n = 3 → n = 2 (Balmer α) transition?',
		['1.51 eV', '1.89 eV', '3.40 eV', '10.2 eV'],
		1,
		'E₂ = -13.6/4 = -3.40 eV and E₃ = -13.6/9 ≈ -1.51 eV; ΔE = 3.40 - 1.51 = 1.89 eV.',
	),
	q(
		'Q-P-L-4',
		'physics',
		'legendary',
		'A particle of mass m is confined to a 1D infinite square well of width L with ground-state energy E₁. If the well width is halved to L/2, the new ground-state energy is:',
		['E₁ / 2', '2 E₁', '4 E₁', '8 E₁'],
		2,
		'Since E_n = n²π²ℏ² / (2mL²) ∝ 1/L², halving L quadruples the energy to 4E₁.',
	),
	q(
		'Q-P-L-5',
		'physics',
		'legendary',
		'Two non-relativistic particles have the same mass m. Particle A has kinetic energy K and Particle B has kinetic energy 4K. What is the ratio of their de Broglie wavelengths λ_B / λ_A?',
		['1/4', '1/2', '2', '4'],
		1,
		'Since λ = h / p = h / √(2mK) ∝ 1/√K, quadrupling K halves the de Broglie wavelength.',
	),
	q(
		'Q-P-L-6',
		'physics',
		'legendary',
		'Which of Maxwell’s equations expresses the experimental absence of magnetic monopoles?',
		['∇ · E = ρ / ε₀', '∇ · B = 0', '∇ × E = -∂B/∂t', '∇ × B = μ₀J + μ₀ε₀ ∂E/∂t'],
		1,
		'Gauss’s law for magnetism, ∇ · B = 0, states that magnetic field lines have no point sources or sinks.',
	),
	q(
		'Q-P-L-7',
		'physics',
		'legendary',
		'According to the equipartition theorem, what is the molar heat capacity at constant volume C_V of an ideal diatomic gas at room temperature (translational + rotational modes active, vibrational frozen)?',
		['(3/2) R', '(5/2) R', '3 R', '(7/2) R'],
		1,
		'With 3 translational and 2 rotational degrees of freedom (f = 5), C_V = (f/2)R = (5/2)R.',
	),
	q(
		'Q-P-L-8',
		'physics',
		'legendary',
		'In a series RLC circuit driven at angular frequency ω, at what angular frequency ω₀ does electrical impedance reach its minimum (resonance)?',
		['1 / (RC)', '1 / √(LC)', '√(LC)', 'R / L'],
		1,
		'Inductive reactance ωL equals capacitive reactance 1/(ωC) at ω₀ = 1 / √(LC).',
	),
	q(
		'Q-P-L-9',
		'physics',
		'legendary',
		'If a non-rotating black hole’s mass M triples, how does its Schwarzschild event-horizon radius R_s = 2GM/c² change?',
		['Increases by √3', 'Triples (×3)', 'Increases by ×9', 'Decreases to 1/3'],
		1,
		'The Schwarzschild radius R_s = 2GM/c² is directly proportional to mass M.',
	),
	q(
		'Q-P-L-10',
		'physics',
		'legendary',
		'Unpolarized light of intensity I₀ passes through two ideal linear polarizers whose transmission axes are angled at 60° to each other. What is the transmitted intensity?',
		['I₀ / 8', 'I₀ / 4', '3I₀ / 8', 'I₀ / 2'],
		0,
		'The first polarizer reduces intensity to I₀/2; by Malus’s law, the second transmits (I₀/2) cos²(60°) = (I₀/2)(1/4) = I₀/8.',
	),
]

export const CHEMISTRY_QUESTIONS: QuizQuestion[] = [
	// Normal (8s)
	q(
		'Q-C-N-1',
		'chemistry',
		'normal',
		'What is the atomic number of Carbon?',
		['4', '6', '8', '12'],
		1,
		'Carbon has 6 protons in its nucleus, so its atomic number is 6.',
	),
	q(
		'Q-C-N-2',
		'chemistry',
		'normal',
		'At 25 °C, an aqueous solution with pH = 3 is:',
		['Strongly basic', 'Weakly basic', 'Neutral', 'Acidic'],
		3,
		'Any pH below 7 at 25 °C indicates an acidic solution.',
	),
	q(
		'Q-C-N-3',
		'chemistry',
		'normal',
		'What is the chemical symbol for Potassium?',
		['P', 'Po', 'Pt', 'K'],
		3,
		'Potassium has the symbol K (from Neo-Latin kalium).',
	),
	q(
		'Q-C-N-4',
		'chemistry',
		'normal',
		'How many valence electrons does a neutral Oxygen atom (Group 16) have?',
		['2', '4', '6', '8'],
		2,
		'Oxygen has electron configuration 1s² 2s² 2p⁴, giving 6 valence electrons.',
	),
	q(
		'Q-C-N-5',
		'chemistry',
		'normal',
		'Which group of the periodic table contains the noble gases (He, Ne, Ar, Kr)?',
		['Group 1', 'Group 2', 'Group 17', 'Group 18'],
		3,
		'The inert noble gases occupy Group 18.',
	),
	q(
		'Q-C-N-6',
		'chemistry',
		'normal',
		'What type of chemical bond is formed by the transfer of valence electrons from sodium (Na) to chlorine (Cl)?',
		['Ionic bond', 'Nonpolar covalent bond', 'Metallic bond', 'Hydrogen bond'],
		0,
		'Na⁺ and Cl⁻ ions attract electrostatically to form an ionic bond.',
	),
	q(
		'Q-C-N-7',
		'chemistry',
		'normal',
		'What is the phase transition directly from a solid to a gas called?',
		['Condensation', 'Deposition', 'Sublimation', 'Melting'],
		2,
		'Sublimation is the direct transition from solid to gas without passing through the liquid state.',
	),
	q(
		'Q-C-N-8',
		'chemistry',
		'normal',
		'Which subatomic particle carries a negative electric charge?',
		['Proton', 'Neutron', 'Electron', 'Alpha particle'],
		2,
		'Electrons have a charge of -1e.',
	),
	q(
		'Q-C-N-9',
		'chemistry',
		'normal',
		'What is the approximate molar mass of water (H₂O)?',
		['10 g/mol', '16 g/mol', '18 g/mol', '20 g/mol'],
		2,
		'2 × 1.0 (H) + 16.0 (O) = 18.0 g/mol.',
	),
	q(
		'Q-C-N-10',
		'chemistry',
		'normal',
		'In a redox reaction, oxidation is defined as the:',
		['Gain of electrons', 'Loss of electrons', 'Gain of protons', 'Loss of neutrons'],
		1,
		'OIL RIG: Oxidation Is Loss of electrons, Reduction Is Gain of electrons.',
	),

	// Uncommon (15s)
	q(
		'Q-C-U-1',
		'chemistry',
		'uncommon',
		'What is the oxidation state of Manganese (Mn) in the permanganate ion MnO₄⁻?',
		['+4', '+5', '+6', '+7'],
		3,
		'With four O atoms at -2 each (-8 total) and overall charge -1, Mn must be +7.',
	),
	q(
		'Q-C-U-2',
		'chemistry',
		'uncommon',
		'In the balanced reaction N₂ + 3H₂ → 2NH₃, how many moles of H₂ are required to completely produce 6 moles of NH₃?',
		['3 mol', '6 mol', '9 mol', '12 mol'],
		2,
		'The ratio of H₂ to NH₃ is 3 : 2, so 6 × (3/2) = 9 moles of H₂.',
	),
	q(
		'Q-C-U-3',
		'chemistry',
		'uncommon',
		'What is the molarity of 2.0 moles of NaCl dissolved to make 0.50 L of aqueous solution?',
		['1.0 M', '2.0 M', '4.0 M', '0.25 M'],
		2,
		'Molarity M = moles / liters = 2.0 mol / 0.50 L = 4.0 M.',
	),
	q(
		'Q-C-U-4',
		'chemistry',
		'uncommon',
		'At standard temperature and pressure (0 °C and 1 atm), 1 mole of an ideal gas occupies approximately:',
		['1.0 L', '11.2 L', '22.4 L', '44.8 L'],
		2,
		'At STP, the molar volume of an ideal gas is 22.4 L/mol.',
	),
	q(
		'Q-C-U-5',
		'chemistry',
		'uncommon',
		'According to VSEPR theory, what is the molecular geometry of methane (CH₄)?',
		['Linear', 'Trigonal planar', 'Tetrahedral', 'Octahedral'],
		2,
		'Four bonding pairs and zero lone pairs around carbon produce a tetrahedral geometry (109.5°).',
	),
	q(
		'Q-C-U-6',
		'chemistry',
		'uncommon',
		'What is the ground-state electron configuration of a neutral Chlorine atom (Z = 17)?',
		['[Ne] 3s² 3p³', '[Ne] 3s² 3p⁵', '[Ne] 3s¹ 3p⁶', '[Ar] 4s² 3p⁵'],
		1,
		'Chlorine has 17 electrons: 10 in the Neon core plus 7 valence electrons in 3s² 3p⁵.',
	),
	q(
		'Q-C-U-7',
		'chemistry',
		'uncommon',
		'If the hydronium ion concentration of a solution is [H⁺] = 1.0 × 10⁻⁹ M at 25 °C, what is its pOH?',
		['5', '7', '9', '14'],
		0,
		'pH = 9, and since pH + pOH = 14 at 25 °C, pOH = 14 - 9 = 5.',
	),
	q(
		'Q-C-U-8',
		'chemistry',
		'uncommon',
		'Which element has the highest Pauling electronegativity?',
		['Oxygen', 'Chlorine', 'Nitrogen', 'Fluorine'],
		3,
		'Fluorine is the most electronegative element (3.98 on the Pauling scale).',
	),
	q(
		'Q-C-U-9',
		'chemistry',
		'uncommon',
		'What is the empirical formula of glucose (C₆H₁₂O₆)?',
		['CHO', 'CH₂O', 'C₂H₄O₂', 'C₃H₆O₃'],
		1,
		'Dividing the subscripts 6, 12, 6 by their greatest common divisor 6 yields CH₂O.',
	),
	q(
		'Q-C-U-10',
		'chemistry',
		'uncommon',
		'A reaction with ΔH < 0 releases heat to its surroundings and is classified as:',
		['Endothermic', 'Exothermic', 'Isothermal', 'Endergonic'],
		1,
		'A negative enthalpy change (ΔH < 0) means the reaction is exothermic.',
	),

	// Epic (25s)
	q(
		'Q-C-E-1',
		'chemistry',
		'epic',
		'For a reaction with ΔH = -40 kJ/mol and ΔS = -100 J/(mol·K) at T = 300 K, what is the Gibbs free energy change ΔG = ΔH - TΔS?',
		['-70 kJ/mol', '-10 kJ/mol', '+10 kJ/mol', '+20 kJ/mol'],
		1,
		'TΔS = 300 K × (-0.100 kJ/(mol·K)) = -30 kJ/mol, so ΔG = -40 - (-30) = -10 kJ/mol.',
	),
	q(
		'Q-C-E-2',
		'chemistry',
		'epic',
		'A buffer contains 0.10 M weak acid HA (pK_a = 4.76) and 1.0 M conjugate base A⁻. By the Henderson-Hasselbalch equation, what is the pH?',
		['3.76', '4.76', '5.76', '6.76'],
		2,
		'pH = pK_a + log₁₀([A⁻]/[HA]) = 4.76 + log₁₀(10) = 4.76 + 1 = 5.76.',
	),
	q(
		'Q-C-E-3',
		'chemistry',
		'epic',
		'For rate law Rate = k[A]²[B], if [A] is tripled and [B] is halved, the initial reaction rate changes by a factor of:',
		['1.5', '3.0', '4.5', '9.0'],
		2,
		'Rate factor = 3² × (1/2) = 9 × 0.5 = 4.5.',
	),
	q(
		'Q-C-E-4',
		'chemistry',
		'epic',
		'Consider the exothermic equilibrium N₂(g) + 3H₂(g) ⇌ 2NH₃(g) (ΔH < 0). Which change shifts equilibrium toward more NH₃ product?',
		[
			'Increasing temperature',
			'Decreasing total pressure',
			'Increasing total pressure at constant T',
			'Adding an inert gas at constant volume',
		],
		2,
		'There are 4 moles of gas on the left and 2 on the right, so increasing pressure shifts equilibrium toward fewer gas moles (NH₃).',
	),
	q(
		'Q-C-E-5',
		'chemistry',
		'epic',
		'What is the hybridization of the central Xenon atom in XeF₄ (4 bonding pairs + 2 lone pairs)?',
		['sp²', 'sp³', 'sp³d', 'sp³d²'],
		3,
		'Six electron domains (steric number 6) around Xenon require octahedral sp³d² hybridization.',
	),
	q(
		'Q-C-E-6',
		'chemistry',
		'epic',
		'How many σ (sigma) and π (pi) bonds are present in a molecule of ethyne (acetylene, HC≡CH)?',
		['2 σ and 2 π', '3 σ and 2 π', '3 σ and 1 π', '4 σ and 1 π'],
		1,
		'Two C–H single bonds (2 σ) plus one C≡C triple bond (1 σ + 2 π) give 3 σ and 2 π bonds.',
	),
	q(
		'Q-C-E-7',
		'chemistry',
		'epic',
		'If the solubility product of AgCl is K_sp = 1.0 × 10⁻¹⁰ at 25 °C, what is its molar solubility in pure water?',
		['1.0 × 10⁻¹⁰ M', '1.0 × 10⁻⁵ M', '2.0 × 10⁻⁵ M', '1.0 × 10⁻³ M'],
		1,
		'For AgCl(s) ⇌ Ag⁺ + Cl⁻, K_sp = s², so s = √(1.0 × 10⁻¹⁰) = 1.0 × 10⁻⁵ M.',
	),
	q(
		'Q-C-E-8',
		'chemistry',
		'epic',
		'A first-order reaction has a half-life t_{1/2} = 20 minutes. What percentage of the reactant remains after 60 minutes?',
		['6.25%', '12.5%', '25.0%', '33.3%'],
		1,
		'60 minutes is 3 half-lives, so (1/2)³ = 1/8 = 12.5% remains.',
	),
	q(
		'Q-C-E-9',
		'chemistry',
		'epic',
		'In a galvanic cell with standard reduction potentials E°(Cu²⁺/Cu) = +0.34 V and E°(Zn²⁺/Zn) = -0.76 V, what is the standard cell potential E°_cell?',
		['+0.42 V', '-0.42 V', '+1.10 V', '+1.44 V'],
		2,
		'E°_cell = E°_cathode - E°_anode = 0.34 V - (-0.76 V) = +1.10 V.',
	),
	q(
		'Q-C-E-10',
		'chemistry',
		'epic',
		'Which set of quantum numbers (n, l, m_l, m_s) is NOT valid for an electron in an atom?',
		['(3, 2, -1, +1/2)', '(2, 1, 0, -1/2)', '(2, 2, 0, +1/2)', '(4, 3, -3, -1/2)'],
		2,
		'The azimuthal quantum number l must satisfy 0 ≤ l ≤ n - 1, so l = 2 is impossible when n = 2.',
	),

	// Legendary (40s)
	q(
		'Q-C-L-1',
		'chemistry',
		'legendary',
		'At 25 °C, a 2-electron redox cell (n = 2) has E°_cell = 1.10 V. Using the Nernst equation E = E° - (0.0592/n) log₁₀(Q), what is E_cell when Q = 100?',
		['0.982 V', '1.041 V', '1.100 V', '1.159 V'],
		1,
		'E = 1.10 - (0.0592 / 2) × log₁₀(100) = 1.10 - 0.0296 × 2 = 1.0408 V ≈ 1.041 V.',
	),
	q(
		'Q-C-L-2',
		'chemistry',
		'legendary',
		'According to molecular orbital (MO) theory, what is the bond order of the superoxide ion O₂⁻?',
		['1.0', '1.5', '2.0', '2.5'],
		1,
		'Neutral O₂ has bond order 2.0; adding one electron into a π* antibonding orbital reduces the bond order by 0.5 to 1.5.',
	),
	q(
		'Q-C-L-3',
		'chemistry',
		'legendary',
		'In an electrolysis cell, a steady current passes 4 Faradays of charge through molten AlCl₃ (Al³⁺ + 3e⁻ → Al). How many moles of metallic Aluminum are deposited?',
		['0.75 mol', '1.33 mol', '3.00 mol', '4.00 mol'],
		1,
		'Each mole of Al³⁺ requires 3 moles of electrons (3 F), so 4 F deposits 4/3 ≈ 1.33 mol of Al.',
	),
	q(
		'Q-C-L-4',
		'chemistry',
		'legendary',
		'An octahedral d⁶ transition-metal complex with a strong-field ligand (low-spin configuration) has how many unpaired electrons?',
		['0', '2', '4', '6'],
		0,
		'In a low-spin octahedral d⁶ complex, all 6 d-electrons pair up in the three lower-energy t₂g orbitals, leaving 0 unpaired electrons.',
	),
	q(
		'Q-C-L-5',
		'chemistry',
		'legendary',
		'Assuming complete dissociation (van ’t Hoff factor i = 3), what is the freezing-point depression ΔT_f of a 0.50 m aqueous CaCl₂ solution (K_f = 1.86 °C/m)?',
		['0.93 °C', '1.86 °C', '2.79 °C', '3.72 °C'],
		2,
		'ΔT_f = i · K_f · m = 3 × 1.86 × 0.50 = 2.79 °C.',
	),
	q(
		'Q-C-L-6',
		'chemistry',
		'legendary',
		'For a second-order reaction 2A → Products with rate law Rate = k[A]², a linear plot is obtained by graphing which quantity versus time t?',
		['[A]', 'ln[A]', '1 / [A]', '[A]²'],
		2,
		'The integrated second-order rate law is 1/[A]_t = kt + 1/[A]₀, so 1/[A] vs t is linear with slope +k.',
	),
	q(
		'Q-C-L-7',
		'chemistry',
		'legendary',
		'By Hückel’s 4n + 2 rule, which of the following planar conjugated ring species is aromatic?',
		[
			'Cyclobutadiene (4 π e⁻)',
			'Cyclopentadienyl anion C₅H₅⁻ (6 π e⁻)',
			'Cyclopentadienyl cation C₅H₅⁺ (4 π e⁻)',
			'Planar cyclooctatetraene (8 π e⁻)',
		],
		1,
		'C₅H₅⁻ is cyclic, planar, fully conjugated, and has 6 = 4(1) + 2 π electrons, making it aromatic.',
	),
	q(
		'Q-C-L-8',
		'chemistry',
		'legendary',
		'For the gas-phase reaction N₂O₄(g) ⇌ 2NO₂(g), how is the pressure equilibrium constant K_p related to the concentration constant K_c at absolute temperature T?',
		['K_p = K_c / (RT)', 'K_p = K_c', 'K_p = K_c (RT)', 'K_p = K_c (RT)²'],
		2,
		'Since Δn_gas = 2 - 1 = +1, K_p = K_c (RT)^(Δn) = K_c (RT).',
	),
	q(
		'Q-C-L-9',
		'chemistry',
		'legendary',
		'In an SN2 nucleophilic substitution at a single stereocenter (e.g., (R)-2-bromobutane + OH⁻), the stereochemical outcome is:',
		[
			'Complete retention of configuration',
			'Complete inversion of configuration (Walden inversion)',
			'A 50:50 racemic mixture',
			'Elimination without substitution',
		],
		1,
		'Backside nucleophilic attack in a concerted SN2 mechanism inverts the stereocenter completely.',
	),
	q(
		'Q-C-L-10',
		'chemistry',
		'legendary',
		'According to the Arrhenius equation k = A e^(-E_a / RT), adding a catalyst increases the reaction rate constant k primarily by:',
		[
			'Increasing the reaction enthalpy ΔH',
			'Shifting the equilibrium constant K_eq',
			'Lowering the activation energy E_a',
			'Increasing the gas constant R',
		],
		2,
		'A catalyst provides an alternative pathway with a lower activation energy barrier E_a without changing ΔH or K_eq.',
	),
]

export const BIOLOGY_QUESTIONS: QuizQuestion[] = [
	// Normal (8s)
	q(
		'Q-B-N-1',
		'biology',
		'normal',
		'Which organelle is the primary site of aerobic ATP synthesis in eukaryotic cells?',
		['Ribosome', 'Golgi apparatus', 'Mitochondrion', 'Lysosome'],
		2,
		'Mitochondria generate the majority of cellular ATP via oxidative phosphorylation.',
	),
	q(
		'Q-B-N-2',
		'biology',
		'normal',
		'In double-stranded DNA, Adenine (A) always forms hydrogen bonds with:',
		['Cytosine (C)', 'Guanine (G)', 'Thymine (T)', 'Uracil (U)'],
		2,
		'Watson-Crick base pairing in DNA pairs Adenine (A) with Thymine (T) via two hydrogen bonds.',
	),
	q(
		'Q-B-N-3',
		'biology',
		'normal',
		'What gas do plants release as a byproduct of the light-dependent reactions of photosynthesis?',
		['Carbon dioxide', 'Oxygen', 'Nitrogen', 'Methane'],
		1,
		'Photolysis of water in Photosystem II releases molecular oxygen (O₂).',
	),
	q(
		'Q-B-N-4',
		'biology',
		'normal',
		'How many chambers does a normal human heart have?',
		['2', '3', '4', '5'],
		2,
		'The human heart has four chambers: left and right atria, and left and right ventricles.',
	),
	q(
		'Q-B-N-5',
		'biology',
		'normal',
		'Which macromolecule class do enzymes primarily belong to?',
		['Lipids', 'Proteins', 'Polysaccharides', 'Phospholipids'],
		1,
		'Almost all biological enzymes are globular proteins (with a few catalytic RNA ribozymes).',
	),
	q(
		'Q-B-N-6',
		'biology',
		'normal',
		'What is the result of a single mitotic cell division of a diploid (2n = 46) human somatic cell?',
		[
			'Two genetically identical diploid (2n = 46) cells',
			'Four haploid (n = 23) gametes',
			'Two haploid (n = 23) cells',
			'Four diploid (2n = 46) cells',
		],
		0,
		'Mitosis produces two genetically identical diploid daughter cells.',
	),
	q(
		'Q-B-N-7',
		'biology',
		'normal',
		'Which structure is present in plant cells but absent in animal cells?',
		['Plasma membrane', 'Cellulose cell wall', 'Mitochondria', 'Nucleus'],
		1,
		'Plant cells are surrounded by a rigid cellulose cell wall.',
	),
	q(
		'Q-B-N-8',
		'biology',
		'normal',
		'Where does translation (polypeptide synthesis from mRNA) occur in the cell?',
		['Nucleolus', 'Ribosome', 'Peroxisome', 'Centrosome'],
		1,
		'Ribosomes decode mRNA codons into polypeptide chains during translation.',
	),
	q(
		'Q-B-N-9',
		'biology',
		'normal',
		'Which blood vessels carry blood away from the heart at high pressure?',
		['Veins', 'Capillaries', 'Arteries', 'Venules'],
		2,
		'Arteries have thick muscular walls to transport blood away from the heart.',
	),
	q(
		'Q-B-N-10',
		'biology',
		'normal',
		'What pigment in chloroplasts absorbs red and blue light to drive photosynthesis?',
		['Hemoglobin', 'Melanin', 'Chlorophyll', 'Keratin'],
		2,
		'Chlorophyll a and b absorb red and blue wavelengths and reflect green light.',
	),

	// Uncommon (15s)
	q(
		'Q-B-U-1',
		'biology',
		'uncommon',
		'In a Mendelian monohybrid cross between two heterozygotes (Aa × Aa), what fraction of offspring are expected to be homozygous recessive (aa)?',
		['1/8', '1/4', '1/2', '3/4'],
		1,
		'The Punnett square yields 1 AA : 2 Aa : 1 aa, so 1/4 are homozygous recessive.',
	),
	q(
		'Q-B-U-2',
		'biology',
		'uncommon',
		'If a template DNA strand reads 3′-TAC GGA-5′, what is the transcribed mRNA sequence?',
		['5′-ATG CCT-3′', '5′-AUG CCU-3′', '5′-UAC GGA-3′', '5′-UCC GUA-3′'],
		1,
		'RNA polymerase synthesizes complementary RNA antiparallel (5′→3′) using Uracil (U) instead of Thymine (T).',
	),
	q(
		'Q-B-U-3',
		'biology',
		'uncommon',
		'Which stage of cellular respiration occurs in the cytosol and does NOT require oxygen?',
		['Citric acid (Krebs) cycle', 'Glycolysis', 'Pyruvate oxidation', 'Oxidative phosphorylation'],
		1,
		'Glycolysis splits glucose into two pyruvate molecules in the cytosol under both aerobic and anaerobic conditions.',
	),
	q(
		'Q-B-U-4',
		'biology',
		'uncommon',
		'In the ABO blood group system, why is type O Rh-negative (O⁻) considered the universal red blood cell donor?',
		[
			'Its red blood cells lack A, B, and Rh(D) surface antigens',
			'Its plasma lacks all antibodies',
			'It expresses both A and B antigens',
			'It contains extra platelets',
		],
		0,
		'Without A, B, or Rh(D) antigens on the erythrocyte surface, recipient antibodies do not agglutinate the donor cells.',
	),
	q(
		'Q-B-U-5',
		'biology',
		'uncommon',
		'During DNA replication, which enzyme unwinds the parental double helix ahead of the replication fork?',
		['DNA ligase', 'DNA helicase', 'RNA primase', 'DNA polymerase I'],
		1,
		'DNA helicase hydrolyzes ATP to break hydrogen bonds between base pairs and unwind the double helix.',
	),
	q(
		'Q-B-U-6',
		'biology',
		'uncommon',
		'When a red blood cell is placed into a strongly hypertonic salt solution, water moves out by osmosis and the cell:',
		['Lyses (bursts)', 'Crenates (shrivels)', 'Becomes turgid', 'Divides by mitosis'],
		1,
		'Water flows down its water potential gradient out of the cell into the hypertonic medium, causing crenation.',
	),
	q(
		'Q-B-U-7',
		'biology',
		'uncommon',
		'Which pancreatic hormone lowers blood glucose concentration by promoting cellular glucose uptake and glycogen synthesis?',
		['Glucagon', 'Cortisol', 'Insulin', 'Epinephrine'],
		2,
		'Beta cells of the pancreas secrete insulin in response to elevated blood glucose.',
	),
	q(
		'Q-B-U-8',
		'biology',
		'uncommon',
		'During which phase of meiosis do homologous chromosomes pair up as tetrads and undergo crossing over (synapsis)?',
		['Prophase I', 'Metaphase I', 'Anaphase II', 'Telophase II'],
		0,
		'Synapsis and chiasma formation between homologous non-sister chromatids occur during Prophase I.',
	),
	q(
		'Q-B-U-9',
		'biology',
		'uncommon',
		'A competitive enzyme inhibitor affects enzyme kinetics by:',
		[
			'Lowering V_max without changing apparent K_m',
			'Increasing apparent K_m without changing V_max',
			'Lowering both K_m and V_max',
			'Permanently denaturing the enzyme',
		],
		1,
		'A competitive inhibitor competes with substrate for the active site, raising apparent K_m while high [S] still reaches V_max.',
	),
	q(
		'Q-B-U-10',
		'biology',
		'uncommon',
		'Which class of lymphocytes matures in the thymus and mediates cellular immunity?',
		['B lymphocytes', 'T lymphocytes', 'Megakaryocytes', 'Erythrocytes'],
		1,
		'T cells mature in the thymus and recognize antigen fragments presented on MHC molecules.',
	),

	// Epic (25s)
	q(
		'Q-B-E-1',
		'biology',
		'epic',
		'In a population in Hardy-Weinberg equilibrium, 9% of individuals express a recessive trait (q² = 0.09). What percentage of the population are heterozygous carriers (2pq)?',
		['21%', '42%', '49%', '84%'],
		1,
		'q = √0.09 = 0.3 and p = 1 - 0.3 = 0.7, so 2pq = 2(0.7)(0.3) = 0.42 (42%).',
	),
	q(
		'Q-B-E-2',
		'biology',
		'epic',
		'During the rising (depolarization) phase of a neuronal action potential, the membrane potential rapidly becomes positive primarily due to:',
		[
			'Efflux of K⁺ through voltage-gated K⁺ channels',
			'Influx of Na⁺ through voltage-gated Na⁺ channels',
			'Influx of Cl⁻ ions',
			'Action of the Na⁺/K⁺-ATPase pump alone',
		],
		1,
		'Opening of fast voltage-gated Na⁺ channels drives Na⁺ into the axon, depolarizing the membrane toward E_Na.',
	),
	q(
		'Q-B-E-3',
		'biology',
		'epic',
		'In the E. coli lac operon, when lactose is present and glucose is absent, transcription is high because:',
		[
			'Allolactose binds the repressor (inactivating it) and high cAMP activates CAP',
			'Glucose binds the operator directly',
			'The repressor binds tightly to the operator',
			'RNA polymerase is degraded',
		],
		0,
		'Allolactose removes the lac repressor from the operator while low glucose raises cAMP, allowing cAMP-CAP to recruit RNA polymerase.',
	),
	q(
		'Q-B-E-4',
		'biology',
		'epic',
		'In the Calvin cycle, which enzyme catalyzes the fixation of CO₂ onto ribulose-1,5-bisphosphate (RuBP)?',
		['PEP carboxylase', 'RuBisCO', 'Hexokinase', 'ATP synthase'],
		1,
		'Ribulose-1,5-bisphosphate carboxylase-oxygenase (RuBisCO) catalyzes the primary carbon-fixation step.',
	),
	q(
		'Q-B-E-5',
		'biology',
		'epic',
		'According to the Bohr effect in human physiology, a decrease in blood pH (higher CO₂ in active tissues) shifts the oxygen-hemoglobin dissociation curve to the:',
		[
			'Left, increasing O₂ affinity',
			'Right, promoting O₂ unloading to tissues',
			'Top, doubling hemoglobin concentration',
			'Bottom, destroying heme groups',
		],
		1,
		'Lower pH and higher pCO₂ stabilize the deoxy (T) state of hemoglobin, shifting the curve right (higher P₅₀) to release O₂.',
	),
	q(
		'Q-B-E-6',
		'biology',
		'epic',
		'On the lagging strand during eukaryotic DNA replication, short Okazaki fragments are joined into a continuous phosphodiester backbone by:',
		['Topoisomerase II', 'DNA ligase', 'Telomerase', 'Single-strand binding protein'],
		1,
		'After RNA primers are replaced with DNA nucleotides, DNA ligase seals the nicks in the sugar-phosphate backbone.',
	),
	q(
		'Q-B-E-7',
		'biology',
		'epic',
		'Which antibody isotype is the most abundant in human serum and is the only class capable of crossing the placenta to provide passive fetal immunity?',
		['IgA', 'IgE', 'IgG', 'IgM'],
		2,
		'Monomeric IgG constitutes ~75% of serum immunoglobulins and crosses the placenta via FcRn receptors.',
	),
	q(
		'Q-B-E-8',
		'biology',
		'epic',
		'In eukaryotic pre-mRNA processing, spliceosomes remove non-coding sequences called:',
		['Exons', 'Introns', 'Promoters', '5′ methylguanosine caps'],
		1,
		'Introns are excised by the spliceosome while coding exons are ligated together.',
	),
	q(
		'Q-B-E-9',
		'biology',
		'epic',
		'In the mitochondrial electron transport chain, what molecule serves as the terminal electron acceptor, being reduced to H₂O at Complex IV?',
		['NAD⁺', 'FAD', 'Molecular oxygen (O₂)', 'Cytochrome c'],
		2,
		'Cytochrome c oxidase (Complex IV) transfers electrons to O₂, reducing it with protons to form water.',
	),
	q(
		'Q-B-E-10',
		'biology',
		'epic',
		'In a dihybrid cross between two doubly heterozygous individuals (AaBb × AaBb) with unlinked, independently assorting genes, what fraction of offspring show both dominant phenotypes (A_B_)?',
		['3/16', '6/16', '9/16', '12/16'],
		2,
		'By independent assortment, P(A_) × P(B_) = (3/4) × (3/4) = 9/16.',
	),

	// Legendary (40s)
	q(
		'Q-B-L-1',
		'biology',
		'legendary',
		'An enzyme follows Michaelis-Menten kinetics (v = V_max [S] / (K_m + [S])) with K_m = 2 mM. At substrate concentration [S] = 6 mM, what fraction of V_max is the initial reaction velocity v?',
		['25%', '50%', '75%', '80%'],
		2,
		'v / V_max = 6 / (2 + 6) = 6 / 8 = 0.75 (75%).',
	),
	q(
		'Q-B-L-2',
		'biology',
		'legendary',
		'In a testcross of a dihybrid (AaBb × aabb) producing 1000 progeny, 420 are Aabb, 420 are aaBb, 80 are AaBb, and 80 are aabb. What is the genetic map distance between loci A and B?',
		['8 cM', '16 cM', '32 cM', '42 cM'],
		1,
		'The recombinant classes are the two rarest (80 + 80 = 160); recombination frequency = 160 / 1000 = 16% = 16 centiMorgans (cM).',
	),
	q(
		'Q-B-L-3',
		'biology',
		'legendary',
		'If a chemical uncoupler (such as 2,4-dinitrophenol) makes the inner mitochondrial membrane permeable to protons (H⁺), what happens to electron transport (O₂ consumption) and ATP synthesis?',
		[
			'Both O₂ consumption and ATP synthesis stop',
			'O₂ consumption increases while ATP synthesis drops sharply',
			'Both O₂ consumption and ATP synthesis increase',
			'O₂ consumption stops while ATP synthesis increases',
		],
		1,
		'Dissipating the proton-motive force uncouples ATP synthase (halting oxidative ATP synthesis) while removing back-pressure on the ETC, accelerating O₂ consumption and heat release.',
	),
	q(
		'Q-B-L-4',
		'biology',
		'legendary',
		'In Streptococcus pyogenes CRISPR-Cas9 genome editing, Cas9 endonuclease cleavage requires that the target DNA sequence be immediately followed on the non-target strand by which PAM motif?',
		['5′-TTT-3′', '5′-NGG-3′', '5′-AATAAA-3′', '5′-TATA-3′'],
		1,
		'SpCas9 recognizes the canonical 5′-NGG-3′ Protospacer Adjacent Motif (PAM) before unwinding and cleaving target DNA.',
	),
	q(
		'Q-B-L-5',
		'biology',
		'legendary',
		'A circular plasmid of 10 kb is digested with restriction enzyme EcoRI alone to yield fragments of 6 kb and 4 kb. How many EcoRI recognition sites are present on this circular plasmid?',
		['1', '2', '3', '4'],
		1,
		'Cutting a circular DNA molecule n times yields n fragments; 2 fragments (6 kb + 4 kb = 10 kb) require 2 cleavage sites.',
	),
	q(
		'Q-B-L-6',
		'biology',
		'legendary',
		'In epigenetic gene regulation, acetylation of lysine residues on histone tails by histone acetyltransferases (HATs) generally promotes transcription by:',
		[
			'Adding positive charges to histones to condense heterochromatin',
			'Neutralizing lysine positive charges, loosening DNA-histone attraction into euchromatin',
			'Methylating CpG islands directly on the DNA',
			'Degrading RNA polymerase II',
		],
		1,
		'Histone lysine acetylation neutralizes the positively charged NH₃⁺ group, reducing electrostatic binding to negatively charged DNA.',
	),
	q(
		'Q-B-L-7',
		'biology',
		'legendary',
		'Using the Nernst potential equation at 37 °C (E_ion ≈ (61 mV / z) log₁₀([ion]_out / [ion]_in)), what is the equilibrium potential E_K for K⁺ (z = +1) if [K⁺]_out = 15 mM and [K⁺]_in = 150 mM?',
		['+61 mV', '-61 mV', '-122 mV', '0 mV'],
		1,
		'log₁₀(15 / 150) = log₁₀(0.1) = -1, so E_K = (61 mV / 1) × (-1) = -61 mV.',
	),
	q(
		'Q-B-L-8',
		'biology',
		'legendary',
		'In C4 plants (such as maize and sugarcane), photorespiration is minimized by initially fixing CO₂ in mesophyll cells via PEP carboxylase into a 4-carbon acid and then:',
		[
			'Releasing O₂ in the roots at night',
			'Decarboxylating it in bundle-sheath cells to concentrate CO₂ around RuBisCO',
			'Replacing RuBisCO completely with ATP synthase',
			'Performing the Calvin cycle only in the dark',
		],
		1,
		'C4 spatial separation pumps 4-carbon malate/aspartate into bundle-sheath cells, maintaining high local [CO₂] around RuBisCO.',
	),
	q(
		'Q-B-L-9',
		'biology',
		'legendary',
		'In the vertebrate adaptive immune system, somatic V(D)J recombination generates vast antigen-receptor diversity by:',
		[
			'Rearranging Variable, Diversity, and Joining gene segments via RAG1/RAG2 recombinases in developing lymphocytes',
			'Transcribing all antibodies from a single unedited mRNA via alternative polyadenylation',
			'Horizontal gene transfer from commensal bacteria',
			'Duplicating the entire chromosome 14 during mitosis',
		],
		0,
		'RAG1/RAG2 enzymes cleave and rejoin V, D, and J gene segments in developing B and T cells, creating unique antigen-binding regions.',
	),
	q(
		'Q-B-L-10',
		'biology',
		'legendary',
		'In quantitative PCR (RT-qPCR), assuming 100% amplification efficiency (doubling each cycle), sample A has a threshold cycle Ct = 21 and sample B has Ct = 24. Sample A had how many times more starting template than sample B?',
		['3 times more', '6 times more', '8 times more', '16 times more'],
		2,
		'A ΔCt of 24 - 21 = 3 cycles corresponds to 2³ = 8 times more initial template in sample A.',
	),
]

export const QUESTION_BANK: QuizQuestion[] = [
	...MATHS_QUESTIONS,
	...PHYSICS_QUESTIONS,
	...CHEMISTRY_QUESTIONS,
	...BIOLOGY_QUESTIONS,
]

export const QUESTIONS_BY_ID = new Map<string, QuizQuestion>(QUESTION_BANK.map((question) => [question.id, question]))

const QUESTION_INDEX_BY_ID = new Map<string, number>(QUESTION_BANK.map((question, idx) => [question.id, idx]))

function hashQuestionId(id: string): number {
	let h = 2166136261
	for (let i = 0; i < id.length; i++) {
		h ^= id.charCodeAt(i)
		h = Math.imul(h, 16777619)
	}
	return h >>> 0
}

/**
 * Deterministically shuffles a question's 4 choices for a given match seed using the seeded RNG
 * and updates `correctIndex` to point to the relocated correct answer.
 */
export function shuffleQuestionChoices(
	question: QuizQuestion,
	seed: number,
	customCounter?: number,
): {question: QuizQuestion; nextCounter: number} {
	const qIdx = QUESTION_INDEX_BY_ID.get(question.id) ?? hashQuestionId(question.id)
	const mixedSeed = (Math.imul(seed + 1, 0x9e3779b9) ^ Math.imul(qIdx + 1, 0x85ebca6b)) | 0
	const baseCounter = customCounter ?? qIdx * 4
	const {shuffled: perm, nextCounter} = seededShuffle([0, 1, 2, 3] as const, mixedSeed, baseCounter)

	const choices: [string, string, string, string] = [
		question.choices[perm[0]],
		question.choices[perm[1]],
		question.choices[perm[2]],
		question.choices[perm[3]],
	]
	const correctIndex = perm.indexOf(question.correctIndex) as 0 | 1 | 2 | 3

	return {
		question: {
			...question,
			choices,
			correctIndex,
		},
		nextCounter,
	}
}

export function getQuestionsBySubjectAndRarity(subject: Subject, rarity: Rarity): QuizQuestion[] {
	return QUESTION_BANK.filter((qItem) => qItem.subject === subject && qItem.rarity === rarity)
}

export function getQuestionById(id: string, seed?: number): QuizQuestion | undefined {
	const base = QUESTIONS_BY_ID.get(id)
	if (!base) return undefined
	if (seed === undefined) return base
	return shuffleQuestionChoices(base, seed).question
}

/**
 * Resolves the effective QuizQuestion for a CardInstance, applying per-match shuffled choices
 * and updated correctIndex when present on the card or when a match seed is provided.
 */
export function resolveCardQuestion(
	card: Pick<CardInstance, 'boundQuestionId' | 'boundChoices' | 'boundCorrectIndex'>,
	seed?: number,
	fallbackQuestionId?: string,
): QuizQuestion | undefined {
	const qId = fallbackQuestionId || card.boundQuestionId || ''
	if (!qId) return undefined
	const base = QUESTIONS_BY_ID.get(qId)
	if (!base) return undefined

	if (card.boundChoices && card.boundCorrectIndex !== undefined) {
		return {
			...base,
			choices: card.boundChoices,
			correctIndex: card.boundCorrectIndex,
		}
	}

	if (seed !== undefined) {
		return shuffleQuestionChoices(base, seed).question
	}

	return base
}

/**
 * Deterministically binds a unique QuizQuestion (matching card.subject and card.rarity)
 * to every card in both players' 24-card decks at battle start, and shuffles each
 * question's 4 choices using the seeded RNG.
 */
export function bindQuestionsToMatchDecks(
	deck0: CardInstance[],
	deck1: CardInstance[],
	seed: number,
	rngCounter: number,
): {
	deck0: CardInstance[]
	deck1: CardInstance[]
	nextCounter: number
} {
	let currCounter = rngCounter
	const pools = new Map<string, QuizQuestion[]>()

	for (const subject of SUBJECT_LIST) {
		for (const rarity of RARITY_LIST) {
			const key = `${subject}:${rarity}`
			const matching = getQuestionsBySubjectAndRarity(subject, rarity)
			const {shuffled, nextCounter} = seededShuffle(matching, seed, currCounter)
			currCounter = nextCounter
			pools.set(key, shuffled)
		}
	}

	const cursorByKey = new Map<string, number>()
	const assignQuestion = (card: CardInstance): CardInstance => {
		const key = `${card.subject}:${card.rarity}`
		const pool = pools.get(key) || []
		const idx = cursorByKey.get(key) || 0
		cursorByKey.set(key, idx + 1)
		const picked = pool[idx % Math.max(1, pool.length)]
		if (!picked) return card
		const {question: shuffledQ, nextCounter} = shuffleQuestionChoices(picked, seed, currCounter)
		currCounter = nextCounter
		return {
			...card,
			boundQuestionId: shuffledQ.id,
			boundChoices: shuffledQ.choices,
			boundCorrectIndex: shuffledQ.correctIndex,
		}
	}

	const nextDeck0 = deck0.map(assignQuestion)
	const nextDeck1 = deck1.map(assignQuestion)

	return {
		deck0: nextDeck0,
		deck1: nextDeck1,
		nextCounter: currCounter,
	}
}
