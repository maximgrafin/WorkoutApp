import { ChangeDetectionStrategy, Component, signal, computed, inject, effect } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { SoundService } from './sound.service';
import { LanguageService, languages } from './language.service';

// --- Configuration Constants ---
const LOCAL_STORAGE_KEY_REST_DURATION = 'workout-timer-rest-duration';
const LOCAL_STORAGE_KEY_DURATION_MULTIPLIER = 'workout-timer-duration-multiplier';

interface ExerciseData {
    nameKey: string;
    explanationKey: string;
    duration: number;
    gifUrl?: string;
}

interface DisplayExercise {
    name: string;
    explanation: string;
    duration: number;
    gifUrl?: string;
}

// Define the initial list of exercises with individual durations.
const INITIAL_EXERCISE_LIST: ExerciseData[] = [
    // Warm-Up & Activation
    { nameKey: "catCow_name", explanationKey: "catCow_explanation", duration: 45, gifUrl: 'https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExMzU3OXl3cTczYmd3bWFyZ29md3l6MmVwb2VnaWM1ODRzazNidDhvMSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/JdtyfG3ZSE8iOlDs64/giphy.gif' },
    { nameKey: "birdDog_name", explanationKey: "birdDog_explanation", duration: 45, gifUrl: 'https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExcXRiZmxqNTM4OGY5bmswZXp0MnJzMWdnNGRvMW9nM21kcWpsZjd6eSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l0Nwx7Grs4AOlkTba/giphy.gif' },
    // Full-Body Strength
    { nameKey: "bodyweightSquats_name", explanationKey: "bodyweightSquats_explanation", duration: 45, gifUrl: 'https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExaWFlbGRwODE1b2tnMHNla3B1dnQ1YWx2c2pwdWM5dzZnbmtnNXl2bSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/RTNDA7OxcwuOMcCPhL/giphy.gif' },
    { nameKey: "pushUps_name", explanationKey: "pushUps_explanation", duration: 40, gifUrl: 'https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHA3Zm02OXp1c3Bjb2hpeGU5MXpreWlzbWV1MWdldjVrNHRiazM3cyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/xT0GqzRhOgrnKoTlCM/giphy.gif' },
    { nameKey: "gluteBridge_name", explanationKey: "gluteBridge_explanation", duration: 45, gifUrl: 'https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExcnozYWhwY2FnYmExYTZvMnF2dWt3bHh0eXR6aGZrdWF4ZTR1dnFuOCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/krmA7YIhRvwjJYbmrG/giphy.gif' },
    { nameKey: "superman_name", explanationKey: "superman_explanation", duration: 40, gifUrl: 'https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExMXRlbDU5dDdwaHNjenZ6c3E1OTEwMXozZmFrYmhjaDlydDMwNG5nMiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/hNng9AOyUHxvPiCUiv/giphy.gif' },
    // Core Conditioning Circuit
    { nameKey: "bicycleCrunches_name", explanationKey: "bicycleCrunches_explanation", duration: 50, gifUrl: 'https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExcXhuNHRlNHJweTU2amwxbGF0dmI4bjJtbmV4ODJiNGJvazB3ZjI3bSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/TMNCtgJGJnV8k/giphy.gif' },
    { nameKey: "reverseCrunch_name", explanationKey: "reverseCrunch_explanation", duration: 45, gifUrl: 'https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExOWtuaGdmNzBnazY2b3k3ZzF3Yzh4cGxjY2t6NG1zaWRvZHUxa3ZreCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/chMEggxfebYTvHkNNG/giphy.gif' },
    { nameKey: "hollowHold_name", explanationKey: "hollowHold_explanation", duration: 30, gifUrl: 'https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExMHhqZG9qZTdvZnQ4aWV3MmRkbXhvZHY1eHN4dDZxcnNhbHlrOTdyNSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/9XbMdlJgKXXkEtC60Q/giphy.gif' },
    { nameKey: "flutterKicks_name", explanationKey: "flutterKicks_explanation", duration: 40, gifUrl: 'https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExMW1jcDJ0Y215Nm9lajRoNG4zNzdkeTRicG90dmZjZzFkczg0dWNrYSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/jbiA1NsHa50OS2MATH/giphy.gif' },
    { nameKey: "sidePlankRight_name", explanationKey: "sidePlankRight_explanation", duration: 30, gifUrl: 'https://i.imgur.com/tor7hei.jpeg' },
    { nameKey: "sidePlankLeft_name", explanationKey: "sidePlankLeft_explanation", duration: 30, gifUrl: 'https://i.imgur.com/S8HxmGu.jpeg' },
    // Finisher
    { nameKey: "mountainClimbers_name", explanationKey: "mountainClimbers_explanation", duration: 45, gifUrl: 'https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExM2poMnN3ejBrNThzYzFzYWVxYTR5ajVsdnc5dWhpZDA2cTlwaXF4ciZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/D8PNyQTvanRe0/giphy.gif' },
    { nameKey: "russianTwist_name", explanationKey: "russianTwist_explanation", duration: 50, gifUrl: 'https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExMGdzcXNncTByOTE2eXM4Z2o5MWkxYzV5ODA5aTNkYTQweXBsZTNsZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/DfeEVAQlxq2oWfq5f5/giphy.gif' },
    { nameKey: "plank_name", explanationKey: "plank_explanation", duration: 60, gifUrl: 'https://i.imgur.com/zL1nbr9.jpeg' },
];

const LIST_LENGTH = INITIAL_EXERCISE_LIST.length;
const TOTAL_WORK_PHASES = LIST_LENGTH;
const TOTAL_REST_PHASES = LIST_LENGTH - 1;
const LAST_PHASE = (TOTAL_WORK_PHASES * 2) - 1;

// --- Utility Functions ---

/** Reads the rest duration from localStorage, with validation and a fallback. */
function getInitialRestDuration(): number {
    if (typeof window === 'undefined' || !window.localStorage) {
        return 30; // Default if localStorage is not available
    }

    const savedValue = localStorage.getItem(LOCAL_STORAGE_KEY_REST_DURATION);
    if (savedValue) {
        const duration = parseInt(savedValue, 10);
        // Validate that the stored value is a number within our allowed range.
        if (!isNaN(duration) && duration >= 10 && duration <= 60) {
            return duration;
        }
    }

    return 30; // Default if no valid value is stored
}

/** Reads the duration multiplier from localStorage, with validation and a fallback. */
function getInitialDurationMultiplier(): number {
    if (typeof window === 'undefined' || !window.localStorage) {
        return 1; // Default if localStorage is not available
    }

    const savedValue = localStorage.getItem(LOCAL_STORAGE_KEY_DURATION_MULTIPLIER);
    if (savedValue) {
        const multiplier = parseFloat(savedValue);
        // Validate that the stored value is a number within our allowed range.
        if (!isNaN(multiplier) && multiplier >= 0.5 && multiplier <= 2) {
            return multiplier;
        }
    }

    return 1; // Default if no valid value is stored
}


/** Formats seconds into MM:SS string. */
function formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

@Component({
    selector: 'app-root',
    template: `
<div class="min-h-screen flex items-center justify-center p-4">
    <!-- Main Workout Container -->
    <div class="relative w-full max-w-lg bg-white shadow-2xl rounded-xl p-6 md:p-8 text-center flex flex-col min-h-[38rem]">
        
        <!-- Mute/Unmute Button -->
        <button (click)="soundService.toggleMute()" 
                class="absolute top-4 left-4 p-2 rounded-full text-gray-500 hover:bg-gray-200 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors z-10">
            <span class="sr-only">{{ soundService.isMuted() ? dictionary()['unmute'] : dictionary()['mute'] }}</span>
            @if (soundService.isMuted()) {
                <!-- Muted Icon (Volume Off) -->
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M17 14l-4-4m0 4l4-4" />
                </svg>
            } @else {
                <!-- Unmuted Icon (Volume Up) -->
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
            }
        </button>

        @if (!isWorkoutStarted() || isWorkoutComplete()) {
            <!-- Language Switcher -->
            <div class="absolute top-4 right-4 flex items-center space-x-1 text-gray-500 z-10">
                @for (lang of languages; track lang.code; let isFirst = $first) {
                    @if (!isFirst) {
                        <div class="w-px h-4 bg-gray-300"></div>
                    }
                    <button (click)="languageService.setLanguage(lang.code)" 
                            class="px-2 py-1 rounded-md hover:bg-gray-200 transition-colors text-sm"
                            [class.text-indigo-600]="languageService.language() === lang.code"
                            [class.font-bold]="languageService.language() === lang.code">
                        {{ lang.name }}
                    </button>
                }
            </div>
        }

        <!-- HEADER -->
        <div>
            <h1 class="text-3xl font-extrabold mb-2"
                [class.text-gray-500]="isPaused()"
                [class.text-green-700]="!isPaused() && !isWorkPeriod() && isWorkoutStarted()"
                [class.text-indigo-700]="!isPaused() && (isWorkPeriod() || !isWorkoutStarted())">
                {{ headerTitle() }}
            </h1>
            @if (statusMessage()) {
                <p class="text-lg font-semibold mb-2 text-gray-600">
                    {{ statusMessage() }}
                </p>
                <div class="text-xl font-bold text-indigo-600 mb-6">
                    {{ dictionary()['total'] }} {{ formatTime(totalDuration()) }}
                </div>
            }
        </div>

        <!-- DYNAMIC CONTENT -->
        <div class="flex-grow">
            <!-- Timer Display (Visible only during workout) -->
            @if (isWorkoutStarted()) {
                <div class="rounded-lg p-4 mb-8 transition-colors duration-300"
                     [class.bg-gray-200]="isPaused()"
                     [class.bg-indigo-100]="!isPaused() && isWorkPeriod()"
                     [class.bg-green-100]="!isPaused() && !isWorkPeriod()">
                    <div class="text-7xl font-black tabular-nums"
                         [class.text-gray-800]="isPaused()"
                         [class.text-indigo-800]="!isPaused() && isWorkPeriod()"
                         [class.text-green-800]="!isPaused() && !isWorkPeriod()">
                        {{ timerDisplay() }}
                    </div>
                    <p class="text-sm mt-1"
                        [class.text-gray-600]="isPaused()"
                        [class.text-indigo-600]="!isPaused() && isWorkPeriod()"
                        [class.text-green-600]="!isPaused() && !isWorkPeriod()">{{ roundInfo() }}</p>
                    <!-- Total Time Remaining Display -->
                    <p class="text-sm mt-1 font-semibold"
                        [class.text-gray-600]="isPaused()"
                        [class.text-indigo-600]="!isPaused() && isWorkPeriod()"
                        [class.text-green-600]="!isPaused() && !isWorkPeriod()">{{ dictionary()['totalTimeLeft'] }} {{ totalTimeRemainingDisplay() }}</p>
                </div>
            }

            <!-- Pre-workout configuration and list -->
            @if (!isWorkoutStarted() || isWorkoutComplete()) {
                <!-- Start Button (Visible only when not started or completed) -->
                <button (click)="startWorkout()" 
                        class="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold text-lg hover:bg-indigo-700 transition-colors shadow-md mb-6">
                    {{ isWorkoutComplete() ? dictionary()['startOver'] : dictionary()['startWorkout'] }}
                </button>

                 <!-- Configuration Sliders -->
                 <div class="mb-6 p-4 bg-gray-100 rounded-xl space-y-4">
                    <!-- Rest Duration Configuration -->
                    <div>
                        <label for="rest-duration" class="block text-lg font-bold text-gray-800 mb-2">{{ dictionary()['restDuration'] }}</label>
                        <div class="flex items-center space-x-4">
                            <input id="rest-duration" type="range" min="10" max="60" step="5"
                                   [value]="restDuration()"
                                   (input)="onRestDurationChange($event)"
                                   class="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-indigo-600">
                            <span class="text-xl font-bold text-indigo-700 w-16 text-center">{{ restDuration() }}s</span>
                        </div>
                    </div>
                     <!-- Exercise Duration Multiplier -->
                    <div>
                        <label for="duration-multiplier" class="block text-lg font-bold text-gray-800 mb-2">{{ dictionary()['exerciseDurationMultiplier'] }}</label>
                        <div class="flex items-center space-x-4">
                            <input id="duration-multiplier" type="range" min="0.5" max="2" step="0.1"
                                   [value]="durationMultiplier()"
                                   (input)="onDurationMultiplierChange($event)"
                                   class="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-indigo-600">
                            <span class="text-xl font-bold text-indigo-700 w-16 text-center">{{ durationMultiplier().toFixed(1) }}x</span>
                        </div>
                    </div>
                </div>

                <div class="border border-gray-200 rounded-xl p-4 mb-6 text-left">
                    <h2 class="text-xl font-bold text-gray-800 mb-4 text-center">{{ dictionary()['fullWorkoutRoutine'] }}</h2>
                    <ol class="list-decimal list-inside space-y-4 text-gray-700">
                        @for (exercise of displayExercises(); track exercise.name) {
                            <li>
                                <span class="font-semibold text-gray-900">{{ exercise.name }}</span>
                                <span class="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                    {{ exercise.duration }}s
                                </span>
                                <p class="text-sm text-gray-600 pl-6 mt-1">{{ exercise.explanation }}</p>
                            </li>
                        }
                    </ol>
                </div>
            }

            <!-- Exercise Details Card / Next Up Info -->
            @if (isWorkoutStarted() && !isWorkoutComplete()) {
                <div class="border-2 rounded-xl p-4 transition-colors duration-300 mb-6"
                    [class.border-indigo-600]="!isPaused() && isWorkPeriod()"
                    [class.bg-indigo-50]="!isPaused() && isWorkPeriod()"
                    [class.border-gray-200]="!isPaused() && !isWorkPeriod()"
                    [class.bg-gray-50]="!isPaused() && !isWorkPeriod()"
                    [class.border-gray-300]="isPaused()"
                    [class.bg-gray-100]="isPaused()">
                    
                    @if (isWorkPeriod()) {
                        <div>
                            <div class="relative w-full h-48 bg-gray-200 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                                @if (currentExercise()?.gifUrl; as gifUrl) {
                                    <img [ngSrc]="gifUrl" [alt]="currentExercise()?.name ?? dictionary()['exerciseAnimation']" fill class="object-contain">
                                } @else {
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                }
                            </div>
                            <h2 class="text-2xl font-bold text-gray-900 mb-3">{{ currentExercise()?.name }}</h2>
                            <div class="text-left text-sm">
                                <span class="font-semibold text-indigo-600">{{ dictionary()['movement'] }}</span> 
                                <span class="text-gray-700">{{ currentExercise()?.explanation }}</span>
                            </div>
                        </div>
                    } @else {
                        <div class="opacity-70">
                            @if (nextExercise(); as next) {
                                <div class="relative w-full h-48 bg-gray-200 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                                    @if (next.gifUrl; as gifUrl) {
                                        <img [ngSrc]="gifUrl" [alt]="next.name" fill class="object-contain">
                                    } @else {
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    }
                                </div>
                                <h2 class="text-2xl font-bold text-gray-800 mb-3">{{ dictionary()['next'] }} {{ next.name }}</h2>
                                <div class="text-left text-sm">
                                    <span class="font-semibold text-gray-600">{{ dictionary()['movement'] }}</span> 
                                    <span class="text-gray-500">{{ next.explanation }}</span>
                                </div>
                            } @else {
                                <h2 class="text-2xl font-bold text-gray-800 mb-3">{{ dictionary()['finalRoundComplete'] }}</h2>
                                <div class="text-left text-sm">
                                    <span class="text-gray-500">{{ dictionary()['coolDown'] }}</span>
                                </div>
                            }
                        </div>
                    }
                </div>
            }
        </div>

        <!-- CONTROLS -->
        <div class="flex flex-col space-y-4">
            @if (isWorkoutStarted() && !isWorkoutComplete()) {
                @if (isPaused()) {
                    <!-- PAUSED STATE -->
                    <!-- Paused Action Buttons: Go Back and Skip, stacked vertically -->
                    <div class="flex flex-col space-y-2">
                        <button (click)="goBack()" class="w-full bg-gray-400 text-gray-900 py-2 rounded-lg font-semibold text-sm hover:bg-gray-500 transition-colors shadow">
                            {{ dictionary()['goBack'] }}
                        </button>
                        @if (isWorkPeriod()) {
                            <button (click)="skipPhase('work')" class="w-full bg-pink-600 text-white py-2 rounded-lg font-semibold text-sm hover:bg-pink-700 transition-colors shadow">
                                {{ dictionary()['skipExercise'] }}
                            </button>
                        } @else {
                             <button (click)="skipPhase('rest')" class="w-full bg-pink-600 text-white py-2 rounded-lg font-semibold text-sm hover:bg-pink-700 transition-colors shadow">
                                {{ dictionary()['skipRest'] }}
                            </button>
                        }
                    </div>

                    <!-- Resume Button -->
                    <button (click)="pauseResume()"
                            class="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-3 rounded-xl font-bold text-lg transition-colors shadow-md">
                        {{ pauseButtonText() }}
                    </button>

                } @else {
                    <!-- RUNNING STATE -->
                    @if (isWorkPeriod()) {
                        <!-- Running during Work Period: Just Pause -->
                        <button (click)="pauseResume()"
                                class="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold text-lg transition-colors shadow-md">
                            {{ pauseButtonText() }}
                        </button>
                    } @else {
                        <!-- Running during Rest Period: Pause and Skip Rest -->
                        <div class="flex flex-col space-y-4">
                            <button (click)="skipPhase('rest')" class="w-full bg-pink-600 text-white py-2 rounded-lg font-semibold text-sm hover:bg-pink-700 transition-colors shadow">
                                {{ dictionary()['skipRest'] }}
                            </button>
                            <button (click)="pauseResume()" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold text-lg transition-colors shadow-md">
                                {{ pauseButtonText() }}
                            </button>
                        </div>
                    }
                }
            }
        </div>
    </div>
</div>
@if (!isWorkoutStarted() || isWorkoutComplete()) {
<footer class="fixed bottom-2 right-4 text-center text-xs text-gray-400">
  <p>
    Made with ❤️ by 
    <a href="mailto:maximsadym@gmail.com" 
       class="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors" 
       target="_blank" 
       rel="noopener noreferrer">
      Maxim Sadym
    </a>
  </p>
</footer>
}
`,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgOptimizedImage],
})
export class AppComponent {
    public readonly soundService = inject(SoundService);
    public readonly languageService = inject(LanguageService);
    public readonly dictionary = this.languageService.dictionary;
    public readonly languages = languages;

    public readonly TOTAL_WORK_PHASES = TOTAL_WORK_PHASES;
    public readonly LAST_PHASE = LAST_PHASE;

    public exerciseList = signal<ExerciseData[]>([...INITIAL_EXERCISE_LIST]);

    // --- State Signals ---
    restDuration = signal(getInitialRestDuration());
    durationMultiplier = signal(getInitialDurationMultiplier());
    currentPhaseIndex = signal(0);
    timeLeft = signal(0);
    isPaused = signal(false);
    elapsedTime = signal(0);
    pauseTimeTracker = signal(0);
    isWorkoutStarted = signal(false);
    isWorkoutComplete = signal(false);

    // --- Internal Timer Management ---
    private timerId: any = null;
    private pauseTimerId: any = null;

    constructor() {
        // Effect to save settings to localStorage whenever they change.
        effect(() => {
            if (typeof window !== 'undefined' && window.localStorage) {
                localStorage.setItem(LOCAL_STORAGE_KEY_REST_DURATION, this.restDuration().toString());
                localStorage.setItem(LOCAL_STORAGE_KEY_DURATION_MULTIPLIER, this.durationMultiplier().toString());
            }
        });
    }

    // --- Computed Signals (Derived State) ---
    statusMessage = computed(() => {
        if (this.isWorkoutComplete()) {
            return this.dictionary().workoutCompleteMessage;
        }
        if (!this.isWorkoutStarted()) {
            return this.dictionary().clickStart;
        }
        return ""; // No message during workout
    });

    displayExercises = computed((): DisplayExercise[] => {
        const multiplier = this.durationMultiplier();
        const dict = this.dictionary();
        const exercisesDict = dict['exercises'] as Record<string, string> ?? {};

        return this.exerciseList().map(ex => ({
            name: exercisesDict[ex.nameKey] ?? ex.nameKey,
            explanation: exercisesDict[ex.explanationKey] ?? ex.explanationKey,
            duration: Math.round(ex.duration * multiplier),
            gifUrl: ex.gifUrl,
        }));
    });

    exercisesDuration = computed(() => this.displayExercises().reduce((total, exercise) => total + exercise.duration, 0));

    totalDuration = computed(() => {
        const totalRest = TOTAL_REST_PHASES * this.restDuration();
        return this.exercisesDuration() + totalRest;
    });

    isWorkPeriod = computed(() => this.currentPhaseIndex() % 2 === 0);

    currentExercise = computed(() => {
        const index = Math.floor(this.currentPhaseIndex() / 2);
        return this.displayExercises()[index];
    });

    nextExercise = computed(() => {
        const index = Math.floor(this.currentPhaseIndex() / 2) + 1;
        return this.displayExercises()[index];
    });

    headerTitle = computed(() => {
        const dict = this.dictionary();
        if (this.isPaused()) {
            return `${dict.paused} (${this.formatTime(this.pauseTimeTracker())})`;
        }

        if (this.isWorkoutComplete()) {
            return dict.workoutComplete;
        }

        if (!this.isWorkoutStarted()) {
            return dict.workoutTitle;
        }

        if (this.isWorkPeriod()) {
            const exerciseNum = Math.floor(this.currentPhaseIndex() / 2) + 1;
            const exerciseName = this.currentExercise()?.name ?? dict.exercise;
            return `${exerciseName} (${exerciseNum} ${dict.of} ${this.TOTAL_WORK_PHASES})`;
        } else {
            return dict.rest;
        }
    });

    timerDisplay = computed(() => {
        return formatTime(this.timeLeft());
    });

    totalTimeRemainingDisplay = computed(() => {
        const remaining = this.totalDuration() - this.elapsedTime();
        return formatTime(Math.max(0, remaining));
    });

    roundInfo = computed(() => {
        const dict = this.dictionary();
        const exerciseNum = Math.floor(this.currentPhaseIndex() / 2) + 1;

        if (this.isWorkPeriod()) {
            return `${dict.round} ${exerciseNum} / ${this.TOTAL_WORK_PHASES}`;
        } else {
            return `${dict.complete} ${exerciseNum} / ${this.TOTAL_WORK_PHASES}`;
        }
    });

    pauseButtonText = computed(() => {
        const dict = this.dictionary();
        if (this.isPaused()) {
            return dict.resume;
        }
        return this.isWorkPeriod() ? dict.pause : dict.pauseRest;
    });

    formatTime(seconds: number): string {
        return formatTime(seconds);
    }

    // --- Logic Methods ---

    onRestDurationChange(event: Event) {
        const input = event.target as HTMLInputElement;
        this.restDuration.set(Number(input.value));
    }

    onDurationMultiplierChange(event: Event) {
        const input = event.target as HTMLInputElement;
        this.durationMultiplier.set(Number(input.value));
    }

    private calculateElapsedTimeAtPhaseStart(phaseIndex: number): number {
        let totalTime = 0;
        const exercises = this.displayExercises();
        for (let i = 0; i < phaseIndex; i++) {
            if (i % 2 === 0) { // Work phase
                const exerciseIndex = i / 2;
                if (exercises[exerciseIndex]) {
                    totalTime += exercises[exerciseIndex].duration;
                }
            } else { // Rest phase
                totalTime += this.restDuration();
            }
        }
        return totalTime;
    }

    private tick = () => {
        if (this.isPaused() || this.isWorkoutComplete()) {
            this.timerId = null;
            return;
        }

        // --- Sound logic: Countdown beeps at the end of any phase ---
        if (this.timeLeft() === 4 || this.timeLeft() === 3 || this.timeLeft() === 2) {
            this.soundService.playShortBeep();
        }

        this.elapsedTime.update(e => e + 1);
        this.timeLeft.update(t => t - 1);

        if (this.timeLeft() <= 0) {
            // --- Sound logic: Phase transition beeps ---
            if (this.isWorkPeriod()) {
                // Work period just ended
                this.soundService.playEndBeep();
            } else {
                // Rest period just ended, exercise is about to start
                this.soundService.playStartBeep();
            }

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

        if (this.currentPhaseIndex() >= LAST_PHASE) {
            this.isWorkoutComplete.set(true);
            this.isWorkoutStarted.set(false);
            this.timeLeft.set(0);
            return;
        }

        const isWork = this.isWorkPeriod();
        const duration = isWork ? this.currentExercise().duration : this.restDuration();

        if (this.timeLeft() <= 0) {
            this.timeLeft.set(duration);
        }

        this.timerId = setTimeout(this.tick, 1000);
    }

    startWorkout() {
        this.soundService.unlockAudio();
        this.soundService.playStartBeep();
        this.currentPhaseIndex.set(0);
        this.timeLeft.set(this.displayExercises()[0].duration);
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
        this.soundService.unlockAudio();
        this.isPaused.update(p => !p);

        if (this.isPaused()) {
            this.soundService.playPauseBeep();
            clearTimeout(this.timerId);
            this.pauseTimerId = setInterval(this.tickPause, 1000);
        } else {
            this.soundService.playResumeBeep();
            clearInterval(this.pauseTimerId);
            this.pauseTimeTracker.set(0);
            this.runStep();
        }
    }

    skipPhase(type: 'work' | 'rest') {
        if (type === 'work') {
            this.soundService.playEndBeep();
        } else {
            this.soundService.playStartBeep();
        }

        this.elapsedTime.update(e => e + this.timeLeft());
        this.currentPhaseIndex.update(i => i + 1);
        this.timeLeft.set(0);

        this.isPaused.set(false);
        clearInterval(this.pauseTimerId);
        this.pauseTimeTracker.set(0);

        this.runStep();
    }

    goBack() {
        this.soundService.unlockAudio();
        this.soundService.playStartBeep();

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
        const exerciseIndex = Math.floor(newPhaseIndex / 2);
        this.timeLeft.set(this.displayExercises()[exerciseIndex].duration);

        this.isPaused.set(false);
        clearInterval(this.pauseTimerId);
        this.pauseTimeTracker.set(0);

        this.runStep();
    }
}
