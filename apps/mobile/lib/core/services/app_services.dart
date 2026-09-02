import 'package:flutter/material.dart';

import '../api/auth_api_service.dart';
import '../api/sessions_api_service.dart';
import '../auth/auth_state.dart';

/// Provides app-level services to the widget tree.
class AppServices extends InheritedWidget {
  const AppServices({
    required this.authApi,
    required this.authState,
    required this.sessionsApi,
    required super.child,
    super.key,
  });

  final AuthApiService authApi;
  final AuthState authState;
  final SessionsApiService sessionsApi;

  static AppServices of(BuildContext context) {
    final result = context.dependOnInheritedWidgetOfExactType<AppServices>();
    assert(result != null, 'No AppServices found in context');
    return result!;
  }

  static AppServices? maybeOf(BuildContext context) {
    return context.dependOnInheritedWidgetOfExactType<AppServices>();
  }

  @override
  bool updateShouldNotify(AppServices oldWidget) =>
      authApi != oldWidget.authApi ||
      authState != oldWidget.authState ||
      sessionsApi != oldWidget.sessionsApi;
}
