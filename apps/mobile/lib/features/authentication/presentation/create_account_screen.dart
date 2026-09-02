import 'package:flutter/material.dart';

import '../../../app/navigation/app_routes.dart';
import '../../../app/theme/design_tokens.dart';
import '../../../core/api/auth_api_service.dart';
import '../../../core/auth/auth_state.dart';
import '../../../core/presentation/layout/prolific_scaffold.dart';
import '../../../core/presentation/widgets/app_card.dart';
import '../../../core/presentation/widgets/prolific_buttons.dart';
import '../../../core/services/app_services.dart';

class CreateAccountScreen extends StatefulWidget {
  const CreateAccountScreen({super.key, this.authApi, this.authState});

  /// Injected for tests; if null the screen reads from [AppServices].
  final AuthApiService? authApi;
  final AuthState? authState;

  @override
  State<CreateAccountScreen> createState() => _CreateAccountScreenState();
}

class _CreateAccountScreenState extends State<CreateAccountScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _passwordHidden = true;
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  AuthApiService get _authApi =>
      widget.authApi ?? AppServices.of(context).authApi;

  AuthState get _authState =>
      widget.authState ?? AppServices.of(context).authState;

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final result = await _authApi.register(
        email: _emailController.text.trim(),
        displayName: _nameController.text.trim(),
        password: _passwordController.text,
      );
      _authState.setUser(result);
      if (!mounted) return;
      Navigator.of(context).pushNamedAndRemoveUntil(
        AppRoutes.home,
        (route) => false,
      );
    } on AuthApiException catch (e) {
      setState(() => _errorMessage = e.message);
    } catch (_) {
      setState(() => _errorMessage = 'Something went wrong. Please try again.');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return ProlificScaffold(
      title: 'Create account',
      contentMaxWidth: ProlificSizes.readingMaxWidth,
      child: SingleChildScrollView(
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                'Create a free account',
                style: Theme.of(context).textTheme.headlineMedium,
              ),
              const SizedBox(height: ProlificSpacing.sm),
              Text(
                'Create a free account to save your progress and unlock offline reading.',
                style: Theme.of(context).textTheme.bodyLarge,
              ),
              const SizedBox(height: ProlificSpacing.lg),
              AppCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    TextFormField(
                      controller: _nameController,
                      textCapitalization: TextCapitalization.words,
                      autofillHints: const [AutofillHints.name],
                      textInputAction: TextInputAction.next,
                      decoration: const InputDecoration(
                        labelText: 'Name',
                        prefixIcon: Icon(Icons.person_outline_rounded),
                      ),
                      validator: _validateRequiredName,
                    ),
                    const SizedBox(height: ProlificSpacing.md),
                    TextFormField(
                      controller: _emailController,
                      keyboardType: TextInputType.emailAddress,
                      autofillHints: const [AutofillHints.email],
                      textInputAction: TextInputAction.next,
                      decoration: const InputDecoration(
                        labelText: 'Email address',
                        prefixIcon: Icon(Icons.mail_outline_rounded),
                      ),
                      validator: _validateEmail,
                    ),
                    const SizedBox(height: ProlificSpacing.md),
                    TextFormField(
                      controller: _passwordController,
                      obscureText: _passwordHidden,
                      autofillHints: const [AutofillHints.newPassword],
                      textInputAction: TextInputAction.next,
                      decoration: InputDecoration(
                        labelText: 'Password',
                        prefixIcon: const Icon(Icons.lock_outline_rounded),
                        suffixIcon: IconButton(
                          tooltip: _passwordHidden
                              ? 'Show password'
                              : 'Hide password',
                          icon: Icon(
                            _passwordHidden
                                ? Icons.visibility_outlined
                                : Icons.visibility_off_outlined,
                          ),
                          onPressed: () => setState(
                            () => _passwordHidden = !_passwordHidden,
                          ),
                        ),
                      ),
                      validator: _validateNewPassword,
                    ),
                    const SizedBox(height: ProlificSpacing.md),
                    TextFormField(
                      obscureText: true,
                      autofillHints: const [AutofillHints.newPassword],
                      textInputAction: TextInputAction.done,
                      onFieldSubmitted: (_) => _submit(),
                      decoration: const InputDecoration(
                        labelText: 'Confirm password',
                        prefixIcon: Icon(Icons.verified_user_outlined),
                      ),
                      validator: (value) => _validatePasswordMatch(
                        value,
                        _passwordController.text,
                      ),
                    ),
                    if (_errorMessage != null) ...[
                      const SizedBox(height: ProlificSpacing.sm),
                      Text(
                        _errorMessage!,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: Theme.of(context).colorScheme.error,
                        ),
                      ),
                    ],
                    const SizedBox(height: ProlificSpacing.md),
                    PrimaryButton(
                      label: 'Create Account',
                      icon: Icons.person_add_alt_rounded,
                      isLoading: _isLoading,
                      onPressed: _isLoading ? null : _submit,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: ProlificSpacing.lg),
              TextButton(
                onPressed: () => Navigator.of(
                  context,
                ).pushReplacementNamed(AppRoutes.signIn),
                child: const Text('I already have an account'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

String? _validateRequiredName(String? value) {
  if ((value ?? '').trim().isEmpty) return 'Enter your name.';
  return null;
}

String? _validateEmail(String? value) {
  final email = value?.trim() ?? '';
  if (email.isEmpty) return 'Enter your email address.';
  if (!email.contains('@') || !email.contains('.')) {
    return 'Enter a valid email address.';
  }
  return null;
}

String? _validateNewPassword(String? value) {
  final password = value ?? '';
  if (password.isEmpty) return 'Create a password.';
  if (password.length < 8) return 'Use at least 8 characters.';
  return null;
}

String? _validatePasswordMatch(String? value, String password) {
  if ((value ?? '').isEmpty) return 'Confirm your password.';
  if (value != password) return 'Passwords do not match.';
  return null;
}
