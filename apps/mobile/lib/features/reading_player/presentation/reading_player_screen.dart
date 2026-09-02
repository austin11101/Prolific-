import 'dart:async';
import 'dart:developer' as developer;

import 'package:flutter/material.dart';

import '../../../app/navigation/app_routes.dart';
import '../../../app/theme/design_tokens.dart';
import '../../../core/api/sessions_api_service.dart';
import '../../../core/audio/tutorial_audio_service.dart';
import '../../../core/presentation/layout/prolific_scaffold.dart';
import '../../../core/presentation/layout/responsive_layout.dart';
import '../../../core/presentation/widgets/prolific_buttons.dart';
import '../../../core/presentation/widgets/state_panel.dart';
import '../../../core/reading/wpm_timer_service.dart';
import '../../../core/services/app_services.dart';
import 'reading_player_model.dart';
import 'reading_player_widgets.dart';

class ReadingPlayerScreen extends StatefulWidget {
  const ReadingPlayerScreen({
    required this.arguments,
    this.audioService,
    this.wpmTimerService,
    super.key,
  });

  final ReadingPlayerArguments? arguments;
  final TutorialAudioService? audioService;
  final WpmTimerService? wpmTimerService;

  @override
  State<ReadingPlayerScreen> createState() => _ReadingPlayerScreenState();
}

class _ReadingPlayerScreenState extends State<ReadingPlayerScreen> {
  late int _selectedWordIndex;
  late final TutorialAudioService _audioService;
  late final WpmTimerService _wpmTimer;
  ReadingPlayerPresentationPhase _phase = ReadingPlayerPresentationPhase.ready;
  bool _audioLoaded = false;
  bool _audioBusy = false;
  bool _audioPlaying = false;
  String? _audioError;
  bool _practicePaused = false;
  DateTime? _practiceStartTime;
  // Unique ID for this practice session, used as the idempotency key.
  final String _sessionEventId = _generateUuid();

  ReadingLessonPreview? get _lesson => widget.arguments?.lesson;

  bool get _hasUsableLesson => _lesson?.isUsable ?? false;

  int get _wpm => parsePaceWpm(_lesson?.pace ?? '');

  @override
  void initState() {
    super.initState();
    _audioService =
        widget.audioService ??
        JustAudioTutorialAudioService(
          assetPath: TutorialAudioAssets.tutorialSample,
        );
    _wpmTimer = widget.wpmTimerService ?? PeriodicWpmTimerService();
    _selectedWordIndex = _safeInitialIndex();
  }

  @override
  void didUpdateWidget(covariant ReadingPlayerScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.arguments != widget.arguments) {
      _wpmTimer.stop();
      _stopTutorialAudio();
      _selectedWordIndex = _safeInitialIndex();
      _phase = ReadingPlayerPresentationPhase.ready;
      _practicePaused = false;
    }
  }

  @override
  void dispose() {
    _wpmTimer.dispose();
    unawaited(_disposeAudio());
    super.dispose();
  }

  int _safeInitialIndex() {
    final words = _lesson?.words ?? const <String>[];
    if (words.isEmpty) return 0;
    return (widget.arguments?.initialWordIndex ?? 0).clamp(0, words.length - 1);
  }

  // ── WPM timer helpers ────────────────────────────────────────────────────

  void _startWordTick() {
    final lesson = _lesson;
    if (lesson == null) return;
    _wpmTimer.start(
      wpm: _wpm,
      onTick: () {
        if (!mounted) {
          _wpmTimer.stop();
          return;
        }
        setState(() {
          final lastIndex = lesson.words.length - 1;
          if (_selectedWordIndex >= lastIndex) {
            _wpmTimer.stop();
            if (_phase == ReadingPlayerPresentationPhase.practicePreview) {
              _phase = ReadingPlayerPresentationPhase.previewComplete;
              _saveSession(wordsRead: lesson.words.length, isCompleted: true);
            } else if (_phase ==
                ReadingPlayerPresentationPhase.tutorialPreview) {
              // Tutorial finished advancing — stay in tutorialPreview;
              // audio completion is handled separately.
            }
          } else {
            _selectedWordIndex++;
          }
        });
      },
    );
  }

  void _stopWordTick() => _wpmTimer.stop();

  // ── Practice pause / resume ──────────────────────────────────────────────

  void _pausePractice() {
    _wpmTimer.stop();
    setState(() => _practicePaused = true);
  }

  void _resumePractice() {
    setState(() => _practicePaused = false);
    _startWordTick();
  }

  // ── Word navigation ──────────────────────────────────────────────────────

  void _previousWord() {
    if (_selectedWordIndex <= 0) return;
    setState(() => _selectedWordIndex--);
  }

  void _nextWord() {
    final lastIndex = _lesson!.words.length - 1;
    if (_selectedWordIndex >= lastIndex) return;
    setState(() {
      _selectedWordIndex++;
      if (_selectedWordIndex == lastIndex &&
          _phase == ReadingPlayerPresentationPhase.practicePreview) {
        _phase = ReadingPlayerPresentationPhase.previewComplete;
        _saveSession(wordsRead: _lesson!.words.length, isCompleted: true);
      }
    });
  }

  void _restart() async {
    _stopWordTick();
    if (_isTutorialPhase) {
      await _runAudioAction(() async {
        await _audioService.seekToStart();
        if (_audioPlaying ||
            _phase == ReadingPlayerPresentationPhase.tutorialPreview) {
          await _audioService.play();
          _audioPlaying = true;
        }
      });
      setState(() {
        _selectedWordIndex = 0;
      });
      if (_phase == ReadingPlayerPresentationPhase.tutorialPreview) {
        _startWordTick();
      }
    } else {
      setState(() {
        _selectedWordIndex = 0;
        _practicePaused = false;
        _phase = ReadingPlayerPresentationPhase.ready;
      });
    }
  }

  void _continueToPractice() async {
    _stopWordTick();
    await _stopTutorialAudio();
    if (!mounted) return;
    setState(() {
      _selectedWordIndex = 0;
      _practicePaused = false;
      _phase = ReadingPlayerPresentationPhase.practiceReady;
    });
  }

  void _primaryPhaseAction() async {
    switch (_phase) {
      case ReadingPlayerPresentationPhase.ready:
        await _startTutorialAudio();
      case ReadingPlayerPresentationPhase.tutorialPreview:
        await _pauseTutorialAudio();
      case ReadingPlayerPresentationPhase.tutorialPaused:
        await _resumeTutorialAudio();
      case ReadingPlayerPresentationPhase.practiceReady:
        setState(() {
          _phase = ReadingPlayerPresentationPhase.practicePreview;
          _practicePaused = false;
          _audioError = null;
          _practiceStartTime = DateTime.now();
        });
        _startWordTick();
      case ReadingPlayerPresentationPhase.practicePreview:
        if (_practicePaused) {
          _resumePractice();
        } else {
          _pausePractice();
        }
      case ReadingPlayerPresentationPhase.previewComplete:
        return;
    }
  }

  String get _primaryLabel => switch (_phase) {
    ReadingPlayerPresentationPhase.ready => 'Play tutorial audio',
    ReadingPlayerPresentationPhase.tutorialPreview => 'Pause audio',
    ReadingPlayerPresentationPhase.tutorialPaused => 'Resume audio',
    ReadingPlayerPresentationPhase.practiceReady => 'Start practice',
    ReadingPlayerPresentationPhase.practicePreview =>
      _practicePaused ? 'Resume' : 'Pause',
    ReadingPlayerPresentationPhase.previewComplete => 'Preview complete',
  };

  String get _phaseExplanation => switch (_phase) {
    ReadingPlayerPresentationPhase.ready =>
      'Tutorial audio uses one bundled local MP3 sample. The highlighted word is controlled manually and does not synchronize with audio.',
    ReadingPlayerPresentationPhase.tutorialPreview =>
      'Audio is playing. Words are advancing automatically.',
    ReadingPlayerPresentationPhase.tutorialPaused =>
      'Tutorial audio uses one bundled local MP3 sample. The highlighted word is controlled manually and does not synchronize with audio.',
    ReadingPlayerPresentationPhase.practiceReady =>
      'Ready for silent practice. Words will advance automatically at ${_lesson?.pace ?? 'selected pace'}.',
    ReadingPlayerPresentationPhase.practicePreview =>
      'Reading at ${_lesson?.pace ?? 'selected pace'}. The app is advancing words automatically.',
    ReadingPlayerPresentationPhase.previewComplete =>
      'Practice complete.',
  };

  void _saveSession({required int wordsRead, required bool isCompleted}) {
    final services = AppServices.maybeOf(context);
    if (services == null) return;
    if (!services.authState.isAuthenticated) return;
    final accessToken = services.authState.accessToken;
    if (accessToken == null) return;

    final lesson = _lesson;
    if (lesson == null) return;

    final startTime = _practiceStartTime ?? DateTime.now();
    final durationSeconds = DateTime.now().difference(startTime).inSeconds;
    final sessionsApi = services.sessionsApi;

    // The local preview model has no server revision ID yet.
    // Using a nil-UUID placeholder; this will be replaced when the reading
    // player is wired to real lesson revisions in a later sprint.
    const placeholderRevisionId = '00000000-0000-0000-0000-000000000000';
    final request = SaveSessionRequest(
      eventId: _sessionEventId,
      lessonRevisionId: placeholderRevisionId,
      readingMode: 'practice',
      paceWpm: _wpm,
      wordsRead: wordsRead,
      durationSeconds: durationSeconds,
      isCompleted: isCompleted,
      occurredAt: startTime,
    );

    sessionsApi
        .saveSession(request, accessToken: accessToken)
        .then((sessionId) {
          if (sessionId != null && mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Session saved!'),
                duration: Duration(seconds: 2),
              ),
            );
          }
        })
        .catchError((Object error) {
          developer.log(
            'Failed to save reading session: $error',
            name: 'ReadingPlayerScreen',
          );
        });
  }

  bool get _isTutorialPhase => {
    ReadingPlayerPresentationPhase.ready,
    ReadingPlayerPresentationPhase.tutorialPreview,
    ReadingPlayerPresentationPhase.tutorialPaused,
  }.contains(_phase);

  Future<void> _runAudioAction(Future<void> Function() action) async {
    if (_audioBusy) return;
    if (!mounted) return;
    setState(() {
      _audioBusy = true;
      _audioError = null;
    });
    try {
      await action();
    } on TutorialAudioPlaybackException catch (error) {
      if (!mounted) return;
      setState(() {
        _audioError = error.message;
        _audioPlaying = false;
        if (_isTutorialPhase) {
          _phase = ReadingPlayerPresentationPhase.ready;
        }
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _audioError = 'Tutorial audio is not available right now.';
        _audioPlaying = false;
        if (_isTutorialPhase) {
          _phase = ReadingPlayerPresentationPhase.ready;
        }
      });
    } finally {
      if (mounted) {
        setState(() => _audioBusy = false);
      }
    }
  }

  Future<void> _startTutorialAudio() async {
    if (_audioPlaying) return;
    await _runAudioAction(() async {
      if (!_audioLoaded) {
        await _audioService.load();
        _audioLoaded = true;
      }
      await _audioService.play();
      _audioPlaying = true;
      _phase = ReadingPlayerPresentationPhase.tutorialPreview;
    });
    if (_phase == ReadingPlayerPresentationPhase.tutorialPreview) {
      _startWordTick();
    }
  }

  Future<void> _pauseTutorialAudio() async {
    _stopWordTick();
    await _runAudioAction(() async {
      await _audioService.pause();
      _audioPlaying = false;
      _phase = ReadingPlayerPresentationPhase.tutorialPaused;
    });
  }

  Future<void> _resumeTutorialAudio() async {
    if (_audioPlaying) return;
    await _runAudioAction(() async {
      await _audioService.resume();
      _audioPlaying = true;
      _phase = ReadingPlayerPresentationPhase.tutorialPreview;
    });
    if (_phase == ReadingPlayerPresentationPhase.tutorialPreview) {
      _startWordTick();
    }
  }

  Future<void> _stopTutorialAudio() async {
    _stopWordTick();
    await _runAudioAction(() async {
      await _audioService.stop();
      _audioPlaying = false;
    });
  }

  Future<void> _disposeAudio() async {
    await _audioService.stop();
    await _audioService.dispose();
  }

  void _goHome() async {
    _stopWordTick();
    await _stopTutorialAudio();
    if (!mounted) return;
    Navigator.of(
      context,
    ).pushNamedAndRemoveUntil(AppRoutes.home, (route) => false);
  }

  void _changeSetup() async {
    _stopWordTick();
    await _stopTutorialAudio();
    if (!mounted) return;
    Navigator.of(
      context,
    ).pushNamedAndRemoveUntil(AppRoutes.paceSelection, (route) => false);
  }

  @override
  Widget build(BuildContext context) {
    if (!_hasUsableLesson) {
      return ProlificScaffold(
        title: 'Reading player',
        currentRoute: AppRoutes.readingPlayer,
        showPrimaryNavigation: true,
        child: Column(
          children: [
            const StatePanel(
              kind: StatePanelKind.error,
              title: 'This lesson preview is not available',
              message:
                  'Choose a lesson setup again. No reading progress was started or saved.',
            ),
            Wrap(
              spacing: ProlificSpacing.sm,
              runSpacing: ProlificSpacing.sm,
              alignment: WrapAlignment.center,
              children: [
                PrimaryButton(label: 'Change setup', onPressed: _changeSetup),
                SecondaryButton(label: 'Return home', onPressed: _goHome),
              ],
            ),
          ],
        ),
      );
    }

    final lesson = _lesson!;
    final isComplete = _phase == ReadingPlayerPresentationPhase.previewComplete;
    final isPracticePhase =
        _phase == ReadingPlayerPresentationPhase.practicePreview;
    final tutorialPhase = {
      ReadingPlayerPresentationPhase.ready,
      ReadingPlayerPresentationPhase.tutorialPreview,
      ReadingPlayerPresentationPhase.tutorialPaused,
    }.contains(_phase);
    final showManualControls =
        _isTutorialPhase &&
        _phase != ReadingPlayerPresentationPhase.tutorialPaused;

    final metadata = PlayerMetadataPanel(lesson: lesson, phase: _phase);
    final readingContent = Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(lesson.title, style: Theme.of(context).textTheme.headlineMedium),
        const SizedBox(height: ProlificSpacing.xs),
        Text(_phaseExplanation, style: Theme.of(context).textTheme.bodyLarge),
        if (_audioError != null) ...[
          const SizedBox(height: ProlificSpacing.sm),
          Text(
            _audioError!,
            key: const Key('tutorial-audio-error'),
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: Theme.of(context).colorScheme.error,
            ),
          ),
        ],
        const SizedBox(height: ProlificSpacing.lg),
        ReadingSurface(lesson: lesson, selectedWordIndex: _selectedWordIndex),
        const SizedBox(height: ProlificSpacing.md),
        ReadingPositionLabel(
          current: _selectedWordIndex + 1,
          total: lesson.words.length,
        ),
        const SizedBox(height: ProlificSpacing.md),
        if (!isComplete) ...[
          PlayerControlBar(
            showManualControls: showManualControls,
            canMovePrevious: showManualControls && _selectedWordIndex > 0,
            canMoveNext:
                showManualControls &&
                _selectedWordIndex < lesson.words.length - 1,
            onPrevious: _previousWord,
            onNext: _nextWord,
            onRestart: _restart,
            isPaused: _practicePaused,
            onPause: isPracticePhase && !_practicePaused
                ? _pausePractice
                : null,
            onResume: isPracticePhase && _practicePaused
                ? _resumePractice
                : null,
          ),
          const SizedBox(height: ProlificSpacing.lg),
          Wrap(
            spacing: ProlificSpacing.sm,
            runSpacing: ProlificSpacing.sm,
            children: [
              PrimaryButton(
                label: _primaryLabel,
                isLoading: _audioBusy,
                onPressed: _audioBusy
                    ? null
                    : (_phase == ReadingPlayerPresentationPhase.previewComplete
                          ? null
                          : _primaryPhaseAction),
              ),
              if (tutorialPhase)
                SecondaryButton(
                  label: 'Continue to practice',
                  icon: Icons.arrow_forward_rounded,
                  onPressed: _audioBusy ? null : _continueToPractice,
                ),
            ],
          ),
        ] else
          Wrap(
            spacing: ProlificSpacing.sm,
            runSpacing: ProlificSpacing.sm,
            children: [
              PrimaryButton(
                label: 'Restart preview',
                icon: Icons.restart_alt_rounded,
                onPressed: _restart,
              ),
              SecondaryButton(label: 'Change setup', onPressed: _changeSetup),
              SecondaryButton(label: 'Return home', onPressed: _goHome),
            ],
          ),
        const SizedBox(height: ProlificSpacing.xl),
        Wrap(
          spacing: ProlificSpacing.sm,
          runSpacing: ProlificSpacing.sm,
          children: [
            TextButton(
              onPressed: _changeSetup,
              child: const Text('Change setup'),
            ),
            TextButton(onPressed: _goHome, child: const Text('Exit to home')),
          ],
        ),
      ],
    );

    return ProlificScaffold(
      title: 'Reading player preview',
      currentRoute: AppRoutes.readingPlayer,
      showPrimaryNavigation: true,
      contentMaxWidth: ProlificSizes.contentMaxWidth,
      child: ProlificResponsiveBuilder(
        builder: (context, constraints, windowClass) {
          return SingleChildScrollView(
            child: windowClass == ProlificWindowClass.expanded
                ? Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      SizedBox(width: 260, child: metadata),
                      const SizedBox(width: ProlificSpacing.xl),
                      Expanded(
                        child: Align(
                          alignment: Alignment.topCenter,
                          child: ConstrainedBox(
                            constraints: const BoxConstraints(
                              maxWidth: ProlificSizes.readingMaxWidth,
                            ),
                            child: readingContent,
                          ),
                        ),
                      ),
                    ],
                  )
                : Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      metadata,
                      const SizedBox(height: ProlificSpacing.lg),
                      readingContent,
                    ],
                  ),
          );
        },
      ),
    );
  }
}

String _generateUuid() {
  // RFC 4122 v4 UUID generated from dart:math random values.
  final now = DateTime.now().microsecondsSinceEpoch;
  final r = List<int>.generate(
    16,
    (index) => (now * 31 + index * 7919).hashCode & 0xff,
  );
  r[6] = (r[6] & 0x0f) | 0x40;
  r[8] = (r[8] & 0x3f) | 0x80;
  String hex(int byte) => byte.toRadixString(16).padLeft(2, '0');
  return '${hex(r[0])}${hex(r[1])}${hex(r[2])}${hex(r[3])}-'
      '${hex(r[4])}${hex(r[5])}-'
      '${hex(r[6])}${hex(r[7])}-'
      '${hex(r[8])}${hex(r[9])}-'
      '${hex(r[10])}${hex(r[11])}${hex(r[12])}${hex(r[13])}${hex(r[14])}${hex(r[15])}';
}
