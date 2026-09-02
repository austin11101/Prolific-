import 'package:flutter/material.dart';

import '../../features/authentication/presentation/create_account_screen.dart';
import '../../features/authentication/presentation/sign_in_screen.dart';
import '../../features/home/presentation/home_screen.dart';
import '../../features/launch/presentation/splash_screen.dart';
import '../../features/lesson_setup/presentation/difficulty_selection_screen.dart';
import '../../features/lesson_setup/presentation/language_selection_screen.dart';
import '../../features/lesson_setup/presentation/lesson_preview_screen.dart';
import '../../features/lesson_setup/presentation/pace_selection_screen.dart';
import '../../features/onboarding/presentation/access_choice_screen.dart';
import '../../features/onboarding/presentation/welcome_screen.dart';
import '../../features/reading_player/presentation/reading_player_model.dart';
import '../../features/reading_player/presentation/reading_player_screen.dart';
import '../../features/topics/presentation/topic_details_screen.dart';
import '../../features/topics/presentation/topic_preview.dart';
import '../../features/topics/presentation/topics_screen.dart';
import 'app_routes.dart';

abstract final class AppRouter {
  static Route<void> onGenerateRoute(RouteSettings settings) {
    final Widget screen = switch (settings.name) {
      AppRoutes.splash => const SplashScreen(),
      AppRoutes.welcome => const WelcomeScreen(),
      AppRoutes.accessChoice => const AccessChoiceScreen(),
      AppRoutes.signIn => const SignInScreen(),
      AppRoutes.createAccount => const CreateAccountScreen(),
      AppRoutes.home => const HomeScreen(),
      AppRoutes.topics => const TopicsScreen(),
      AppRoutes.topicDetails => TopicDetailsScreen(
        topic: settings.arguments is TopicPreview
            ? settings.arguments! as TopicPreview
            : null,
      ),
      AppRoutes.languageSelection => const LanguageSelectionScreen(),
      AppRoutes.difficultySelection => const DifficultySelectionScreen(),
      AppRoutes.paceSelection => const PaceSelectionScreen(),
      AppRoutes.lessonPreview => const LessonPreviewScreen(),
      AppRoutes.readingPlayer => ReadingPlayerScreen(
        arguments: settings.arguments is ReadingPlayerArguments
            ? settings.arguments! as ReadingPlayerArguments
            : null,
      ),
      _ => const WelcomeScreen(
        notice: 'That page is not available. You are back at the welcome page.',
      ),
    };

    return MaterialPageRoute<void>(builder: (_) => screen, settings: settings);
  }
}
