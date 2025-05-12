from django.apps import AppConfig


class WalletConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'wallet'

    def ready(self):
        """
        Импортируем и регистрируем сигналы
        """
        import wallet.signals  # noqa
