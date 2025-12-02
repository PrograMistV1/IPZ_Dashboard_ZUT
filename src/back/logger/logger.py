import logging
import os
import yaml
#from datetime import datetime

class BackendLogger:
    _instance = None

    def new(cls):
        """Singleton – aby tylko jeden logger działał w całej aplikacji."""
        if cls._instance is None:
            cls._instance = super().new(cls)
            cls._instance._load_config()
            cls._instance._init_logger()
        return cls._instance

    def _load_config(self):
        """Wczytanie konfiguracji z pliku YAML."""
        config_path = os.path.join(os.path.dirname(file), "log_config.yaml")

        try:
            with open(config_path, "r", encoding="utf-8") as f:
                self.config = yaml.safe_load(f)
        except FileNotFoundError:
            raise RuntimeError(f"Config file not found: {config_path}")
        except yaml.YAMLError as e:
            raise RuntimeError(f"YAML config load error: {e}")

    def _init_logger(self):
        """Inicjalizacja loggera zgodnie z konfiguracją."""
        log_file = self.config.get("log_file", "app.log")
        log_level = self.config.get("level", "INFO").upper()
        fmt = self.config.get("format")
        date_fmt = self.config.get("date_format")

        os.makedirs(os.path.dirname(log_file), exist_ok=True)

        self.logger = logging.getLogger("BackendLogger")
        self.logger.setLevel(log_level)

        handler = logging.FileHandler(log_file, encoding="utf-8")
        formatter = logging.Formatter(fmt, date_fmt)
        handler.setFormatter(formatter)

        if not self.logger.handlers:
            self.logger.addHandler(handler)

    def debug(self, module: str, msg: str):
        try:
            self.logger.debug(f"[{module}] {msg}")
        except Exception as e:
            print(f"Logger DEBUG error: {e}")

    def info(self, module: str, msg: str):
        try:
            self.logger.info(f"[{module}] {msg}")
        except Exception as e:
            print(f"Logger INFO error: {e}")

    def error(self, module: str, msg: str):
        try:
            self.logger.error(f"[{module}] {msg}")
        except Exception as e:
            print(f"Logger ERROR error: {e}")