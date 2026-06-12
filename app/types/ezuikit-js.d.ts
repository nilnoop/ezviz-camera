declare module "ezuikit-js" {
	export interface EZUIKitEventEmitter {
		on(eventName: string, handler: (payload?: unknown) => void): void;
		off(eventName: string, handler: (payload?: unknown) => void): void;
	}

	export interface EZUIKitPlayerInstance {
		destroy?: () => void;
		stop?: () => Promise<void> | void;
		eventEmitter?: EZUIKitEventEmitter;
	}

	export interface EZUIKitPlayerConstructor {
		new (options: Record<string, unknown>): EZUIKitPlayerInstance;
		EVENTS: {
			ptz?: {
				openPtz?: string;
				closePtz?: string;
				ptzSpeedChange?: string;
				ptzBtnClick?: string;
				ptzDirection?: string;
			};
			firstFrameDisplay?: string;
			play?: string;
			destroy?: string;
		};
	}

	export const EZUIKitPlayer: EZUIKitPlayerConstructor;
}
