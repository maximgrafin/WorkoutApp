import { Injectable, signal, effect, computed } from '@angular/core';

export type Language = 'en' | 'ru' | 'de' | 'es' | 'uk';

export const languages: { code: Language, name: string }[] = [
    { code: 'en', name: 'EN' },
    { code: 'de', name: 'DE' },
    { code: 'es', name: 'ES' },
    { code: 'uk', name: 'UA' },
    { code: 'ru', name: 'RU' },
];

const LOCAL_STORAGE_KEY_LANGUAGE = 'workout-timer-language';

const dictionaries: Record<Language, any> = {
  en: {
    mute: 'Mute',
    unmute: 'Unmute',
    restDuration: 'Rest Duration',
    exerciseDurationMultiplier: 'Exercise Duration Multiplier',
    fullWorkoutRoutine: 'Full Workout Routine',
    startWorkout: 'Start Workout',
    startOver: 'Start Over',
    totalTimeLeft: 'Total Time Left:',
    movement: 'Movement:',
    exerciseAnimation: 'Exercise animation',
    next: 'Next:',
    finalRoundComplete: 'Final Round Complete!',
    coolDown: 'Time to cool down and stretch.',
    goBack: 'Go Back',
    skipRest: 'Skip Rest',
    skipExercise: 'Skip Exercise',
    pause: 'Pause',
    pauseRest: 'Pause Rest',
    resume: 'RESUME',
    paused: 'PAUSED',
    total: 'Total:',
    exercise: 'Exercise',
    of: 'of',
    rest: 'REST',
    round: 'Round',
    complete: 'Complete',
    workoutTitle: 'Core & Back Workout',
    clickStart: "This full-body routine strengthens your core and back. Adjust settings below, then press Start when you're ready.",
    workoutComplete: 'Workout Complete!',
    workoutCompleteMessage: '🥳 Amazing job! You crushed it.',
    exercises: {
      catCow_name: "Cat Cow",
      catCow_explanation: "Start on all fours. Inhale as you drop your belly and look up (Cow). Exhale as you round your spine and tuck your chin (Cat).",
      birdDogLeft_name: "Bird Dog (Left)",
      birdDogLeft_explanation: "Start on all fours. Extend left arm forward and right leg backward. Hold.",
      birdDogRight_name: "Bird Dog (Right)",
      birdDogRight_explanation: "Start on all fours. Extend right arm forward and left leg backward. Hold.",
      bodyweightSquats_name: "Bodyweight Squats",
      bodyweightSquats_explanation: "Stand with feet shoulder-width apart. Lower your hips as if sitting in a chair, keeping your chest up and back straight. Push back up to start.",
      pushUps_name: "Push-Ups",
      pushUps_explanation: "Start in a high plank. Lower your body until your chest nearly touches the floor, keeping your body straight. Push back up.",
      gluteBridge_name: "Glute Bridge",
      gluteBridge_explanation: "Lie on your back, knees bent, feet flat on the floor. Lift hips until your body forms a straight line from shoulders to knees. Squeeze glutes, then lower.",
      superman_name: "Superman",
      superman_explanation: "Lie face down, extend arms forward. Simultaneously lift arms, chest, and legs off the floor. Hold and lower.",
      bicycleCrunches_name: "Bicycle Crunches",
      bicycleCrunches_explanation: "Lie on back, hands behind head. Alternately bring elbow to opposite knee while extending the other leg.",
      reverseCrunch_name: "Reverse Crunch",
      reverseCrunch_explanation: "Lie on back, knees bent. Engage abs to lift hips off the floor, curling knees toward the chest. Lower slowly.",
      hollowHold_name: "Hollow Hold",
      hollowHold_explanation: "Lie on back, lift head, shoulders, and legs slightly off the ground, forming a 'boat' or 'banana' shape.",
      flutterKicks_name: "Flutter Kicks",
      flutterKicks_explanation: "Lie on back. Perform small, rapid, alternating vertical kicks with the legs.",
      sidePlankRight_name: "Side Plank (Right)",
      sidePlankRight_explanation: "Lie on right side, support weight on right forearm, lift hips until the body forms a straight line.",
      sidePlankLeft_name: "Side Plank (Left)",
      sidePlankLeft_explanation: "Lie on left side, support weight on left forearm, lift hips until the body forms a straight line.",
      mountainClimbers_name: "Mountain Climbers",
      mountainClimbers_explanation: "Start in a high plank. Alternately bring knees towards the chest in a running motion.",
      russianTwist_name: "Russian Twist",
      russianTwist_explanation: "Sit with knees bent, lean back, and twist torso side to side, touching hands to the floor.",
      plank_name: "Plank",
      plank_explanation: "Hold the push-up position on forearms, maintaining a straight line from head to heels.",
    }
  },
  ru: {
    mute: 'Выкл. звук',
    unmute: 'Вкл. звук',
    restDuration: 'Продолжительность отдыха',
    exerciseDurationMultiplier: 'Множитель длительности',
    fullWorkoutRoutine: 'Программа тренировки',
    startWorkout: 'Начать тренировку',
    startOver: 'Начать заново',
    totalTimeLeft: 'Всего осталось:',
    movement: 'Движение:',
    exerciseAnimation: 'Анимация упражнения',
    next: 'Далее:',
    finalRoundComplete: 'Последний раунд завершен!',
    coolDown: 'Время для заминки и растяжки.',
    goBack: 'Назад',
    skipRest: 'Пропустить отдых',
    skipExercise: 'Пропустить упражнение',
    pause: 'Пауза',
    pauseRest: 'Пауза (отдых)',
    resume: 'ПРОДОЛЖИТЬ',
    paused: 'ПАУЗА',
    total: 'Продожительность:',
    exercise: 'Упражнение',
    of: 'из',
    rest: 'ОТДЫХ',
    round: 'Раунд',
    complete: 'Выполнено',
    workoutTitle: 'Тренировка для Пресса и Спины',
    clickStart: 'Эта тренировка для всего тела укрепляет ваш пресс и спину. Настройте параметры ниже, затем нажмите Старт, когда будете готовы.',
    workoutComplete: 'Тренировка завершена!',
    workoutCompleteMessage: '🥳 Отличная работа! Вы справились.',
    exercises: {
      catCow_name: "Кошка-Корова",
      catCow_explanation: "Начните на четвереньках. Вдохните, прогибая спину и поднимая голову (Корова). Выдохните, округляя спину и прижимая подбородок к груди (Кошка).",
      birdDogLeft_name: "Птица-Собака (левая)",
      birdDogLeft_explanation: "Начните на четвереньках. Вытяните левую руку вперед и правую ногу назад. Удерживайте.",
      birdDogRight_name: "Птица-Собака (правая)",
      birdDogRight_explanation: "Начните на четвереньках. Вытяните правую руку вперед и левую ногу назад. Удерживайте.",
      bodyweightSquats_name: "Приседания с весом тела",
      bodyweightSquats_explanation: "Встаньте, ноги на ширине плеч. Опускайте бедра, как будто садитесь на стул, держа грудь прямо и спину ровно. Вернитесь в исходное положение.",
      pushUps_name: "Отжимания",
      pushUps_explanation: "Начните в высокой планке. Опускайте тело, пока грудь почти не коснется пола, держа тело прямо. Вернитесь в исходное положение.",
      gluteBridge_name: "Ягодичный мостик",
      gluteBridge_explanation: "Лягте на спину, колени согнуты, стопы на полу. Поднимайте бедра, пока тело не образует прямую линию от плеч до колен. Сожмите ягодицы, затем опуститесь.",
      superman_name: "Супермен",
      superman_explanation: "Лягте на живот, вытяните руки вперед. Одновременно поднимите руки, грудь и ноги от пола. Удерживайте и опуститесь.",
      bicycleCrunches_name: "Велосипедные скручивания",
      bicycleCrunches_explanation: "Лягте на спину, руки за головой. Поочередно подводите локоть к противоположному колену, выпрямляя другую ногу.",
      reverseCrunch_name: "Обратные скручивания",
      reverseCrunch_explanation: "Лягте на спину, колени согнуты. Напрягите пресс, чтобы поднять бедра от пола, подтягивая колени к груди. Медленно опуститесь.",
      hollowHold_name: "Полая лодка",
      hollowHold_explanation: "Лягте на спину, поднимите голову, плечи и ноги немного от земли, образуя форму 'лодки' или 'банана'.",
      flutterKicks_name: "Махи ногами (ножницы)",
      flutterKicks_explanation: "Лягте на спину. Выполняйте небольшие, быстрые, чередующиеся вертикальные махи ногами.",
      sidePlankRight_name: "Боковая планка (правая)",
      sidePlankRight_explanation: "Лягте на правый бок, опираясь на правое предплечье, поднимите бедра, пока тело не образует прямую линию.",
      sidePlankLeft_name: "Боковая планка (левая)",
      sidePlankLeft_explanation: "Лягте на левый бок, опираясь на левое предплечье, поднимите бедра, пока тело не образует прямую линию.",
      mountainClimbers_name: "Скалолазы",
      mountainClimbers_explanation: "Начните в высокой планке. Поочередно подтягивайте колени к груди в беговом движении.",
      russianTwist_name: "Русский твист",
      russianTwist_explanation: "Сядьте, колени согнуты, отклонитесь назад и поворачивайте туловище из стороны в сторону, касаясь руками пола.",
      plank_name: "Планка",
      plank_explanation: "Удерживайте положение отжимания на предплечьях, сохраняя прямую линию от головы до пяток.",
    }
  },
  de: {
    mute: 'Stumm',
    unmute: 'Ton an',
    restDuration: 'Pausendauer',
    exerciseDurationMultiplier: 'Übungsdauer-Multiplikator',
    fullWorkoutRoutine: 'Komplettes Trainingsprogramm',
    startWorkout: 'Training starten',
    startOver: 'Neu starten',
    totalTimeLeft: 'Verbleibende Gesamtzeit:',
    movement: 'Bewegung:',
    exerciseAnimation: 'Übungsanimation',
    next: 'Nächste:',
    finalRoundComplete: 'Letzte Runde abgeschlossen!',
    coolDown: 'Zeit zum Abkühlen und Dehnen.',
    goBack: 'Zurück',
    skipRest: 'Pause überspringen',
    skipExercise: 'Übung überspringen',
    pause: 'Pause',
    pauseRest: 'Pause (Erholung)',
    resume: 'FORTSETZEN',
    paused: 'PAUSIERT',
    total: 'Gesamt:',
    exercise: 'Übung',
    of: 'von',
    rest: 'PAUSE',
    round: 'Runde',
    complete: 'Abgeschlossen',
    workoutTitle: 'Rumpf- & Rückentraining',
    clickStart: 'Dieses Ganzkörpertraining stärkt Rumpf und Rücken. Passen Sie die Einstellungen unten an und drücken Sie dann Start, wenn Sie bereit sind.',
    workoutComplete: 'Training abgeschlossen!',
    workoutCompleteMessage: '🥳 Großartige Arbeit! Du hast es geschafft.',
    exercises: {
      catCow_name: "Katze-Kuh",
      catCow_explanation: "Beginnen Sie im Vierfüßlerstand. Atmen Sie ein, während Sie den Bauch senken und nach oben schauen (Kuh). Atmen Sie aus, während Sie den Rücken runden und das Kinn zur Brust ziehen (Katze).",
      birdDogLeft_name: "Vogel-Hund (Links)",
      birdDogLeft_explanation: "Beginnen Sie im Vierfüßlerstand. Strecken Sie den linken Arm nach vorne und das rechte Bein nach hinten. Halten.",
      birdDogRight_name: "Vogel-Hund (Rechts)",
      birdDogRight_explanation: "Beginnen Sie im Vierfüßlerstand. Strecken Sie den rechten Arm nach vorne und das linke Bein nach hinten. Halten.",
      bodyweightSquats_name: "Kniebeugen mit Körpergewicht",
      bodyweightSquats_explanation: "Stehen Sie mit schulterbreiten Füßen. Senken Sie Ihre Hüften, als ob Sie sich auf einen Stuhl setzen, halten Sie dabei die Brust oben und den Rücken gerade. Drücken Sie sich wieder nach oben.",
      pushUps_name: "Liegestütze",
      pushUps_explanation: "Beginnen Sie in einer hohen Planke. Senken Sie Ihren Körper ab, bis Ihre Brust fast den Boden berührt, halten Sie Ihren Körper gerade. Drücken Sie sich wieder nach oben.",
      gluteBridge_name: "Gesäßbrücke",
      gluteBridge_explanation: "Legen Sie sich auf den Rücken, Knie gebeugt, Füße flach auf dem Boden. Heben Sie die Hüften an, bis Ihr Körper eine gerade Linie von den Schultern bis zu den Knien bildet. Spannen Sie das Gesäß an, dann senken.",
      superman_name: "Superman",
      superman_explanation: "Legen Sie sich auf den Bauch, strecken Sie die Arme nach vorne. Heben Sie gleichzeitig Arme, Brust und Beine vom Boden ab. Halten und senken.",
      bicycleCrunches_name: "Fahrrad-Crunches",
      bicycleCrunches_explanation: "Legen Sie sich auf den Rücken, Hände hinter den Kopf. Führen Sie abwechselnd den Ellbogen zum gegenüberliegenden Knie, während Sie das andere Bein strecken.",
      reverseCrunch_name: "Umgekehrter Crunch",
      reverseCrunch_explanation: "Legen Sie sich auf den Rücken, Knie gebeugt. Spannen Sie die Bauchmuskeln an, um die Hüften vom Boden zu heben und die Knie zur Brust zu ziehen. Langsam senken.",
      hollowHold_name: "Hohlhaltung",
      hollowHold_explanation: "Legen Sie sich auf den Rücken, heben Sie Kopf, Schultern und Beine leicht vom Boden ab und bilden Sie eine 'Boot'- oder 'Bananen'-Form.",
      flutterKicks_name: "Flatterkicks",
      flutterKicks_explanation: "Legen Sie sich auf den Rücken. Führen Sie kleine, schnelle, abwechselnde vertikale Tritte mit den Beinen aus.",
      sidePlankRight_name: "Seitstütz (Rechts)",
      sidePlankRight_explanation: "Legen Sie sich auf die rechte Seite, stützen Sie das Gewicht auf dem rechten Unterarm ab, heben Sie die Hüften, bis der Körper eine gerade Linie bildet.",
      sidePlankLeft_name: "Seitstütz (Links)",
      sidePlankLeft_explanation: "Legen Sie sich auf die linke Seite, stützen Sie das Gewicht auf dem linken Unterarm ab, heben Sie die Hüften, bis der Körper eine gerade Linie bildet.",
      mountainClimbers_name: "Bergsteiger",
      mountainClimbers_explanation: "Beginnen Sie in einer hohen Planke. Bringen Sie abwechselnd die Knie in einer laufenden Bewegung zur Brust.",
      russianTwist_name: "Russischer Twist",
      russianTwist_explanation: "Setzen Sie sich mit gebeugten Knien hin, lehnen Sie sich zurück und drehen Sie den Oberkörper von Seite zu Seite, wobei Sie mit den Händen den Boden berühren.",
      plank_name: "Planke",
      plank_explanation: "Halten Sie die Liegestützposition auf den Unterarmen und achten Sie auf eine gerade Linie von Kopf bis Fersen.",
    }
  },
  es: {
    mute: 'Silenciar',
    unmute: 'Activar sonido',
    restDuration: 'Duración del descanso',
    exerciseDurationMultiplier: 'Multiplicador de duración',
    fullWorkoutRoutine: 'Rutina de entrenamiento completa',
    startWorkout: 'Empezar entrenamiento',
    startOver: 'Empezar de nuevo',
    totalTimeLeft: 'Tiempo total restante:',
    movement: 'Movimiento:',
    exerciseAnimation: 'Animación del ejercicio',
    next: 'Siguiente:',
    finalRoundComplete: '¡Última ronda completada!',
    coolDown: 'Tiempo para enfriar y estirar.',
    goBack: 'Atrás',
    skipRest: 'Saltar descanso',
    skipExercise: 'Saltar ejercicio',
    pause: 'Pausa',
    pauseRest: 'Pausa (Descanso)',
    resume: 'REANUDAR',
    paused: 'EN PAUSA',
    total: 'Total:',
    exercise: 'Ejercicio',
    of: 'de',
    rest: 'DESCANSO',
    round: 'Ronda',
    complete: 'Completado',
    workoutTitle: 'Entrenamiento de Core y Espalda',
    clickStart: 'Esta rutina de cuerpo completo fortalece tu core y espalda. Ajusta la configuración a continuación y presiona Empezar cuando estés listo.',
    workoutComplete: '¡Entrenamiento completado!',
    workoutCompleteMessage: '🥳 ¡Increíble trabajo! Lo lograste.',
    exercises: {
      catCow_name: "Gato-Vaca",
      catCow_explanation: "Comienza a cuatro patas. Inhala mientras bajas el abdomen y miras hacia arriba (Vaca). Exhala mientras redondeas la columna y metes la barbilla (Gato).",
      birdDogLeft_name: "Pájaro-Perro (izquierda)",
      birdDogLeft_explanation: "Comienza a cuatro patas. Extiende el brazo izquierdo hacia adelante y la pierna derecha hacia atrás. Mantén.",
      birdDogRight_name: "Pájaro-Perro (derecha)",
      birdDogRight_explanation: "Comienza a cuatro patas. Extiende el brazo derecho hacia adelante y la pierna izquierda hacia atrás. Mantén.",
      bodyweightSquats_name: "Sentadillas con peso corporal",
      bodyweightSquats_explanation: "Párate con los pies a la anchura de los hombros. Baja las caderas como si te sentaras en una silla, manteniendo el pecho erguido y la espalda recta. Vuelve a subir.",
      pushUps_name: "Flexiones",
      pushUps_explanation: "Comienza en una plancha alta. Baja el cuerpo hasta que el pecho casi toque el suelo, manteniendo el cuerpo recto. Vuelve a subir.",
      gluteBridge_name: "Puente de glúteos",
      gluteBridge_explanation: "Acuéstate boca arriba, rodillas dobladas, pies planos en el suelo. Levanta las caderas hasta que tu cuerpo forme una línea recta desde los hombros hasta las rodillas. Aprieta los glúteos y luego baja.",
      superman_name: "Superman",
      superman_explanation: "Acuéstate boca abajo, extiende los brazos hacia adelante. Levanta simultáneamente brazos, pecho y piernas del suelo. Mantén y baja.",
      bicycleCrunches_name: "Abdominales bicicleta",
      bicycleCrunches_explanation: "Acuéstate boca arriba, manos detrás de la cabeza. Lleva alternativamente el codo a la rodilla opuesta mientras extiendes la otra pierna.",
      reverseCrunch_name: "Abdominales inversos",
      reverseCrunch_explanation: "Acuéstate boca arriba, rodillas dobladas. Contrae los abdominales para levantar las caderas del suelo, llevando las rodillas hacia el pecho. Baja lentamente.",
      hollowHold_name: "Posición hueca",
      hollowHold_explanation: "Acuéstate boca arriba, levanta la cabeza, los hombros y las piernas ligeramente del suelo, formando una forma de 'barco' o 'plátano'.",
      flutterKicks_name: "Patadas de aleteo",
      flutterKicks_explanation: "Acuéstate boca arriba. Realiza pequeñas, rápidas y alternas patadas verticales con las piernas.",
      sidePlankRight_name: "Plancha lateral (derecha)",
      sidePlankRight_explanation: "Acuéstate sobre tu lado derecho, apoya el peso en tu antebrazo derecho, levanta las caderas hasta que el cuerpo forme una línea recta.",
      sidePlankLeft_name: "Plancha lateral (izquierda)",
      sidePlankLeft_explanation: "Acuéstate sobre tu lado izquierdo, apoya el peso en tu antebrazo izquierdo, levanta las caderas hasta que el cuerpo forme una línea recta.",
      mountainClimbers_name: "Escaladores",
      mountainClimbers_explanation: "Comienza en una plancha alta. Lleva alternativamente las rodillas hacia el pecho en un movimiento de carrera.",
      russianTwist_name: "Giro ruso",
      russianTwist_explanation: "Siéntate con las rodillas dobladas, inclínate hacia atrás y gira el torso de lado a lado, tocando el suelo con las manos.",
      plank_name: "Plancha",
      plank_explanation: "Mantén la posición de flexión sobre los antebrazos, manteniendo una línea recta desde la cabeza hasta los talones.",
    }
  },
  uk: {
    mute: 'Вимкнути звук',
    unmute: 'Увімкнути звук',
    restDuration: 'Тривалість відпочинку',
    exerciseDurationMultiplier: 'Множник тривалості',
    fullWorkoutRoutine: 'Програма тренування',
    startWorkout: 'Почати тренування',
    startOver: 'Почати спочатку',
    totalTimeLeft: 'Загальний час:',
    movement: 'Рух:',
    exerciseAnimation: 'Анімація вправи',
    next: 'Наступна:',
    finalRoundComplete: 'Останній раунд завершено!',
    coolDown: 'Час для заминки та розтяжки.',
    goBack: 'Назад',
    skipRest: 'Пропустити відпочинок',
    skipExercise: 'Пропустити вправу',
    pause: 'Пауза',
    pauseRest: 'Пауза (відпочинок)',
    resume: 'ПРОДОВЖИТИ',
    paused: 'ПАУЗА',
    total: 'Всього:',
    exercise: 'Вправа',
    of: 'з',
    rest: 'ВІДПОЧИНОК',
    round: 'Раунд',
    complete: 'Виконано',
    workoutTitle: 'Тренування для Кору та Спини',
    clickStart: 'Це тренування для всього тіла зміцнює ваш кор та спину. Налаштуйте параметри нижче, а потім натисніть Старт, коли будете готові.',
    workoutComplete: 'Тренування завершено!',
    workoutCompleteMessage: '🥳 Чудова робота! Ви впорались.',
    exercises: {
      catCow_name: "Кішка-Корова",
      catCow_explanation: "Почніть навкарачки. Вдихніть, прогинаючи спину і дивлячись вгору (Корова). Видихніть, округлюючи спину і притискаючи підборіддя до грудей (Кішка).",
      birdDogLeft_name: "Птах-Собака (ліва)",
      birdDogLeft_explanation: "Почніть навкарачки. Витягніть ліву руку вперед і праву ногу назад. Утримуйте.",
      birdDogRight_name: "Птах-Собака (права)",
      birdDogRight_explanation: "Почніть навкарачки. Витягніть праву руку вперед і ліву ногу назад. Утримуйте.",
      bodyweightSquats_name: "Присідання з власною вагою",
      bodyweightSquats_explanation: "Станьте, ноги на ширині плечей. Опускайте стегна, ніби сідаєте на стілець, тримаючи груди прямо і спину рівно. Поверніться у вихідне положення.",
      pushUps_name: "Віджимання",
      pushUps_explanation: "Почніть у високій планці. Опускайте тіло, доки груди майже не торкнуться підлоги, тримаючи тіло прямо. Поверніться у вихідне положення.",
      gluteBridge_name: "Сідничний місток",
      gluteBridge_explanation: "Ляжте на спину, коліна зігнуті, стопи на підлозі. Піднімайте стегна, доки тіло не утворить пряму лінію від плечей до колін. Напружте сідниці, потім опустіться.",
      superman_name: "Супермен",
      superman_explanation: "Ляжте на живіт, витягніть руки вперед. Одночасно підніміть руки, груди і ноги від підлоги. Утримуйте і опустіться.",
      bicycleCrunches_name: "Велосипедні скручування",
      bicycleCrunches_explanation: "Ляжте на спину, руки за головою. По черзі підводьте лікоть до протилежного коліна, випрямляючи іншу ногу.",
      reverseCrunch_name: "Зворотні скручування",
      reverseCrunch_explanation: "Ляжте на спину, коліна зігнуті. Напружте прес, щоб підняти стегна від підлоги, підтягуючи коліна до грудей. Повільно опустіться.",
      hollowHold_name: "Порожнисте утримання",
      hollowHold_explanation: "Ляжте на спину, підніміть голову, плечі і ноги трохи від землі, утворюючи форму 'човна' або 'банана'.",
      flutterKicks_name: "Махи ногами (ножиці)",
      flutterKicks_explanation: "Ляжте на спину. Виконуйте невеликі, швидкі, чергуються вертикальні махи ногами.",
      sidePlankRight_name: "Бічна планка (права)",
      sidePlankRight_explanation: "Ляжте на правий бік, спираючись на праве передпліччя, підніміть стегна, доки тіло не утворить пряму лінію.",
      sidePlankLeft_name: "Бічна планка (ліва)",
      sidePlankLeft_explanation: "Ляжте на лівий бік, спираючись на ліве передпліччя, підніміть стегна, доки тіло не утворить пряму лінію.",
      mountainClimbers_name: "Скелелази",
      mountainClimbers_explanation: "Почніть у високій планці. По черзі підтягуйте коліна до грудей у біговому русі.",
      russianTwist_name: "Російський твіст",
      russianTwist_explanation: "Сядьте, коліна зігнуті, відхиліться назад і повертайте тулуб з боку в бік, торкаючись руками підлоги.",
      plank_name: "Планка",
      plank_explanation: "Утримуйте положення віджимання на передпліччях, зберігаючи пряму лінію від голови до п'ят.",
    }
  }
};

/** Helper function to check if a language code is one of our supported languages. */
function isSupportedLanguage(lang: string): lang is Language {
  return ['en', 'ru', 'de', 'es', 'uk'].includes(lang);
}

/** Determines the initial language based on user preference, browser settings, or a default. */
function getInitialLanguage(): Language {
  // 1. Check for a previously selected language in localStorage (user override).
  if (typeof window !== 'undefined' && window.localStorage) {
    const savedLang = localStorage.getItem(LOCAL_STORAGE_KEY_LANGUAGE);
    if (savedLang && isSupportedLanguage(savedLang)) {
      return savedLang;
    }
  }

  // 2. Detect browser language preference.
  if (typeof window !== 'undefined' && window.navigator) {
    // `navigator.languages` is an array of preferred languages, sorted by preference.
    // We iterate through it and use the first one that our app supports.
    const browserLangs = window.navigator.languages || [window.navigator.language];
    for (const lang of browserLangs) {
      const primaryLang = lang.split('-')[0]; // 'en-US' -> 'en'
      if (isSupportedLanguage(primaryLang)) {
        return primaryLang;
      }
    }
  }

  // 3. Default to English if no preference is found or supported.
  return 'en';
}

@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  language = signal<Language>(getInitialLanguage());
  dictionary = computed(() => dictionaries[this.language()]);

  constructor() {
    effect(() => {
      const lang = this.language();
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(LOCAL_STORAGE_KEY_LANGUAGE, lang);
      }
    });
  }

  setLanguage(lang: Language) {
    this.language.set(lang);
  }
}
