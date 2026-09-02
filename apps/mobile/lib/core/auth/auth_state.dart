import 'package:flutter/foundation.dart';

import '../api/auth_api_service.dart';

class AuthState extends ChangeNotifier {
  AuthResult? _currentUser;

  AuthResult? get currentUser => _currentUser;

  bool get isAuthenticated => _currentUser != null;

  String? get accessToken => _currentUser?.accessToken;

  void setUser(AuthResult user) {
    _currentUser = user;
    notifyListeners();
  }

  void clearUser() {
    _currentUser = null;
    notifyListeners();
  }
}
