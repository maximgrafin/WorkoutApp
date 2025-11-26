import { ChangeDetectionStrategy, Component, signal, computed } from '@angular/core';

// --- Configuration Constants ---
const WORK_DURATION = 45; // seconds
const REST_DURATION = 30; // seconds

// Define the initial list of exercises. This list will be shuffled dynamically.
const INITIAL_EXERCISE_LIST = [
    { name: "Plank", explanation: "Hold the push-up position on forearms, maintaining a straight line from head to heels.", muscles: "Deep Core, Stabilizers", isPaired: false },
    { name: "Bicycle Crunches", explanation: "Lie on back, hands behind head. Alternately bring elbow to opposite knee while extending the other leg.", muscles: "Abs, Obliques", isPaired: false },
    { name: "Side Plank (Right)", explanation: "Lie on right side, support weight on right forearm, lift hips until the body forms a straight line.", muscles: "Obliques, Core Stability", isPaired: true, pair: "Side Plank (Left)" },
    { name: "Side Plank (Left)", explanation: "Lie on left side, support weight on left forearm, lift hips until the body forms a straight line.", muscles: "Obliques, Core Stability", isPaired: true, pair: "Side Plank (Right)" },
    { name: "Hollow Hold", explanation: "Lie on back, lift head, shoulders, and legs slightly off the ground, forming a 'boat' or 'banana' shape.", muscles: "Deep Abdominals", isPaired: false },
    { name: "Mountain Climbers", explanation: "Start in a high plank. Alternately bring knees towards the chest in a running motion.", muscles: "Core, Abs, Cardio", isPaired: false },
    { name: "Superman", explanation: "Lie face down, extend arms forward. Simultaneously lift arms, chest, and legs off the floor. Hold and lower.", muscles: "Lower Back (Erector Spinae), Glutes", isPaired: false },
    { name: "Flutter Kicks", explanation: "Lie on back. Perform small, rapid, alternating vertical kicks with the legs.", muscles: "Lower Abdominals", isPaired: false },
    { name: "Bird Dog", explanation: "Start on all fours. Extend left arm forward and right leg backward. Alternate sides.", muscles: "Core Stability, Low Back", isPaired: false },
    { name: "Reverse Crunch", explanation: "Lie on back, knees bent. Engage abs to lift hips off the floor, curling knees toward the chest. Lower slowly.", muscles: "Lower Abdominals", isPaired: false },
    { name: "Russian Twist", explanation: "Sit with knees bent, lean back, and twist torso side to side, touching hands to the floor.", muscles: "Obliques, Rotational Core", isPaired: false },
    { name: "Plank (Repeat)", explanation: "Final push! Hold the push-up position on forearms.", muscles: "Deep Core, Stabilizers", isPaired: false },
];

const LIST_LENGTH = INITIAL_EXERCISE_LIST.length; // 12
const TOTAL_WORK_PHASES = LIST_LENGTH; // 12
const TOTAL_REST_PHASES = LIST_LENGTH - 1; // 11
const TOTAL_DURATION = (TOTAL_WORK_PHASES * WORK_DURATION) + (TOTAL_REST_PHASES * REST_DURATION); // 870s (14:30)
const LAST_PHASE = (TOTAL_WORK_PHASES * 2) - 1; // 23

// --- Utility Functions ---

/** Standard Fisher-Yates shuffle algorithm. */
function shuffleArray(array: any[]): any[] {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

/**
 * Shuffles the exercises while keeping the start/end exercises fixed
 * and ensuring paired exercises (like Side Planks) remain adjacent and
 * are inserted randomly to break up the sequence of unpaired exercises.
 */
function shuffleExercises(): typeof INITIAL_EXERCISE_LIST {
    const list = [...INITIAL_EXERCISE_LIST];

    const firstExercise = list[0];
    const lastExercise = list[list.length - 1];

    let shufflableList = list.slice(1, -1); // 10 exercises

    const unpaired = shufflableList.filter(e => !e.isPaired);
    const sidePlankR = shufflableList.find(e => e.name === 'Side Plank (Right)');
    const sidePlankL = shufflableList.find(e => e.name === 'Side Plank (Left)');

    let pairedBlock: any[] = [];
    if (sidePlankR && sidePlankL) {
        pairedBlock = Math.random() > 0.5 ? [sidePlankR, sidePlankL] : [sidePlankL, sidePlankR];
    }
    
    shuffleArray(unpaired);

    const insertionIndex = Math.floor(Math.random() * (unpaired.length + 1)); 
    unpaired.splice(insertionIndex, 0, ...pairedBlock);
    
    const finalShuffledMiddle = unpaired;

    return [firstExercise, ...finalShuffledMiddle, lastExercise] as typeof INITIAL_EXERCISE_LIST;
}

/** Formats seconds into MM:SS string. */
function formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
    public readonly TOTAL_DURATION = TOTAL_DURATION;
    public readonly TOTAL_WORK_PHASES = TOTAL_WORK_PHASES;
    public readonly LAST_PHASE = LAST_PHASE;

    private shuffledExercises = signal(shuffleExercises());

    // --- State Signals ---
    currentPhaseIndex = signal(0);
    timeLeft = signal(WORK_DURATION);
    isPaused = signal(false);
    elapsedTime = signal(0);
    pauseTimeTracker = signal(0);
    statusMessage = signal("Click Start Workout to begin!");
    isWorkoutStarted = signal(false);
    isWorkoutComplete = signal(false);

    // --- Internal Timer Management ---
    private timerId: any = null;
    private pauseTimerId: any = null;

    // --- Computed Signals (Derived State) ---

    isWorkPeriod = computed(() => this.currentPhaseIndex() % 2 === 0);
    
    currentExercise = computed(() => {
        const index = Math.floor(this.currentPhaseIndex() / 2);
        return this.shuffledExercises()[index];
    });

    nextExercise = computed(() => {
        const index = Math.floor(this.currentPhaseIndex() / 2) + 1;
        return this.shuffledExercises()[index];
    });

    headerTitle = computed(() => {
        if (!this.isWorkoutStarted() || this.isWorkoutComplete()) {
            return `Core & Back Workout (${this.formatTime(this.TOTAL_DURATION)} Total)`;
        }
        
        const exerciseNum = Math.floor(this.currentPhaseIndex() / 2) + 1;

        if (this.isWorkPeriod()) {
            return `EXERCISE ${exerciseNum} / ${this.TOTAL_WORK_PHASES}: ${this.currentExercise()?.name}`;
        } else {
            return `REST: Next Up - ${this.nextExercise()?.name || 'Cool Down'}`;
        }
    });

    timerDisplay = computed(() => {
        if (this.isWorkoutComplete()) return "DONE";
        return formatTime(this.timeLeft());
    });
    
    totalTimeRemainingDisplay = computed(() => {
        const remaining = this.TOTAL_DURATION - this.elapsedTime();
        return formatTime(Math.max(0, remaining));
    });

    roundInfo = computed(() => {
        if (!this.isWorkoutStarted()) return "Ready";
        if (this.isWorkoutComplete()) return `Total Time: ${this.formatTime(this.TOTAL_DURATION)}`;
        
        const exerciseNum = Math.floor(this.currentPhaseIndex() / 2) + 1;
        
        if (this.isWorkPeriod()) {
            return `Round ${exerciseNum} of ${this.TOTAL_WORK_PHASES}`;
        } else {
            return `Transition to next exercise`;
        }
    });

    pauseButtonText = computed(() => {
        if (this.isPaused()) {
            return `RESUME (Paused: ${this.formatTime(this.pauseTimeTracker())})`;
        }
        return this.isWorkPeriod() ? `Pause (${this.formatTime(this.timeLeft())})` : `Pause Rest (${this.formatTime(this.timeLeft())})`;
    });

    formatTime(seconds: number): string {
        return formatTime(seconds);
    }

    // --- Logic Methods ---

    private calculateElapsedTimeAtPhaseStart(phaseIndex: number): number {
        let totalTime = 0;
        for (let i = 0; i < phaseIndex; i++) {
            totalTime += (i % 2 === 0) ? WORK_DURATION : REST_DURATION;
        }
        return totalTime;
    }

    private tick = () => {
        if (this.isPaused() || this.isWorkoutComplete()) {
            this.timerId = null;
            return;
        }

        this.elapsedTime.update(e => e + 1);
        this.timeLeft.update(t => t - 1);
        
        if (this.timeLeft() <= 0) {
            this.currentPhaseIndex.update(i => i + 1);
            this.timeLeft.set(0);
            this.runStep();
            return;
        }

        this.timerId = setTimeout(this.tick, 1000);
    };

    private tickPause = () => {
        this.pauseTimeTracker.update(p => p + 1);
    }

    private runStep() {
        clearTimeout(this.timerId);

        if (this.currentPhaseIndex() >= this.LAST_PHASE) {
            this.isWorkoutComplete.set(true);
            this.isWorkoutStarted.set(false);
            this.statusMessage.set("🥳 Workout Complete! Amazing job!");
            this.timeLeft.set(0);
            return;
        }
        
        const isWork = this.isWorkPeriod();
        const duration = isWork ? WORK_DURATION : REST_DURATION;

        if (isWork) {
            this.statusMessage.set("Focus on maintaining excellent form throughout the set.");
        } else {
            this.statusMessage.set("Get into position for the next exercise quickly.");
        }

        if (this.timeLeft() === 0) {
            this.timeLeft.set(duration);
        }

        this.timerId = setTimeout(this.tick, 1000);
    }

    startWorkout() {
        if (this.isWorkoutComplete() || !this.isWorkoutStarted()) {
            this.shuffledExercises.set(shuffleExercises());
        }

        this.currentPhaseIndex.set(0);
        this.timeLeft.set(WORK_DURATION);
        this.isPaused.set(false);
        this.elapsedTime.set(0);
        this.pauseTimeTracker.set(0);
        this.isWorkoutComplete.set(false);
        this.isWorkoutStarted.set(true);

        clearTimeout(this.timerId);
        clearInterval(this.pauseTimerId);

        this.runStep();
    }

    pauseResume() {
        this.isPaused.update(p => !p);

        if (this.isPaused()) {
            clearTimeout(this.timerId);
            this.statusMessage.set("⏸️ Workout Paused");
            this.pauseTimerId = setInterval(this.tickPause, 1000);
        } else {
            clearInterval(this.pauseTimerId);
            this.pauseTimeTracker.set(0);
            this.runStep();
        }
    }

    skipPhase(type: 'work' | 'rest') {
        this.elapsedTime.update(e => e + this.timeLeft());
        this.currentPhaseIndex.update(i => i + 1);
        this.timeLeft.set(0);

        this.isPaused.set(false);
        clearInterval(this.pauseTimerId);
        this.pauseTimeTracker.set(0);

        this.runStep();
    }

    goBack() {
        if (!this.isPaused()) return;
        
        let currentPhaseIndex = this.currentPhaseIndex();
        let newPhaseIndex: number;

        if (currentPhaseIndex === 0) {
            newPhaseIndex = 0;
        } else if (currentPhaseIndex % 2 === 1) { 
            newPhaseIndex = currentPhaseIndex - 1;
        } else {
            newPhaseIndex = Math.max(0, currentPhaseIndex - 2);
        }

        this.currentPhaseIndex.set(newPhaseIndex);

        this.elapsedTime.set(this.calculateElapsedTimeAtPhaseStart(newPhaseIndex));
        this.timeLeft.set(WORK_DURATION);

        this.isPaused.set(false);
        clearInterval(this.pauseTimerId);
        this.pauseTimeTracker.set(0);

        this.runStep();
    }
}
