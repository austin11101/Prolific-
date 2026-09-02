import 'dart:async';

import 'package:just_audio/just_audio.dart';

abstract interface class TutorialAudioService {
  Future<void> load();

  Future<void> play();

  Future<void> pause();

  Future<void> resume();

  Future<void> stop();

  Future<void> seekToStart();

  Future<void> dispose();
}

abstract final class TutorialAudioAssets {
  static const tutorialSample = 'assets/audio/tutorial_sample.mp3';
}

class TutorialAudioPlaybackException implements Exception {
  const TutorialAudioPlaybackException(this.message);

  final String message;

  @override
  String toString() => message;
}

class JustAudioTutorialAudioService implements TutorialAudioService {
  JustAudioTutorialAudioService({
    required String assetPath,
    AudioPlayer? player,
  }) : _assetPath = assetPath,
       _player = player ?? AudioPlayer() {
    _playerStateSubscription = _player.playerStateStream.listen((state) {
      if (state.processingState == ProcessingState.completed) {
        _playing = false;
        unawaited(_player.seek(Duration.zero));
      }
    });
  }

  final String _assetPath;
  final AudioPlayer _player;
  late final StreamSubscription<PlayerState> _playerStateSubscription;

  bool _loaded = false;
  bool _playing = false;
  bool _disposed = false;

  @override
  Future<void> load() async {
    _ensurePlayable();
    if (_loaded) return;
    try {
      await _player.setAsset(_assetPath);
      _loaded = true;
    } catch (_) {
      _loaded = false;
      throw const TutorialAudioPlaybackException(
        'Tutorial audio could not be loaded.',
      );
    }
  }

  @override
  Future<void> play() async {
    _ensurePlayable();
    if (_playing) return;
    await load();
    try {
      await _player.seek(Duration.zero);
      unawaited(_player.play());
      _playing = true;
    } catch (_) {
      _playing = false;
      throw const TutorialAudioPlaybackException(
        'Tutorial audio could not be played.',
      );
    }
  }

  @override
  Future<void> pause() async {
    if (_disposed || !_playing) return;
    await _player.pause();
    _playing = false;
  }

  @override
  Future<void> resume() async {
    _ensurePlayable();
    if (_playing) return;
    await load();
    try {
      unawaited(_player.play());
      _playing = true;
    } catch (_) {
      _playing = false;
      throw const TutorialAudioPlaybackException(
        'Tutorial audio could not be resumed.',
      );
    }
  }

  @override
  Future<void> stop() async {
    if (_disposed) return;
    await _player.stop();
    _playing = false;
  }

  @override
  Future<void> seekToStart() async {
    if (_disposed) return;
    await load();
    await _player.seek(Duration.zero);
  }

  @override
  Future<void> dispose() async {
    if (_disposed) return;
    _disposed = true;
    _playing = false;
    await _playerStateSubscription.cancel();
    await _player.dispose();
  }

  void _ensurePlayable() {
    if (_disposed) {
      throw const TutorialAudioPlaybackException(
        'Tutorial audio is no longer available on this screen.',
      );
    }
  }
}
