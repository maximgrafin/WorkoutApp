import { ChangeDetectionStrategy, Component, signal, computed, inject, effect, OnDestroy, HostListener } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { SoundService } from './sound.service';
import { LanguageService, languages } from './language.service';

// --- Configuration Constants ---
const getRestDurationKey = (mode: string) => `workout-timer-rest-duration-${mode}`;
const getDurationMultiplierKey = (mode: string) => `workout-timer-duration-multiplier-${mode}`;

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
const BASE_EXERCISE_LIST: ExerciseData[] = [
    { nameKey: "catCow_name", explanationKey: "catCow_explanation", duration: 60, gifUrl: 'https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExMzU3OXl3cTczYmd3bWFyZ29md3l6MmVwb2VnaWM1ODRzazNidDhvMSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/JdtyfG3ZSE8iOlDs64/giphy.gif' },
    { nameKey: "birdDogLeft_name", explanationKey: "birdDogLeft_explanation", duration: 45, gifUrl: 'https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExcXRiZmxqNTM4OGY5bmswZXp0MnJzMWdnNGRvMW9nM21kcWpsZjd6eSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l0Nwx7Grs4AOlkTba/giphy.gif' },
    { nameKey: "birdDogRight_name", explanationKey: "birdDogRight_explanation", duration: 45, gifUrl: 'https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExcXRiZmxqNTM4OGY5bmswZXp0MnJzMWdnNGRvMW9nM21kcWpsZjd6eSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l0Nwx7Grs4AOlkTba/giphy.gif' },
    { nameKey: "cossackSquats_name", explanationKey: "cossackSquats_explanation", duration: 60, gifUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbHd2enk1eGQ2OTd4bWR0MnVzMXpzdXViMTdrNGIwYWZzNWk0MDFocyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/SiKqOc1nzHEAC4d5fX/giphy.gif' },
    { nameKey: "quadStretchLeft_name", explanationKey: "quadStretchLeft_explanation", duration: 45, gifUrl: 'https://sportydoctor.com/wp-content/uploads/Standing-Quad-1.gif' },
    { nameKey: "quadStretchRight_name", explanationKey: "quadStretchRight_explanation", duration: 45, gifUrl: 'https://sportydoctor.com/wp-content/uploads/Standing-Quad-1.gif' },
    { nameKey: "wallCalfStretchLeft_name", explanationKey: "wallCalfStretchLeft_explanation", duration: 60, gifUrl: 'https://sportydoctor.com/wp-content/uploads/Wall-Calf-Stretch.gif' },
    { nameKey: "wallCalfStretchRight_name", explanationKey: "wallCalfStretchRight_explanation", duration: 60, gifUrl: 'https://sportydoctor.com/wp-content/uploads/Wall-Calf-Stretch.gif' },
    { nameKey: "shortFootLeft_name", explanationKey: "shortFootLeft_explanation", duration: 60, gifUrl: 'https://cdn.shopify.com/s/files/1/1402/4425/files/Short_foot_1024x1024.gif?v=1618891237' },
    { nameKey: "shortFootRight_name", explanationKey: "shortFootRight_explanation", duration: 60, gifUrl: 'https://cdn.shopify.com/s/files/1/1402/4425/files/Short_foot_1024x1024.gif?v=1618891237' },
    { nameKey: "ywRaises_name", explanationKey: "ywRaises_explanation", duration: 60, gifUrl: 'https://i.makeagif.com/media/5-08-2025/5hrukN.gif' },
    { nameKey: "pushUps_name", explanationKey: "pushUps_explanation", duration: 40, gifUrl: 'https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHA3Zm02OXp1c3Bjb2hpeGU5MXpreWlzbWV1MWdldjVrNHRiazM3cyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/xT0GqzRhOgrnKoTlCM/giphy.gif' },
    { nameKey: "plank_name", explanationKey: "plank_explanation", duration: 60, gifUrl: 'https://i.imgur.com/zL1nbr9.jpeg' },
];

const ADVANCED_EXERCISE_LIST: ExerciseData[] = [
    { nameKey: "sidePlankRight_name", explanationKey: "sidePlankRight_explanation", duration: 30, gifUrl: 'https://i.imgur.com/tor7hei.jpeg' },
    { nameKey: "sidePlankLeft_name", explanationKey: "sidePlankLeft_explanation", duration: 30, gifUrl: 'https://i.imgur.com/S8HxmGu.jpeg' },
    { nameKey: "singleLegGluteBridgeLeft_name", explanationKey: "singleLegGluteBridgeLeft_explanation", duration: 90, gifUrl: 'https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExZjQ0MDl3YXNueHgwbWpsdG1tb3MwN28xYnNmbHZwbW0yY2w5MjNueSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/SJWtWnRFsTiNVSECVP/giphy.gif' },
    { nameKey: "singleLegGluteBridgeRight_name", explanationKey: "singleLegGluteBridgeRight_explanation", duration: 90, gifUrl: 'https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExZjQ0MDl3YXNueHgwbWpsdG1tb3MwN28xYnNmbHZwbW0yY2w5MjNueSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/SJWtWnRFsTiNVSECVP/giphy.gif' },
    { nameKey: "eccentricCalfRaiseLeft_name", explanationKey: "eccentricCalfRaiseLeft_explanation", duration: 90, gifUrl: 'https://www.runnersworld.co.za/wp-content/uploads/2025/10/eccentric-single-leg-calf-raise-calf-stretching-0028-652ef00e9074b.gif'},
    { nameKey: "eccentricCalfRaiseRight_name", explanationKey: "eccentricCalfRaiseRight_explanation", duration: 90, gifUrl: 'https://www.runnersworld.co.za/wp-content/uploads/2025/10/eccentric-single-leg-calf-raise-calf-stretching-0028-652ef00e9074b.gif'},
    { nameKey: "pushUps_name", explanationKey: "pushUps_explanation", duration: 40, gifUrl: 'https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHA3Zm02OXp1c3Bjb2hpeGU5MXpreWlzbWV1MWdldjVrNHRiazM3cyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/xT0GqzRhOgrnKoTlCM/giphy.gif' },
    { nameKey: "plank_name", explanationKey: "plank_explanation", duration: 60, gifUrl: 'https://i.imgur.com/zL1nbr9.jpeg' },
    { nameKey: "activeHang_name", explanationKey: "activeHang_explanation", duration: 60 , gifUrl: 'https://www.nourishmovelove.com/wp-content/uploads/2024/12/2-active-hang-on-the-bar.gif'},
    { nameKey: "negativePullups_name", explanationKey: "negativePullups_explanation", duration: 180 , gifUrl: 'https://www.powrpersonaltraining.com/wp-content/uploads/2025/09/Negative-Pull-Ups-Exercise-Demo.gif'},
];

// --- Utility Functions ---

/** Reads the rest duration from localStorage, with validation and a fallback. */
function getInitialRestDuration(mode: 'base' | 'advanced'): number {
    if (typeof window === 'undefined' || !window.localStorage) {
        return 30; // Default if localStorage is not available
    }

    const savedValue = localStorage.getItem(getRestDurationKey(mode));
    // Provide a fallback to the old key
    const oldSavedValue = localStorage.getItem('workout-timer-rest-duration');
    const valueToUse = savedValue || (mode === 'base' ? oldSavedValue : null);

    if (valueToUse) {
        const duration = parseInt(valueToUse, 10);
        // Validate that the stored value is a number within our allowed range.
        if (!isNaN(duration) && duration >= 10 && duration <= 60) {
            return duration;
        }
    }

    return 30; // Default if no valid value is stored
}

/** Reads the duration multiplier from localStorage, with validation and a fallback. */
function getInitialDurationMultiplier(mode: 'base' | 'advanced'): number {
    if (typeof window === 'undefined' || !window.localStorage) {
        return 1; // Default if localStorage is not available
    }

    const savedValue = localStorage.getItem(getDurationMultiplierKey(mode));
    // Provide a fallback to the old key
    const oldSavedValue = localStorage.getItem('workout-timer-duration-multiplier');
    const valueToUse = savedValue || (mode === 'base' ? oldSavedValue : null);

    if (valueToUse) {
        const multiplier = parseFloat(valueToUse);
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
    @if (updateAvailable()) {
        <div class="fixed top-0 left-0 right-0 bg-indigo-600 text-white p-3 text-center z-50 flex justify-center items-center space-x-4 shadow-md">
            <span class="font-semibold">{{ dictionary()['updateAvailable'] }}</span>
            <button (click)="applyUpdate()" class="bg-white text-indigo-600 px-4 py-1 rounded-full font-bold text-sm hover:bg-gray-100 transition-colors">
                {{ dictionary()['applyUpdate'] }}
            </button>
        </div>
    }
    <!-- Main Workout Container -->
    <div class="relative w-full max-w-lg bg-white shadow-2xl rounded-xl p-6 md:p-8 text-center flex flex-col min-h-[38rem]">
        
        <!-- Header Controls (Sound & Language) -->
        @if (!isWorkoutStarted() || isWorkoutComplete()) {
            <div class="flex justify-between items-center w-full mb-4 z-10 relative">
                <!-- Mute/Unmute Button -->
                <button (click)="soundService.toggleMute()" 
                        class="p-2 rounded-full text-gray-500 hover:bg-gray-200 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">
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

                <!-- Language Switcher & Install App -->
                <div class="flex items-center space-x-3 text-gray-500">
                    @if (canInstall()) {
                        <button (click)="installApp()" class="px-3 py-1 bg-indigo-100 text-indigo-700 font-bold rounded-md hover:bg-indigo-200 transition-colors text-sm flex items-center shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            {{ dictionary()['installApp'] }}
                        </button>
                    }
                    <div class="flex items-center space-x-1">
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
                </div>
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
                <!-- Workout Mode Selection -->
                <div class="flex space-x-4 mb-6">
                    <button (click)="workoutMode.set('base')"
                            class="flex-1 py-3 px-4 rounded-xl font-bold text-lg transition-colors shadow-sm border-2"
                            [class.bg-indigo-600]="workoutMode() === 'base'"
                            [class.text-white]="workoutMode() === 'base'"
                            [class.border-indigo-600]="workoutMode() === 'base'"
                            [class.bg-white]="workoutMode() !== 'base'"
                            [class.text-gray-700]="workoutMode() !== 'base'"
                            [class.border-gray-200]="workoutMode() !== 'base'"
                            [class.hover:border-indigo-300]="workoutMode() !== 'base'">
                        {{ dictionary()['baseWorkout'] }}
                    </button>
                    <button (click)="workoutMode.set('advanced')"
                            class="flex-1 py-3 px-4 rounded-xl font-bold text-lg transition-colors shadow-sm border-2"
                            [class.bg-indigo-600]="workoutMode() === 'advanced'"
                            [class.text-white]="workoutMode() === 'advanced'"
                            [class.border-indigo-600]="workoutMode() === 'advanced'"
                            [class.bg-white]="workoutMode() !== 'advanced'"
                            [class.text-gray-700]="workoutMode() !== 'advanced'"
                            [class.border-gray-200]="workoutMode() !== 'advanced'"
                            [class.hover:border-indigo-300]="workoutMode() !== 'advanced'">
                        {{ dictionary()['advancedWorkout'] }}
                    </button>
                </div>

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

                <!-- Description -->
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
                            class="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-6 rounded-xl font-bold text-2xl tracking-wider transition-colors shadow-md">
                        {{ pauseButtonText() }}
                    </button>

                } @else {
                    <!-- RUNNING STATE -->
                    @if (isWorkPeriod()) {
                        <!-- Running during Work Period: Just Pause -->
                        <button (click)="pauseResume()"
                                class="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-6 rounded-xl font-bold text-2xl tracking-wider transition-colors shadow-md">
                            {{ pauseButtonText() }}
                        </button>
                    } @else {
                        <!-- Running during Rest Period: Pause and Skip Rest -->
                        <div class="flex flex-col space-y-4">
                            <button (click)="skipPhase('rest')" class="w-full bg-pink-600 text-white py-3 rounded-lg font-semibold text-lg hover:bg-pink-700 transition-colors shadow">
                                {{ dictionary()['skipRest'] }}
                            </button>
                            <button (click)="pauseResume()" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-6 rounded-xl font-bold text-2xl tracking-wider transition-colors shadow-md">
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
export class AppComponent implements OnDestroy {
    public readonly soundService = inject(SoundService);
    public readonly languageService = inject(LanguageService);
    public readonly dictionary = this.languageService.dictionary;
    public readonly languages = languages;

    private voices: SpeechSynthesisVoice[] = [];

    // --- Service Worker Update State ---
    updateAvailable = signal(false);
    private waitingWorker: ServiceWorker | null = null;

    @HostListener('window:sw-update-available', ['$event'])
    onSwUpdateAvailable(event: CustomEvent<ServiceWorker>) {
        this.waitingWorker = event.detail;
        this.updateAvailable.set(true);
    }

    applyUpdate() {
        if (this.waitingWorker) {
            this.waitingWorker.postMessage({ type: 'SKIP_WAITING' });
        }
    }

    // --- PWA Installation State ---
    canInstall = signal(false);
    private deferredInstallPrompt: any = null;

    @HostListener('window:beforeinstallprompt', ['$event'])
    onBeforeInstallPrompt(event: Event) {
        // Prevent the mini-infobar from appearing on mobile
        event.preventDefault();
        // Stash the event so it can be triggered later.
        this.deferredInstallPrompt = event;
        // Update UI notify the user they can install the PWA
        this.canInstall.set(true);
    }

    async installApp() {
        if (!this.deferredInstallPrompt) return;
        // Show the install prompt
        this.deferredInstallPrompt.prompt();
        // Wait for the user to respond to the prompt
        const { outcome } = await this.deferredInstallPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        // We've used the prompt, and can't use it again, throw it away
        this.deferredInstallPrompt = null;
        this.canInstall.set(false);
    }

    // --- State Signals ---
    workoutMode = signal<'base' | 'advanced'>('base');
    baseRestDuration = signal(getInitialRestDuration('base'));
    baseDurationMultiplier = signal(getInitialDurationMultiplier('base'));
    advancedRestDuration = signal(getInitialRestDuration('advanced'));
    advancedDurationMultiplier = signal(getInitialDurationMultiplier('advanced'));
    currentPhaseIndex = signal(0);
    timeLeft = signal(0);
    isPaused = signal(false);
    elapsedTime = signal(0);
    pauseTimeTracker = signal(0);
    isWorkoutStarted = signal(false);
    isWorkoutComplete = signal(false);

    // --- Derived Signals & Computeds ---
    restDuration = computed(() => this.workoutMode() === 'base' ? this.baseRestDuration() : this.advancedRestDuration());
    durationMultiplier = computed(() => this.workoutMode() === 'base' ? this.baseDurationMultiplier() : this.advancedDurationMultiplier());
    exerciseList = computed(() => this.workoutMode() === 'base' ? BASE_EXERCISE_LIST : ADVANCED_EXERCISE_LIST);
    totalWorkPhases = computed(() => this.exerciseList().length);
    lastPhase = computed(() => (this.totalWorkPhases() * 2) - 1);

    // --- Internal Timer Management ---
    private timerId: any = null;
    private pauseTimerId: any = null;
    private wakeLockSentinel: WakeLockSentinel | null = null;

    constructor() {
        // Effect to save settings to localStorage whenever they change.
        effect(() => {
            if (typeof window !== 'undefined' && window.localStorage) {
                localStorage.setItem(getRestDurationKey('base'), this.baseRestDuration().toString());
                localStorage.setItem(getDurationMultiplierKey('base'), this.baseDurationMultiplier().toString());
                localStorage.setItem(getRestDurationKey('advanced'), this.advancedRestDuration().toString());
                localStorage.setItem(getDurationMultiplierKey('advanced'), this.advancedDurationMultiplier().toString());
            }
        });

        // Add visibility change listener to re-acquire wake lock
        if (typeof document !== 'undefined') {
            document.addEventListener('visibilitychange', this.handleVisibilityChange);
        }

        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
             // Load voices
             const loadVoices = () => {
                 this.voices = window.speechSynthesis.getVoices();
                 console.log('Voices loaded:', this.voices.length);
             };
             window.speechSynthesis.onvoiceschanged = loadVoices;
             loadVoices();
             // Retry loading voices after a short delay if empty
             setTimeout(() => {
                 if (this.voices.length === 0) loadVoices();
             }, 1000);
        }
    }

    ngOnDestroy() {
        // Clean up listener and release wake lock
        if (typeof document !== 'undefined') {
            document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        }
        this.releaseWakeLock();
        clearTimeout(this.timerId);
        clearInterval(this.pauseTimerId);
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
        const totalRest = Math.max(0, this.displayExercises().length - 1) * this.restDuration();
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
            return `${exerciseName} (${exerciseNum} ${dict.of} ${this.totalWorkPhases()})`;
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
            return `${dict.round} ${exerciseNum} / ${this.totalWorkPhases()}`;
        } else {
            return `${dict.complete} ${exerciseNum} / ${this.totalWorkPhases()}`;
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

    // --- Wake Lock Management ---
    private handleVisibilityChange = async () => {
        if (document.visibilityState === 'visible' && this.isWorkoutStarted() && !this.isPaused() && !this.isWorkoutComplete()) {
            await this.requestWakeLock();
        }
    }

    private async requestWakeLock() {
        if ('wakeLock' in navigator) {
            try {
                this.wakeLockSentinel = await navigator.wakeLock.request('screen');
                console.log('Screen Wake Lock is active.');
                this.wakeLockSentinel.addEventListener('release', () => {
                    console.log('Screen Wake Lock was released by the browser.');
                    // This is important! Update our state when the lock is released externally
                    this.wakeLockSentinel = null;
                });
            } catch (err: any) {
                console.error(`Wake Lock request failed: ${err.name}, ${err.message}`);
                this.wakeLockSentinel = null; // Ensure it's null on failure
            }
        } else {
            console.log('Wake Lock API not supported.');
        }
    }

    private async releaseWakeLock() {
        if (this.wakeLockSentinel) {
            await this.wakeLockSentinel.release();
            this.wakeLockSentinel = null;
            console.log('Screen Wake Lock released.');
        }
    }

    // --- Logic Methods ---

    onRestDurationChange(event: Event) {
        const input = event.target as HTMLInputElement;
        const value = Number(input.value);
        if (this.workoutMode() === 'base') {
            this.baseRestDuration.set(value);
        } else {
            this.advancedRestDuration.set(value);
        }
    }

    onDurationMultiplierChange(event: Event) {
        const input = event.target as HTMLInputElement;
        const value = Number(input.value);
        if (this.workoutMode() === 'base') {
            this.baseDurationMultiplier.set(value);
        } else {
            this.advancedDurationMultiplier.set(value);
        }
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
                this.announceNextExercise();
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

    private async runStep() {
        clearTimeout(this.timerId);

        if (this.currentPhaseIndex() >= this.lastPhase()) {
            this.isWorkoutComplete.set(true);
            this.isWorkoutStarted.set(false);
            this.timeLeft.set(0);
            await this.releaseWakeLock();
            return;
        }

        const isWork = this.isWorkPeriod();
        const duration = isWork ? this.currentExercise().duration : this.restDuration();

        if (this.timeLeft() <= 0) {
            this.timeLeft.set(duration);
        }

        this.timerId = setTimeout(this.tick, 1000);
    }

    async startWorkout() {
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
        await this.requestWakeLock();
    }

    async pauseResume() {
        this.soundService.unlockAudio();
        this.isPaused.update(p => !p);

        if (this.isPaused()) {
            this.soundService.playPauseBeep();
            clearTimeout(this.timerId);
            this.pauseTimerId = setInterval(this.tickPause, 1000);
            await this.releaseWakeLock();
        } else {
            this.soundService.playResumeBeep();
            clearInterval(this.pauseTimerId);
            this.pauseTimeTracker.set(0);
            this.runStep();
            await this.requestWakeLock();
        }
    }

    async skipPhase(type: 'work' | 'rest') {
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
        await this.requestWakeLock();
    }

    async goBack() {
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
        await this.requestWakeLock();
    }

    private announceNextExercise() {
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
            return;
        }

        // We are currently in a Work phase (index i).
        // Next phase is Rest (i+1).
        // The exercise AFTER rest is at index (i+2).
        // We want to get the name of that exercise.
        const currentIndices = this.currentPhaseIndex();
        // The upcoming work phase index (relative to 0..totalPhases)
        const nextWorkPhaseindex = currentIndices + 2;
        
        // Calculate the exercise index in the list
        const nextExerciseListIndex = nextWorkPhaseindex / 2;

        const exercises = this.exerciseList();
        if (nextExerciseListIndex < exercises.length) {
            const nextExerciseKey = exercises[nextExerciseListIndex].nameKey;
            // Always use English for announcement used new method
            const englishName = this.languageService.getEnglishExerciseName(nextExerciseKey);
            
            this.speak(`Next is ${englishName}`);
        }
    }

    private speak(text: string) {
        console.log('Attempting to speak:', text);
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        
        // Ensure voices are loaded if they weren't before
        if (this.voices.length === 0) {
            this.voices = window.speechSynthesis.getVoices();
        }

        // Try to find a good English voice
        const voice = this.voices.find(v => v.lang === 'en-US' && !v.name.includes('Google')) || 
                      this.voices.find(v => v.lang.startsWith('en')) ||
                      null;
        
        if (voice) {
            utterance.voice = voice;
            console.log('Using voice:', voice.name);
        } else {
            console.warn('No English voice found, using default.');
        }
        
        // Adjust rate/pitch if needed
        utterance.rate = 1.0; 
        
        window.speechSynthesis.speak(utterance);
    }
}
