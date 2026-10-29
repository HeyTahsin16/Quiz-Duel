import {audioManager} from '../../audio/audioManager'
import {FlatBanner, FlatButton, FlatPanel} from '../components/FlatUi'

export interface TitleScreenProps {
	onStartSelect: () => void
	onOpenCollection: () => void
	onOpenSettings: () => void
	onOpenCredits: () => void
}

export function TitleScreen({onStartSelect, onOpenCollection, onOpenSettings, onOpenCredits}: TitleScreenProps) {
	return (
		<div className="relative flex h-dvh w-full items-center justify-center overflow-hidden bg-[#0e1320] px-4 py-2">
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

			{/* Single Centered Main Menu Box (Fits completely within mobile landscape without scrolling) */}
			<div className="relative z-10 w-full max-w-[380px]">
				<FlatPanel
					variant="silver"
					wellVariant="dark"
					wellClassName="flex flex-col items-stretch gap-2.5 p-4 sm:gap-3.5 sm:p-6"
				>
					<div className="mb-0.5 text-center sm:mb-1">
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
						className="w-full justify-center py-2 text-xs sm:py-3 sm:text-sm"
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
						className="w-full justify-center py-2 text-xs sm:py-3 sm:text-sm"
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
						className="w-full justify-center py-2 text-xs sm:py-3 sm:text-sm"
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
						className="w-full justify-center py-2 text-xs sm:py-3 sm:text-sm"
					>
						CREDITS
					</FlatButton>
				</FlatPanel>
			</div>
		</div>
	)
}
