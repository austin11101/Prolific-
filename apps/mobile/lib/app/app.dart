import 'package:flutter/material.dart';

import '../core/api/auth_api_service.dart';
import '../core/api/sessions_api_service.dart';
import '../core/auth/auth_state.dart';
import '../core/services/app_services.dart';
import 'navigation/app_router.dart';
import 'navigation/app_routes.dart';
import 'theme/prolific_theme.dart';

class ProlificApp extends StatefulWidget {
  const ProlificApp({super.key});

  @override
  State<ProlificApp> createState() => _ProlificAppState();
}

class _ProlificAppState extends State<ProlificApp> {
  final AuthApiService _authApi = HttpAuthApiService();
  final AuthState _authState = AuthState();
  final SessionsApiService _sessionsApi = SessionsApiService();

  @override
  void dispose() {
    _authState.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AppServices(
      authApi: _authApi,
      authState: _authState,
      sessionsApi: _sessionsApi,
      child: ListenableBuilder(
        listenable: _authState,
        builder: (context, _) {
          return MaterialApp(
            title: 'Prolific',
            debugShowCheckedModeBanner: false,
            theme: ProlificTheme.light(),
            initialRoute: AppRoutes.splash,
            onGenerateRoute: AppRouter.onGenerateRoute,
          );
        },
      ),
    );
  }
}
