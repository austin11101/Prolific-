import 'dart:async';

/// Drives word-by-word advancement at a given words-per-minute rate.
///
/// This service wraps [Timer] so that reading-player UI code can remain free
/// of direct timer construction, which satisfies the architectural constraint
/// that prohibits `Timer(` inside `lib/features/reading_player/`.
abstract interface class WpmTimerService {
  /// Whether a tick sequence is currently active.
  bool get isActive;

  /// Start periodic ticks at [wpm] words per minute.
  ///
  /// [onTick] is called once per word interval.
  /// Any previously running sequence is stopped first.
  void start({required int wpm, required VoidCallback onTick});

  /// Stop the current tick sequence, if any.
  void stop();

  /// Release resources. Must be called once when the owner is disposed.
  void dispose();
}

typedef VoidCallback = void Function();

/// Default [WpmTimerService] backed by [Timer.periodic].
class PeriodicWpmTimerService implements WpmTimerService {
  Timer? _timer;

  @override
  bool get isActive => _timer?.isActive ?? false;

  @override
  void start({required int wpm, required VoidCallback onTick}) {
    stop();
    final interval = Duration(milliseconds: (60000 / wpm).round());
    _timer = Timer.periodic(interval, (_) => onTick());
  }

  @override
  void stop() {
    _timer?.cancel();
    _timer = null;
  }

  @override
  void dispose() => stop();
}
