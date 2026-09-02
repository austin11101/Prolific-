import 'dart:convert';

import 'package:http/http.dart' as http;

class SaveSessionRequest {
  const SaveSessionRequest({
    required this.eventId,
    required this.lessonRevisionId,
    required this.readingMode,
    required this.paceWpm,
    required this.wordsRead,
    required this.durationSeconds,
    required this.isCompleted,
    required this.occurredAt,
  });

  final String eventId;
  final String lessonRevisionId;
  final String readingMode;
  final int paceWpm;
  final int wordsRead;
  final int durationSeconds;
  final bool isCompleted;
  final DateTime occurredAt;

  Map<String, dynamic> toJson() => {
    'eventId': eventId,
    'lessonRevisionId': lessonRevisionId,
    'readingMode': readingMode,
    'paceWpm': paceWpm,
    'wordsRead': wordsRead,
    'durationSeconds': durationSeconds,
    'isCompleted': isCompleted,
    'occurredAt': occurredAt.toUtc().toIso8601String(),
  };
}

class SessionsApiService {
  SessionsApiService({String? baseUrl, http.Client? client})
    : _baseUrl = baseUrl ?? 'http://localhost:3000',
      _client = client ?? http.Client();

  final String _baseUrl;
  final http.Client _client;

  Future<String?> saveSession(
    SaveSessionRequest request, {
    required String accessToken,
  }) async {
    try {
      final response = await _client.post(
        Uri.parse('$_baseUrl/api/v1/sessions'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $accessToken',
        },
        body: jsonEncode(request.toJson()),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final body = jsonDecode(response.body) as Map<String, dynamic>;
        final data = body['data'] as Map<String, dynamic>;
        return data['sessionId'] as String;
      }
      return null;
    } catch (_) {
      return null;
    }
  }
}
