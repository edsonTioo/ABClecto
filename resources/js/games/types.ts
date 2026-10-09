export interface TriviaQuestion {
    question: string;
    options: string[];
    correct: string;
}

export interface ActivityConfig {
    words?: string[];
    grid?: number;
    letters?: string[];
    word?: string;
    sentence?: string;
    items?: { prompt: string; answer: string; options: string[] }[];
    pairs?: { emoji: string; word: string }[];
    title?: string;
    text?: string;
    questions?: TriviaQuestion[];
}

export interface Activity {
    id: number;
    level_id?: number;
    difficulty: number;
    level_number: number;
    level_title: string;
    xp_reward: number;
    coins_reward: number;
    config: ActivityConfig;
    /** Mejor puntaje guardado del estudiante en este nivel. */
    best_score?: number;
    /** Desbloqueo calculado en el servidor (sobrevive a la recarga). */
    unlocked?: boolean;
}

export interface Minigame {
    id: number;
    slug: string;
    name: string;
    description: string;
    icon: string;
    activities: Activity[];
}

export interface Player {
    name: string;
    xp: number;
    coins: number;
    level: number;
    streak: number;
}

/** Un error concreto: letra/sílaba/palabra que falló el niño. */
export interface GameError {
    type: 'letra' | 'vocal' | 'consonante' | 'silaba' | 'palabra' | 'comprension';
    value: string;
    kind?: string;
}

/** Resultado que cada minijuego reporta al hub. */
export interface GameResult {
    correct: number;
    total: number;
    /** Pistas/errores cometidos (afecta las estrellas). */
    mistakes: number;
    /** Detalle de fallos → se persiste en error_logs (reporte del profesor). */
    errors?: GameError[];
}

export interface GameProps {
    activity: Activity;
    onFinished: (result: GameResult) => void;
}
