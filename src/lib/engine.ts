// TODO:
//   default opening book
//   skill level
//   setMoveTime, setDepth, setSkill
//   expose a bindable engine-is-searching boolean from the Chess component? or from this class?
import type { Color } from '$lib/api.js';

export interface EngineOptions {
	//skill?: number, // 1-20
	moveTime?: number, // Maximum time in ms to spend on a move
	depth?: number, // Maximum depth to search per move
	color?: Color | 'both' | 'none',
	stockfishPath?: string,
};

enum State {
	Uninitialised = 'uninitialised',
	Initialising = 'initialising',
	Waiting = 'waiting',
	Searching = 'searching', // searching for the best move
};

export class Engine {
	private stockfish: Worker | undefined;
	private state = State.Uninitialised;
	private moveTime: number;
	private depth: number;
	private color: Color | 'both' | 'none';
	private stockfishPath: string;
	private externalUciCallback: ( (uci:string) => void ) | undefined = undefined;
	// Callbacks used when waiting for specific UCI messages
	private onUciOk: ( () => void ) | undefined = undefined; // "uciok" marks end of initialisation
	private onBestMove: ( (uci:string) => void ) | undefined = undefined; // "uciok", used during initialisation
	// Constructor
	constructor( options: EngineOptions = {} ) {
		this.moveTime = options.moveTime || 2000;
		this.depth = options.depth || 40;
		this.color = options.color || 'b';
		this.stockfishPath = options.stockfishPath || 'stockfish.js';
	}

	// Initialise Stockfish. Resolve promise after receiving uciok.
	init(): Promise<void> {
		return new Promise((resolve) => {
			this.state = State.Initialising;
			// NOTE: stockfish.js is not part of the npm package due to its size (1-2 MB).
			// You can find the file here: https://github.com/gtim/svelte-chess/tree/main/static
			this.stockfish = new Worker(this.stockfishPath);
			this.stockfish.addEventListener('message', (e)=>this._onUci(e) );
			this.onUciOk = () => {
				if ( this.state === State.Initialising ) {
					this.state = State.Waiting;
					this.onUciOk = undefined;
					resolve();
				}
			};
			this.stockfish.postMessage('uci');
		});
	}

	// Callback when receiving UCI messages from Stockfish.
	private _onUci( { data }: { data: string } ): void {
		const uci = data;
		if ( this.onUciOk && uci === 'uciok' ) {
			this.onUciOk();
		}
		if ( this.onBestMove && uci.slice(0,8) === 'bestmove' ) {
			this.onBestMove( uci );
		}
		if ( this.externalUciCallback ) {
			this.externalUciCallback( uci );
		}
	}
	setUciCallback( callback: (uci:string)=>void ) {
		this.externalUciCallback = callback;
	}

	getMove( fen: string ): Promise<string> {
		return new Promise((resolve) => {
			if ( ! this.stockfish )
				throw new Error('Engine not initialised');
			if ( this.state !== State.Waiting )
				throw new Error('Engine not ready (state: ' + this.state + ')');
			this.state = State.Searching;
			this.stockfish.postMessage('position fen ' + fen);
			this.stockfish.postMessage(`go depth ${this.depth} movetime ${this.moveTime}`);
			this.onBestMove = ( uci: string ) => {
				const uciArray = uci.split(' ');
				const bestMoveLan = uciArray[1];
				this.state = State.Waiting;
				this.onBestMove = undefined;
				resolve( bestMoveLan );
			};
		});
	}

	getColor() {
		return this.color;
	}

	isSearching() {
		return this.state === State.Searching;
	}

	async stopSearch() {
		return new Promise<void>((resolve) => {
			if ( ! this.stockfish )
				throw new Error('Engine not initialised');
			if ( this.state !== State.Searching )
				resolve();
			this.onBestMove = ( uci: string ) => {
				this.state = State.Waiting;
				this.onBestMove = undefined;
				resolve();
			}
			this.stockfish.postMessage('stop');
		});
	}
}
