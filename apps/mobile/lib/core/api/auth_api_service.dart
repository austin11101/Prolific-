import 'dart:convert';

import 'package:http/http.dart' as http;

class AuthResult {
  const AuthResult({
    required this.userId,
    required this.email,
    required this.displayName,
    required this.accessToken,
    required this.refreshToken,
  });

  factory AuthResult.fromJson(Map<String, dynamic> json) {
    return AuthResult(
      userId: json['userId'] as String,
      email: json['email'] as String,
      displayName: json['displayName'] as String,
      accessToken: json['accessToken'] as String,
      refreshToken: json['refreshToken'] as String,
    );
  }

  final String userId;
  final String email;
  final String displayName;
  final String accessToken;
  final String refreshToken;
}

class AuthApiException implements Exception {
  const AuthApiException(this.message, {this.statusCode});

  final String message;
  final int? statusCode;

  @override
  String toString() => 'AuthApiException($statusCode): $message';
}

abstract interface class AuthApiService {
  Future<AuthResult> register({
    required String email,
    required String displayName,
    required String password,
  });

  Future<AuthResult> login({
    required String email,
    required String password,
  });
}

class HttpAuthApiService implements AuthApiService {
  HttpAuthApiService({String? baseUrl, http.Client? client})
    : _baseUrl = baseUrl ?? 'http://localhost:3000',
      _client = client ?? http.Client();

  final String _baseUrl;
  final http.Client _client;

  @override
  Future<AuthResult> register({
    required String email,
    required String displayName,
    required String password,
  }) async {
    final response = await _client.post(
      Uri.parse('$_baseUrl/api/v1/auth/register'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'email': email,
        'displayName': displayName,
        'password': password,
      }),
    );
    return _parseAuthResponse(response);
  }

  @override
  Future<AuthResult> login({
    required String email,
    required String password,
  }) async {
    final response = await _client.post(
      Uri.parse('$_baseUrl/api/v1/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );
    return _parseAuthResponse(response);
  }

  AuthResult _parseAuthResponse(http.Response response) {
    final body = jsonDecode(response.body) as Map<String, dynamic>;

    if (response.statusCode == 200 || response.statusCode == 201) {
      final data = body['data'] as Map<String, dynamic>;
      return AuthResult.fromJson(data);
    }

    if (response.statusCode == 409) {
      throw const AuthApiException(
        'An account with this email address already exists.',
        statusCode: 409,
      );
    }

    if (response.statusCode == 401) {
      throw const AuthApiException(
        'The email address or password is incorrect.',
        statusCode: 401,
      );
    }

    final message =
        (body['message'] as String?) ?? 'An unexpected error occurred.';
    throw AuthApiException(message, statusCode: response.statusCode);
  }
}
