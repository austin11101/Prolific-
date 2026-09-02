import 'package:flutter/material.dart';

import 'app/app.dart';

void main() {
  runApp(const ProlificApp());
}

/// Backwards-compatible root name retained for existing embedder and smoke tests.
class MainApp extends ProlificApp {
  const MainApp({super.key});
}
