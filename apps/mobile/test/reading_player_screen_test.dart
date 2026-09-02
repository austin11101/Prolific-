import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:prolific_mobile/app/navigation/app_router.dart';
import 'package:prolific_mobile/app/theme/prolific_theme.dart';
import 'package:prolific_mobile/core/audio/tutorial_audio_service.dart';
import 'package:prolific_mobile/core/reading/wpm_timer_service.dart';
import 'package:prolific_mobile/features/lesson_setup/presentation/lesson_preview_screen.dart';
import 'package:prolific_mobile/features/reading_player/presentation/reading_player_model.dart';
import 'package:prolific_mobile/features/reading_player/presentation/reading_player_screen.dart';

// ── Fakes ────────────────────────────────────────────────────────────────────

class FakeTutorialAudioService implements TutorialAudioService {
  final calls = <String>[];
  bool failLoad = false;
  bool failPlay = false;
  bool loaded = false;
  bool playing = false;
  bool disposed = false;

  @override
  Future<void> load() async {
    calls.add('load');
    if (failLoad) {
      throw const TutorialAudioPlaybackException('Fake load failure.');
    }
    loaded = true;
  }

  @override
  Future<void> play() async {
    calls.add('play');
    if (disposed) {
      throw const TutorialAudioPlaybackException('Fake disposed.');
    }
    if (failPlay) {
      throw const TutorialAudioPlaybackException('Fake play failure.');
    }
    if (playing) return;
    loaded = true;
    playing = true;
  }

  @override
  Future<void> pause() async {
    calls.add('pause');
    playing = false;
  }

  @override
  Future<void> resume() async {
    calls.add('resume');
    if (disposed) {
      throw const TutorialAudioPlaybackException('Fake disposed.');
    }
    playing = true;
  }

  @override
  Future<void> stop() async {
    calls.add('stop');
    playing = false;
  }

  @override
  Future<void> seekToStart() async {
    calls.add('seekToStart');
  }

  @override
  Future<void> dispose() async {
    calls.add('dispose');
    disposed = true;
    playing = false;
  }
}

/// A [WpmTimerService] that exposes a [tick] method so tests can fire ticks
/// synchronously without real timers.
class FakeWpmTimerService implements WpmTimerService {
  VoidCallback? _onTick;
  bool _active = false;
  bool _disposed = false;

  /// The WPM value passed to the most recent [start] call.
  int? lastWpm;

  /// Number of times [start] was called.
  int startCount = 0;

  /// Number of times [stop] was called.
  int stopCount = 0;

  @override
  bool get isActive => _active;

  @override
  void start({required int wpm, required VoidCallback onTick}) {
    if (_disposed) return;
    _active = true;
    _onTick = onTick;
    lastWpm = wpm;
    startCount++;
  }

  @override
  void stop() {
    _active = false;
    stopCount++;
  }

  @override
  void dispose() {
    _active = false;
    _disposed = true;
  }

  /// Fires the registered tick callback once.
  void tick() {
    _onTick?.call();
  }
}

// ── Harness ──────────────────────────────────────────────────────────────────

Widget harness({
  ReadingPlayerArguments? arguments,
  double textScale = 1,
  FakeTutorialAudioService? audioService,
  FakeWpmTimerService? wpmTimer,
}) => MaterialApp(
  theme: ProlificTheme.light(),
  onGenerateRoute: AppRouter.onGenerateRoute,
  home: Builder(
    builder: (context) => MediaQuery(
      data: MediaQuery.of(
        context,
      ).copyWith(textScaler: TextScaler.linear(textScale)),
      child: ReadingPlayerScreen(
        arguments: arguments,
        audioService: audioService ?? FakeTutorialAudioService(),
        wpmTimerService: wpmTimer ?? FakeWpmTimerService(),
      ),
    ),
  ),
);

ReadingPlayerArguments shortLesson({int initialWordIndex = 0}) =>
    ReadingPlayerArguments(
      initialWordIndex: initialWordIndex,
      lesson: ReadingLessonPreview.fromLocalText(
        title: 'Pangolin Preview',
        topic: 'Amazing African Animals',
        language: 'English',
        difficulty: 'Beginner',
        pace: 'Easy - 100 WPM',
        paragraph: 'Pangolins curl up.',
      ),
    );

void setViewport(WidgetTester tester, Size size) {
  tester.view.physicalSize = size;
  tester.view.devicePixelRatio = 1;
}

// ── Tests ────────────────────────────────────────────────────────────────────

void main() {
  tearDown(() {
    TestWidgetsFlutterBinding.instance.platformDispatcher.clearAllTestValues();
  });

  // ── Model tests ─────────────────────────────────────────────────────────

  test(
    'temporary tokenizer keeps punctuation and whitespace in display order',
    () {
      const paragraph = 'Pangolins curl up.';
      final result = tokenizePreviewText(paragraph);

      expect(result.words, ['Pangolins', 'curl', 'up']);
      expect(result.segments.map((segment) => segment.text).join(), paragraph);
      expect(result.segments.last.isEligibleWord, isFalse);
      expect(result.segments.last.text, '.');
    },
  );

  test('parsePaceWpm extracts WPM from pace strings', () {
    expect(parsePaceWpm('Easy - 100 WPM'), 100);
    expect(parsePaceWpm('Medium - 150 WPM'), 150);
    expect(parsePaceWpm('Hard - 200 WPM'), 200);
    expect(parsePaceWpm('200wpm'), 200);
    expect(parsePaceWpm(''), 150);
    expect(parsePaceWpm('No number here'), 150);
  });

  // ── Widget rendering ─────────────────────────────────────────────────────

  testWidgets('renders setup metadata, paragraph, phase, and first word', (
    tester,
  ) async {
    await tester.pumpWidget(harness(arguments: shortLesson()));

    expect(find.text('Pangolin Preview'), findsOneWidget);
    expect(find.text('Amazing African Animals'), findsOneWidget);
    expect(find.text('English'), findsOneWidget);
    expect(find.text('Beginner'), findsOneWidget);
    expect(find.text('Easy - 100 WPM'), findsOneWidget);
    expect(find.text('Tutorial - Ready'), findsOneWidget);
    expect(find.text('Word 1 of 3'), findsOneWidget);
    expect(find.byKey(const Key('reading-paragraph')), findsOneWidget);
  });

  testWidgets(
    'manual controls advance, move back, restart, and respect bounds in tutorial phase',
    (tester) async {
      await tester.pumpWidget(harness(arguments: shortLesson()));

      // Previous word should be disabled at index 0.
      final previous = tester.widget<OutlinedButton>(
        find.widgetWithText(OutlinedButton, 'Previous word'),
      );
      expect(previous.onPressed, isNull);

      await tester.ensureVisible(find.text('Next word'));
      await tester.tap(find.text('Next word'));
      await tester.pump();
      expect(find.text('Word 2 of 3'), findsOneWidget);

      await tester.tap(find.text('Previous word'));
      await tester.pump();
      expect(find.text('Word 1 of 3'), findsOneWidget);

      await tester.tap(find.text('Next word'));
      await tester.pump();
      await tester.tap(find.text('Restart preview'));
      await tester.pump();
      expect(find.text('Word 1 of 3'), findsOneWidget);
    },
  );

  testWidgets('invalid initial indexes recover to a safe eligible word', (
    tester,
  ) async {
    await tester.pumpWidget(
      harness(arguments: shortLesson(initialWordIndex: 999)),
    );
    expect(find.text('Word 3 of 3'), findsOneWidget);

    await tester.pumpWidget(
      harness(arguments: shortLesson(initialWordIndex: -10)),
    );
    expect(find.text('Word 1 of 3'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets(
    'tutorial controls load, play, pause, resume, and restart local audio',
    (tester) async {
      final audio = FakeTutorialAudioService();
      final wpmTimer = FakeWpmTimerService();
      await tester.pumpWidget(
        harness(
          arguments: shortLesson(),
          audioService: audio,
          wpmTimer: wpmTimer,
        ),
      );

      expect(find.textContaining('bundled local MP3 sample'), findsOneWidget);

      await tester.ensureVisible(find.text('Play tutorial audio'));
      await tester.tap(find.text('Play tutorial audio'));
      await tester.pump();
      expect(find.text('Tutorial - Playing'), findsOneWidget);
      expect(
        find.textContaining('Words are advancing automatically'),
        findsOneWidget,
      );
      expect(audio.calls, ['load', 'play']);
      expect(wpmTimer.isActive, isTrue);

      await tester.tap(find.text('Pause audio'));
      await tester.pump();
      expect(find.text('Tutorial - Paused'), findsOneWidget);
      expect(audio.calls, ['load', 'play', 'pause']);
      expect(wpmTimer.isActive, isFalse);
      // Manual controls are hidden entirely in tutorialPaused.
      expect(find.text('Next word'), findsNothing);
      expect(find.text('Previous word'), findsNothing);

      await tester.tap(find.text('Resume audio'));
      await tester.pump();
      expect(find.text('Tutorial - Playing'), findsOneWidget);
      expect(audio.calls, ['load', 'play', 'pause', 'resume']);
      expect(wpmTimer.isActive, isTrue);

      await tester.tap(find.text('Restart preview'));
      await tester.pump();
      expect(find.text('Word 1 of 3'), findsOneWidget);
      expect(audio.calls, [
        'load',
        'play',
        'pause',
        'resume',
        'seekToStart',
        'play',
      ]);
    },
  );

  // ── Auto-advance: practice ────────────────────────────────────────────────

  testWidgets('practice auto-advances words via WPM timer ticks', (
    tester,
  ) async {
    final wpmTimer = FakeWpmTimerService();
    await tester.pumpWidget(
      harness(arguments: shortLesson(), wpmTimer: wpmTimer),
    );

    // Enter practiceReady via Continue to practice.
    await tester.ensureVisible(find.text('Continue to practice'));
    await tester.tap(find.text('Continue to practice'));
    await tester.pump();
    expect(find.text('Practice - Ready'), findsOneWidget);

    // Start practice — timer should start.
    await tester.ensureVisible(find.text('Start practice'));
    await tester.tap(find.text('Start practice'));
    await tester.pump();
    expect(find.text('Practice - Auto-advancing'), findsOneWidget);
    expect(wpmTimer.isActive, isTrue);
    expect(wpmTimer.lastWpm, 100); // Parsed from 'Easy - 100 WPM'

    // Manual prev/next are hidden in practice mode.
    expect(find.text('Next word'), findsNothing);
    expect(find.text('Previous word'), findsNothing);

    // First tick advances to word 2.
    wpmTimer.tick();
    await tester.pump();
    expect(find.text('Word 2 of 3'), findsOneWidget);

    // Second tick advances to word 3 (last).
    wpmTimer.tick();
    await tester.pump();
    expect(find.text('Word 3 of 3'), findsOneWidget);

    // Third tick: on last word → complete.
    wpmTimer.tick();
    await tester.pump();
    expect(find.text('Practice - Visual preview complete'), findsOneWidget);
    expect(wpmTimer.isActive, isFalse);
  });

  testWidgets(
    'reaching the last word via timer tick sets phase to previewComplete',
    (tester) async {
      final wpmTimer = FakeWpmTimerService();
      await tester.pumpWidget(
        harness(arguments: shortLesson(), wpmTimer: wpmTimer),
      );

      await tester.ensureVisible(find.text('Continue to practice'));
      await tester.tap(find.text('Continue to practice'));
      await tester.pump();
      await tester.ensureVisible(find.text('Start practice'));
      await tester.tap(find.text('Start practice'));
      await tester.pump();

      // Advance past the last word.
      wpmTimer.tick(); // word 2
      wpmTimer.tick(); // word 3 (last)
      wpmTimer.tick(); // triggers complete
      await tester.pump();

      expect(find.text('Practice - Visual preview complete'), findsOneWidget);
      expect(
        find.textContaining('Practice complete'),
        findsOneWidget,
      );
    },
  );

  testWidgets('pause stops timer advancement and resume restarts it', (
    tester,
  ) async {
    final wpmTimer = FakeWpmTimerService();
    await tester.pumpWidget(
      harness(arguments: shortLesson(), wpmTimer: wpmTimer),
    );

    await tester.ensureVisible(find.text('Continue to practice'));
    await tester.tap(find.text('Continue to practice'));
    await tester.pump();
    await tester.ensureVisible(find.text('Start practice'));
    await tester.tap(find.text('Start practice'));
    await tester.pump();

    expect(wpmTimer.isActive, isTrue);
    wpmTimer.tick(); // word 2
    await tester.pump();
    expect(find.text('Word 2 of 3'), findsOneWidget);

    // Pause via the Pause button in the control bar (OutlinedButton).
    await tester.ensureVisible(find.widgetWithText(OutlinedButton, 'Pause'));
    await tester.tap(find.widgetWithText(OutlinedButton, 'Pause'));
    await tester.pump();
    expect(wpmTimer.isActive, isFalse);
    expect(find.text('Resume'), findsWidgets); // appears in both bar and button

    // Word does not advance while paused.
    expect(find.text('Word 2 of 3'), findsOneWidget);

    // Resume restarts the timer.
    await tester.ensureVisible(find.widgetWithText(OutlinedButton, 'Resume'));
    await tester.tap(find.widgetWithText(OutlinedButton, 'Resume'));
    await tester.pump();
    expect(wpmTimer.isActive, isTrue);

    wpmTimer.tick(); // word 3
    await tester.pump();
    expect(find.text('Word 3 of 3'), findsOneWidget);
  });

  testWidgets('practice auto-advance: primary button also pauses and resumes', (
    tester,
  ) async {
    final wpmTimer = FakeWpmTimerService();
    await tester.pumpWidget(
      harness(arguments: shortLesson(), wpmTimer: wpmTimer),
    );

    await tester.ensureVisible(find.text('Continue to practice'));
    await tester.tap(find.text('Continue to practice'));
    await tester.pump();
    await tester.ensureVisible(find.text('Start practice'));
    await tester.tap(find.text('Start practice'));
    await tester.pump();

    // Primary button label is "Pause" while running.
    await tester.ensureVisible(find.widgetWithText(FilledButton, 'Pause'));
    await tester.tap(find.widgetWithText(FilledButton, 'Pause'));
    await tester.pump();
    expect(wpmTimer.isActive, isFalse);

    // Primary button label changes to "Resume".
    await tester.ensureVisible(find.widgetWithText(FilledButton, 'Resume'));
    await tester.tap(find.widgetWithText(FilledButton, 'Resume'));
    await tester.pump();
    expect(wpmTimer.isActive, isTrue);
  });

  testWidgets(
    'tutorial phase WPM timer starts when audio plays and stops on pause',
    (tester) async {
      final audio = FakeTutorialAudioService();
      final wpmTimer = FakeWpmTimerService();
      await tester.pumpWidget(
        harness(
          arguments: shortLesson(),
          audioService: audio,
          wpmTimer: wpmTimer,
        ),
      );

      await tester.ensureVisible(find.text('Play tutorial audio'));
      await tester.tap(find.text('Play tutorial audio'));
      await tester.pump();
      expect(wpmTimer.isActive, isTrue);

      // Timer advances words during tutorial.
      wpmTimer.tick();
      await tester.pump();
      expect(find.text('Word 2 of 3'), findsOneWidget);

      // Pausing audio stops the timer.
      await tester.tap(find.text('Pause audio'));
      await tester.pump();
      expect(wpmTimer.isActive, isFalse);
      expect(find.text('Word 2 of 3'), findsOneWidget); // position preserved

      // Resuming audio restarts the timer.
      await tester.tap(find.text('Resume audio'));
      await tester.pump();
      expect(wpmTimer.isActive, isTrue);
    },
  );

  // ── Existing behaviour ────────────────────────────────────────────────────

  testWidgets(
    'practice is application-silent and completes only as a preview',
    (tester) async {
      final audio = FakeTutorialAudioService();
      final wpmTimer = FakeWpmTimerService();
      await tester.pumpWidget(
        harness(
          arguments: shortLesson(),
          audioService: audio,
          wpmTimer: wpmTimer,
        ),
      );

      await tester.ensureVisible(find.text('Play tutorial audio'));
      await tester.tap(find.text('Play tutorial audio'));
      await tester.pump();

      await tester.ensureVisible(find.text('Continue to practice'));
      await tester.tap(find.text('Continue to practice'));
      await tester.pump();
      expect(find.text('Practice - Ready'), findsOneWidget);
      expect(audio.calls, ['load', 'play', 'stop']);
      expect(
        find.textContaining('Words will advance automatically'),
        findsOneWidget,
      );
      expect(find.byIcon(Icons.mic), findsNothing);

      await tester.ensureVisible(find.text('Start practice'));
      await tester.tap(find.text('Start practice'));
      await tester.pump();
      // Drive completion via ticks instead of manual next-word.
      wpmTimer.tick(); // word 2
      await tester.pump();
      wpmTimer.tick(); // word 3
      await tester.pump();
      wpmTimer.tick(); // complete
      await tester.pump();

      expect(find.text('Practice - Visual preview complete'), findsOneWidget);
      expect(
        find.textContaining('Practice complete'),
        findsOneWidget,
      );
      expect(find.textContaining('saved progress'), findsNothing);

      await tester.tap(find.widgetWithText(FilledButton, 'Restart preview'));
      await tester.pump();
      expect(find.text('Word 1 of 3'), findsOneWidget);
      expect(find.text('Tutorial - Ready'), findsOneWidget);
    },
  );

  testWidgets('lesson preview replaces the placeholder on the existing route', (
    tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: ProlificTheme.light(),
        onGenerateRoute: AppRouter.onGenerateRoute,
        home: const LessonPreviewScreen(),
      ),
    );

    await tester.ensureVisible(find.text('Open player preview'));
    await tester.tap(find.text('Open player preview'));
    await tester.pumpAndSettle();

    expect(find.text('Reading player preview'), findsOneWidget);
    expect(find.text('South African Landscapes'), findsOneWidget);
    expect(find.text('Word 1 of 21'), findsOneWidget);
  });

  testWidgets('completion actions return home or change setup', (tester) async {
    Future<void> completePreview(FakeWpmTimerService wpmTimer) async {
      await tester.ensureVisible(find.text('Continue to practice'));
      await tester.tap(find.text('Continue to practice'));
      await tester.pump();
      await tester.ensureVisible(find.text('Start practice'));
      await tester.tap(find.text('Start practice'));
      await tester.pump();
      wpmTimer.tick(); // word 2
      await tester.pump();
      wpmTimer.tick(); // word 3
      await tester.pump();
      wpmTimer.tick(); // complete
      await tester.pump();
    }

    final homeWpm = FakeWpmTimerService();
    final homeAudio = FakeTutorialAudioService();
    await tester.pumpWidget(
      harness(
        arguments: shortLesson(),
        audioService: homeAudio,
        wpmTimer: homeWpm,
      ),
    );
    await completePreview(homeWpm);
    await tester.tap(find.widgetWithText(OutlinedButton, 'Return home'));
    await tester.pumpAndSettle();
    expect(find.text('Hello, reader!'), findsOneWidget);
    expect(homeAudio.calls, contains('stop'));

    final setupWpm = FakeWpmTimerService();
    final setupAudio = FakeTutorialAudioService();
    await tester.pumpWidget(const SizedBox.shrink());
    await tester.pumpWidget(
      harness(
        arguments: shortLesson(),
        audioService: setupAudio,
        wpmTimer: setupWpm,
      ),
    );
    await completePreview(setupWpm);
    await tester.tap(find.widgetWithText(OutlinedButton, 'Change setup'));
    await tester.pumpAndSettle();
    expect(find.text('Choose your reading pace'), findsOneWidget);
    expect(setupAudio.calls, contains('stop'));
  });

  testWidgets('leaving the screen stops and disposes the local audio service', (
    tester,
  ) async {
    final audio = FakeTutorialAudioService();
    await tester.pumpWidget(
      harness(arguments: shortLesson(), audioService: audio),
    );

    await tester.ensureVisible(find.text('Play tutorial audio'));
    await tester.tap(find.text('Play tutorial audio'));
    await tester.pump();
    await tester.pumpWidget(const SizedBox.shrink());
    await tester.pump();

    expect(audio.calls, containsAllInOrder(['stop', 'dispose']));
    expect(audio.disposed, isTrue);
  });

  testWidgets('audio load failures recover without leaving playback active', (
    tester,
  ) async {
    final audio = FakeTutorialAudioService()..failLoad = true;
    await tester.pumpWidget(
      harness(arguments: shortLesson(), audioService: audio),
    );

    await tester.ensureVisible(find.text('Play tutorial audio'));
    await tester.tap(find.text('Play tutorial audio'));
    await tester.pump();

    expect(find.text('Fake load failure.'), findsOneWidget);
    expect(find.text('Tutorial - Ready'), findsOneWidget);
    expect(audio.playing, isFalse);

    audio.failLoad = false;
    await tester.tap(find.text('Play tutorial audio'));
    await tester.pump();

    expect(find.text('Tutorial - Playing'), findsOneWidget);
    expect(audio.calls.where((call) => call == 'load'), hasLength(2));
    expect(audio.calls.where((call) => call == 'play'), hasLength(1));
  });

  testWidgets('missing lesson arguments show friendly recovery actions', (
    tester,
  ) async {
    await tester.pumpWidget(harness());

    expect(find.text('This lesson preview is not available'), findsOneWidget);
    expect(find.text('Change setup'), findsOneWidget);
    expect(find.text('Return home'), findsOneWidget);
    expect(find.textContaining('Exception'), findsNothing);
  });

  testWidgets(
    'compact, expanded, and 200 percent text layouts do not overflow',
    (tester) async {
      for (final configuration in <(Size, double)>[
        (const Size(390, 844), 1),
        (const Size(1440, 900), 1),
        (const Size(430, 932), 2),
      ]) {
        setViewport(tester, configuration.$1);
        await tester.pumpWidget(
          harness(arguments: shortLesson(), textScale: configuration.$2),
        );
        await tester.pump();
        expect(tester.takeException(), isNull);
        expect(find.text('Change setup'), findsOneWidget);
      }

      setViewport(tester, const Size(1440, 900));
      await tester.pumpWidget(harness(arguments: shortLesson()));
      expect(find.byType(NavigationRail), findsOneWidget);
      final surface = tester.widget<ConstrainedBox>(
        find.byKey(const Key('reading-surface-width')),
      );
      expect(surface.constraints.maxWidth, 720);
    },
  );

  // ── Architecture guard ────────────────────────────────────────────────────

  test(
    'reading player source has no prohibited runtime architecture imports',
    () {
      final directory = Directory('lib/features/reading_player');
      final source = directory
          .listSync(recursive: true)
          .whereType<File>()
          .where((file) => file.path.endsWith('.dart'))
          .map((file) => file.readAsStringSync())
          .join('\n');
      final imports = source
          .split('\n')
          .where((line) => line.trimLeft().startsWith('import '))
          .join('\n');

      for (final prohibited in <String>[
        'Timer(',
        'Stopwatch(',
        'just_audio',
        'package:dio',
        'package:http',
        'prisma',
        'database',
        'analytics',
        'authentication',
        'tutorial-audio',
        'azure_provider',
        'gtts_provider',
      ]) {
        expect(imports, isNot(contains(prohibited)), reason: prohibited);
      }
      expect(source, isNot(contains('Timer(')));
      expect(source, isNot(contains('Stopwatch(')));
    },
  );
}
